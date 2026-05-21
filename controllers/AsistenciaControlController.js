const { executeQuery } = require('../config/database');
const {
  geometryFromUbicacion,
  isInsideGeometry,
  isAssignedDay,
} = require('../utils/geofence');

const TABLE = 'asistencias_control';
const MAX_COMENTARIO = 500;
const COMENTARIO_DEFAULT_A_TIEMPO = 'Tiempo correcto';

const todayDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const normalizeComentario = (comentario, estadoFinal) => {
  const trimmed = comentario != null ? String(comentario).trim().slice(0, MAX_COMENTARIO) : '';
  if (trimmed) return trimmed;
  if (estadoFinal === 'a_tiempo') return COMENTARIO_DEFAULT_A_TIEMPO;
  return null;
};

const fetchAsignacionCompleta = async (id_asignacion) => {
  const rows = await executeQuery(
    `SELECT a.id, a.id_personal_trabajador, a.dias, a.hora_entrada, a.hora_salida,
            a.ventana_desde, a.ventana_hasta, a.creado_por, a.activo,
            ug.tipo AS ubicacion_tipo,
            ug.centro_lat, ug.centro_lng, ug.radio,
            ug.esquina1_lat, ug.esquina1_lng, ug.esquina2_lat, ug.esquina2_lng
     FROM asignaciones_control a
     LEFT JOIN ubicaciones_geograficas ug ON ug.id = a.id_ubicacion_geografica
     WHERE a.id = ?`,
    [id_asignacion]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return { ...row, geometry: geometryFromUbicacion(row) };
};

const fetchMarcajesHoy = async (id_asignacion, userId) => {
  const hoy = todayDateStr();
  return executeQuery(
    `SELECT id, tipo, estado, comentario, minutos_tarde, fecha_hora
     FROM ${TABLE}
     WHERE id_asignacion = ? AND id_personal_trabajador = ? AND DATE(fecha_hora) = ?`,
    [id_asignacion, userId, hoy]
  );
};

// Listar asistencias (filtros según rol del token)
const listAsistencias = async (req, res) => {
  try {
    const user = req.user || {};
    const { asignacionId, tipo, fecha } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (user.role === 'trabajador') {
      where += ' AND a.id_personal_trabajador = ?';
      params.push(user.id);
    } else if (user.role === 'area') {
      where += ' AND ac.creado_por = ?';
      params.push(user.id);
    } else if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Rol no autorizado' });
    } else {
      const { trabajadorId, creadorId } = req.query;
      if (trabajadorId) { where += ' AND a.id_personal_trabajador = ?'; params.push(trabajadorId); }
      if (creadorId) { where += ' AND ac.creado_por = ?'; params.push(creadorId); }
    }

    if (asignacionId) { where += ' AND a.id_asignacion = ?'; params.push(asignacionId); }
    if (tipo) { where += ' AND a.tipo = ?'; params.push(tipo); }
    if (fecha) {
      where += ' AND DATE(a.fecha_hora) = ?';
      params.push(fecha);
    }

    const rows = await executeQuery(
      `SELECT a.id, a.id_asignacion, a.id_personal_trabajador, a.fecha_hora, a.lat, a.lng, a.tipo, a.estado, a.comentario, a.minutos_tarde,
              ac.dias, ac.hora_entrada, ac.hora_salida,
              pt.nombre_completo AS trabajador_nombre, pt.username AS trabajador_username,
              ug.nombre AS ubicacion_nombre, ug.descripcion AS ubicacion_descripcion
       FROM ${TABLE} a
       LEFT JOIN asignaciones_control ac ON ac.id = a.id_asignacion
       LEFT JOIN personal_trabajador pt ON pt.id = a.id_personal_trabajador
       LEFT JOIN ubicaciones_geograficas ug ON ug.id = ac.id_ubicacion_geografica
       ${where}
       ORDER BY a.fecha_hora DESC`,
      params
    );
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listando asistencias:', error);
    return res.status(500).json({ success: false, message: 'Error listando asistencias', error: error.message });
  }
};

