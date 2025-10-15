const { executeQuery } = require('../config/database');

const TABLE = 'asignaciones_control';

// Listar asignaciones (opcionalmente por trabajador o por creador)
const listAsignaciones = async (req, res) => {
  try {
    const { trabajadorId, creadorId } = req.query;
    const params = [];
    let where = 'WHERE a.activo = 1';

    if (trabajadorId) {
      where += ' AND a.id_personal_trabajador = ?';
      params.push(trabajadorId);
    }
    if (creadorId) {
      where += ' AND a.creado_por = ?';
      params.push(creadorId);
    }

    const rows = await executeQuery(
      `SELECT 
        a.id,
        a.id_personal_trabajador,
        pt.nombre_completo AS trabajador_nombre,
        a.id_ubicacion_geografica,
        ug.nombre AS ubicacion_nombre,
        ug.descripcion AS ubicacion_descripcion,
        ug.tipo AS ubicacion_tipo,
        ug.centro_lat, ug.centro_lng, ug.radio,
        ug.esquina1_lat, ug.esquina1_lng, ug.esquina2_lat, ug.esquina2_lng,
        a.dias,
        a.hora_entrada,
        a.hora_salida,
        a.ventana_desde,
        a.ventana_hasta,
        a.creado_por,
        pa.nombre_completo AS creador_nombre,
        a.fecha_creacion,
        a.fecha_actualizacion
      FROM ${TABLE} a
      LEFT JOIN personal_trabajador pt ON pt.id = a.id_personal_trabajador
      LEFT JOIN ubicaciones_geograficas ug ON ug.id = a.id_ubicacion_geografica
      LEFT JOIN personal_area pa ON pa.id = a.creado_por
      ${where}
      ORDER BY a.fecha_creacion DESC`,
      params
    );

    // Formatear geometría para facilitar al frontend
    const data = rows.map(r => {
      let geometry = null;
      if (r.ubicacion_tipo === 'circle' && r.centro_lat != null && r.centro_lng != null && r.radio != null) {
        geometry = {
          type: 'circle',
          center: [parseFloat(r.centro_lat), parseFloat(r.centro_lng)],
          radius: parseFloat(r.radio),
        };
      } else if (
        r.esquina1_lat != null && r.esquina1_lng != null &&
        r.esquina2_lat != null && r.esquina2_lng != null
      ) {
        geometry = {
          type: 'rectangle',
          start: [parseFloat(r.esquina1_lat), parseFloat(r.esquina1_lng)],
          end: [parseFloat(r.esquina2_lat), parseFloat(r.esquina2_lng)],
        };
      }
      return { ...r, geometry };
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error listando asignaciones:', error);
    return res.status(500).json({ success: false, message: 'Error listando asignaciones', error: error.message });
  }
};

// Crear asignación
const createAsignacion = async (req, res) => {
  try {
    const {
      id_personal_trabajador,
      id_ubicacion_geografica,
      dias,
      hora_entrada,
      hora_salida,
      ventana_desde,
      ventana_hasta
    } = req.body;

    if (!id_personal_trabajador || !id_ubicacion_geografica || !dias || !hora_entrada || !hora_salida) {
      return res.status(400).json({ success: false, message: 'Campos requeridos: trabajador, ubicación, días, hora_entrada, hora_salida' });
    }

    // Validar existencia de trabajador y ubicación
    const trabajador = await executeQuery('SELECT id FROM personal_trabajador WHERE id = ?', [id_personal_trabajador]);
    if (!trabajador.length) return res.status(400).json({ success: false, message: 'Trabajador no válido' });

    const ubicacion = await executeQuery('SELECT id FROM ubicaciones_geograficas WHERE id = ?', [id_ubicacion_geografica]);
    if (!ubicacion.length) return res.status(400).json({ success: false, message: 'Ubicación no válida' });

    const creado_por = req.user?.id || null;

    const result = await executeQuery(
      `INSERT INTO ${TABLE} (id_personal_trabajador, id_ubicacion_geografica, dias, hora_entrada, hora_salida, ventana_desde, ventana_hasta, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_personal_trabajador, id_ubicacion_geografica, dias, hora_entrada, hora_salida, ventana_desde || null, ventana_hasta || null, creado_por]
    );

    return res.status(201).json({ success: true, message: 'Asignación creada', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error creando asignación:', error);
    return res.status(500).json({ success: false, message: 'Error creando asignación', error: error.message });
  }
};

// Actualizar asignación
const updateAsignacion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_personal_trabajador,
      id_ubicacion_geografica,
      dias,
      hora_entrada,
      hora_salida,
      ventana_desde,
      ventana_hasta,
      activo
    } = req.body;

    const existing = await executeQuery(`SELECT id FROM ${TABLE} WHERE id = ?`, [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Asignación no encontrada' });

    await executeQuery(
      `UPDATE ${TABLE} SET 
        id_personal_trabajador = ?,
        id_ubicacion_geografica = ?,
        dias = ?,
        hora_entrada = ?,
        hora_salida = ?,
        ventana_desde = ?,
        ventana_hasta = ?,
        activo = COALESCE(?, activo)
      WHERE id = ?`,
      [id_personal_trabajador, id_ubicacion_geografica, dias, hora_entrada, hora_salida, ventana_desde || null, ventana_hasta || null, activo, id]
    );

    return res.json({ success: true, message: 'Asignación actualizada' });
  } catch (error) {
    console.error('Error actualizando asignación:', error);
    return res.status(500).json({ success: false, message: 'Error actualizando asignación', error: error.message });
  }
};

// Eliminar (soft delete)
const deleteAsignacion = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await executeQuery(`SELECT id FROM ${TABLE} WHERE id = ?`, [id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Asignación no encontrada' });

    await executeQuery(`UPDATE ${TABLE} SET activo = 0 WHERE id = ?`, [id]);
    return res.json({ success: true, message: 'Asignación eliminada' });
  } catch (error) {
    console.error('Error eliminando asignación:', error);
    return res.status(500).json({ success: false, message: 'Error eliminando asignación', error: error.message });
  }
};

module.exports = {
  listAsignaciones,
  createAsignacion,
  updateAsignacion,
  deleteAsignacion,
};