// Reporte y métricas para encargado de área
const reporteEncargado = async (req, res) => {
  try {
    const user = req.user || {};
    if (user.role !== 'area') {
      return res.status(403).json({ success: false, message: 'Solo encargados de área pueden ver este reporte' });
    }

    const fecha = req.query.fecha || todayDateStr();
    const encargadoId = user.id;

    const trabajadores = await executeQuery(
      `SELECT pt.id, pt.nombre_completo, pt.username,
              GROUP_CONCAT(DISTINCT r.descripcion SEPARATOR ', ') AS roles_asignados
       FROM personal_trabajador pt
       LEFT JOIN personal_trabajador_roles ptr ON ptr.id_personal_trabajador = pt.id
       LEFT JOIN roles r ON r.id = ptr.id_rol
       WHERE pt.id_personal_area = ? AND pt.username != ?
       GROUP BY pt.id, pt.nombre_completo, pt.username
       ORDER BY pt.nombre_completo`,
      [encargadoId, user.username]
    );

    const asistencias = await executeQuery(
      `SELECT a.id, a.id_personal_trabajador, a.fecha_hora, a.tipo, a.estado, a.comentario, a.minutos_tarde,
              pt.nombre_completo AS trabajador_nombre, pt.username AS trabajador_username,
              ug.nombre AS ubicacion_nombre
       FROM ${TABLE} a
       INNER JOIN asignaciones_control ac ON ac.id = a.id_asignacion AND ac.creado_por = ?
       LEFT JOIN personal_trabajador pt ON pt.id = a.id_personal_trabajador
       LEFT JOIN ubicaciones_geograficas ug ON ug.id = ac.id_ubicacion_geografica
       WHERE DATE(a.fecha_hora) = ?
       ORDER BY a.fecha_hora ASC`,
      [encargadoId, fecha]
    );

    const porTrabajador = {};
    trabajadores.forEach((t) => {
      porTrabajador[t.id] = {
        id: t.id,
        nombre_completo: t.nombre_completo,
        username: t.username,
        roles_asignados: t.roles_asignados || '',
        entrada: null,
        salida: null,
      };
    });

    asistencias.forEach((a) => {
      if (!porTrabajador[a.id_personal_trabajador]) return;
      const row = porTrabajador[a.id_personal_trabajador];
      if (a.tipo === 'salida') {
        row.salida = a;
      } else {
        row.entrada = a;
      }
    });

    const detalle = Object.values(porTrabajador).map((t) => {
      const marcoEntrada = !!t.entrada;
      const marcoSalida = !!t.salida;
      const estado = t.entrada?.estado || null;
      return {
        ...t,
        marco_entrada: marcoEntrada,
        marco_salida: marcoSalida,
        hora_entrada: t.entrada?.fecha_hora || null,
        hora_salida: t.salida?.fecha_hora || null,
        estado_entrada: estado,
        minutos_tarde: t.entrada?.minutos_tarde ?? null,
        comentario: t.entrada?.comentario || t.salida?.comentario || null,
        ubicacion: t.entrada?.ubicacion_nombre || null,
      };
    });

    const total = detalle.length;
    const marcaronEntrada = detalle.filter((d) => d.marco_entrada).length;
    const noMarcaron = total - marcaronEntrada;
    const aTiempo = detalle.filter((d) => d.estado_entrada === 'a_tiempo').length;
    const tarde = detalle.filter((d) => d.estado_entrada === 'tarde').length;
    const conSalida = detalle.filter((d) => d.marco_salida).length;
    const sinSalida = detalle.filter((d) => d.marco_entrada && !d.marco_salida).length;
    const puntualidadPct = marcaronEntrada > 0 ? Math.round((aTiempo / marcaronEntrada) * 100) : 0;

    return res.json({
      success: true,
      data: {
        fecha,
        area: user.area_descripcion || null,
        metricas: {
          total_trabajadores: total,
          marcaron_entrada: marcaronEntrada,
          no_marcaron: noMarcaron,
          a_tiempo: aTiempo,
          tarde,
          con_salida: conSalida,
          sin_salida: sinSalida,
          puntualidad_pct: puntualidadPct,
        },
        trabajadores: detalle,
      },
    });
  } catch (error) {
    console.error('Error generando reporte encargado:', error);
    return res.status(500).json({ success: false, message: 'Error generando reporte', error: error.message });
  }
};

// Marcar asistencia (solo trabajador)
const marcarAsistencia = async (req, res) => {
  try {
    const user = req.user || {};
    if (user.role !== 'trabajador') {
      return res.status(403).json({ success: false, message: 'Solo trabajadores pueden marcar asistencia' });
    }

    const { id_asignacion, lat, lng, tipo, comentario } = req.body;
    const userId = user.id;

    if (!id_asignacion || !userId) {
      return res.status(400).json({ success: false, message: 'id_asignacion requerido' });
    }

    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'Ubicación GPS (lat, lng) requerida' });
    }

    const asig = await fetchAsignacionCompleta(id_asignacion);
    if (!asig || !asig.activo) {
      return res.status(404).json({ success: false, message: 'Asignación no encontrada o inactiva' });
    }
    if (asig.id_personal_trabajador !== userId) {
      return res.status(403).json({ success: false, message: 'No autorizado para esta asignación' });
    }

    if (!isAssignedDay(asig.dias)) {
      return res.status(400).json({ success: false, message: 'Hoy no es un día asignado para esta ubicación' });
    }

    if (!asig.geometry) {
      return res.status(400).json({ success: false, message: 'La ubicación no tiene geocerca configurada' });
    }

    const position = [parseFloat(lat), parseFloat(lng)];
    if (!isInsideGeometry(position, asig.geometry)) {
      return res.status(400).json({ success: false, message: 'Debes estar dentro del área asignada para marcar asistencia' });
    }

    const esEntrada = tipo !== 'salida';
    const tipoMarcaje = esEntrada ? 'entrada' : 'salida';

    const marcajesHoy = await fetchMarcajesHoy(id_asignacion, userId);
    const tieneEntrada = marcajesHoy.some((m) => m.tipo !== 'salida');
    const tieneSalida = marcajesHoy.some((m) => m.tipo === 'salida');

    if (esEntrada) {
      if (tieneEntrada) {
        return res.status(409).json({ success: false, message: 'Ya registraste entrada hoy para esta asignación' });
      }
    } else {
      if (!tieneEntrada) {
        return res.status(400).json({ success: false, message: 'Debes marcar entrada antes de marcar salida' });
      }
      if (tieneSalida) {
        return res.status(409).json({ success: false, message: 'Ya registraste salida hoy para esta asignación' });
      }
    }

    let estadoFinal = 'marcado';
    let minutosTarde = null;

    if (esEntrada && asig.ventana_hasta) {
      const now = new Date();
      const [vh, vm] = asig.ventana_hasta.toString().split(':').map(Number);
      const ventanaHastaDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), vh || 0, vm || 0, 0);
      if (now > ventanaHastaDate) {
        estadoFinal = 'tarde';
        minutosTarde = Math.floor((now - ventanaHastaDate) / (1000 * 60));
      } else {
        estadoFinal = 'a_tiempo';
      }
    }

    if (esEntrada && estadoFinal === 'tarde') {
      const comTrim = comentario != null ? String(comentario).trim() : '';
      if (!comTrim) {
        return res.status(400).json({
          success: false,
          message: 'Indica una descripción del motivo del retraso (ej. tráfico, emergencia)',
        });
      }
    }

    const comentarioFinal = normalizeComentario(comentario, esEntrada ? estadoFinal : null);

    const result = await executeQuery(
      `INSERT INTO ${TABLE} (id_asignacion, id_personal_trabajador, lat, lng, tipo, estado, comentario, minutos_tarde)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_asignacion, userId, lat, lng, tipoMarcaje, estadoFinal, comentarioFinal, minutosTarde]
    );

    const msg = estadoFinal === 'tarde'
      ? `Entrada registrada como tarde (${minutosTarde} min. de retraso)`
      : esEntrada ? 'Entrada registrada' : 'Salida registrada';

    return res.status(201).json({
      success: true,
      message: msg,
      data: {
        id: result.insertId,
        tipo: tipoMarcaje,
        estado: estadoFinal,
        minutos_tarde: minutosTarde,
        comentario: comentarioFinal,
      },
    });
  } catch (error) {
    console.error('Error marcando asistencia:', error);
    return res.status(500).json({ success: false, message: 'Error marcando asistencia', error: error.message });
  }
};

// Actualizar descripción/comentario de un marcaje propio (mismo día)
const actualizarComentario = async (req, res) => {
  try {
    const user = req.user || {};
    if (user.role !== 'trabajador') {
      return res.status(403).json({ success: false, message: 'Solo trabajadores pueden editar su descripción' });
    }

    const { id } = req.params;
    const { comentario } = req.body;
    const trimmed = comentario != null ? String(comentario).trim().slice(0, MAX_COMENTARIO) : '';

    if (!trimmed) {
      return res.status(400).json({ success: false, message: 'La descripción no puede estar vacía' });
    }

    const rows = await executeQuery(
      `SELECT id, id_personal_trabajador, tipo, estado, DATE(fecha_hora) AS fecha
       FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Registro no encontrado' });
    }
    const reg = rows[0];
    if (reg.id_personal_trabajador !== user.id) {
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }

    const hoy = todayDateStr();
    const fechaReg = reg.fecha instanceof Date
      ? todayDateStr(reg.fecha)
      : String(reg.fecha).slice(0, 10);
    if (fechaReg !== hoy) {
      return res.status(400).json({ success: false, message: 'Solo puedes editar marcajes del día actual' });
    }

    if (reg.tipo !== 'salida' && reg.estado === 'tarde' && trimmed.length < 5) {
      return res.status(400).json({ success: false, message: 'Describe el motivo del retraso (mínimo 5 caracteres)' });
    }

    await executeQuery(
      `UPDATE ${TABLE} SET comentario = ? WHERE id = ?`,
      [trimmed, id]
    );

    return res.json({ success: true, message: 'Descripción actualizada', data: { comentario: trimmed } });
  } catch (error) {
    console.error('Error actualizando comentario:', error);
    return res.status(500).json({ success: false, message: 'Error actualizando descripción', error: error.message });
  }
};

module.exports = {
  listAsistencias,
  marcarAsistencia,
  reporteEncargado,
  actualizarComentario,
};
