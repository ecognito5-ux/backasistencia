const { executeQuery } = require('../config/database');

const TABLE = 'asistencias_control';

// Listar asistencias del trabajador autenticado (o por asignación)
const listAsistencias = async (req, res) => {
  try {
    const { asignacionId, trabajadorId, creadorId } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (asignacionId) { where += ' AND a.id_asignacion = ?'; params.push(asignacionId); }
    if (trabajadorId) { where += ' AND a.id_personal_trabajador = ?'; params.push(trabajadorId); }
    if (creadorId) { where += ' AND ac.creado_por = ?'; params.push(creadorId); }
    const rows = await executeQuery(
      `SELECT a.id, a.id_asignacion, a.id_personal_trabajador, a.fecha_hora, a.lat, a.lng, a.estado, a.comentario,
              ac.dias, ac.hora_entrada, ac.hora_salida,
              pt.nombre_completo AS trabajador_nombre,
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

// Marcar asistencia
const marcarAsistencia = async (req, res) => {
  try {
    const { id_asignacion, lat, lng, estado, comentario } = req.body;
    const userId = req.user?.id;
    if (!id_asignacion || !userId) {
      return res.status(400).json({ success: false, message: 'id_asignacion y token requeridos' });
    }
    // Verificar que la asignación pertenece al trabajador
    const asig = await executeQuery('SELECT id, id_personal_trabajador FROM asignaciones_control WHERE id = ? AND activo = 1', [id_asignacion]);
    if (!asig.length) return res.status(404).json({ success: false, message: 'Asignación no encontrada' });
    if (asig[0].id_personal_trabajador !== userId) return res.status(403).json({ success: false, message: 'No autorizado para esta asignación' });

    const result = await executeQuery(
      `INSERT INTO ${TABLE} (id_asignacion, id_personal_trabajador, lat, lng, estado, comentario)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_asignacion, userId, lat ?? null, lng ?? null, estado || 'marcado', comentario || null]
    );

    return res.status(201).json({ success: true, message: 'Asistencia registrada', data: { id: result.insertId } });
  } catch (error) {
    console.error('Error marcando asistencia:', error);
    return res.status(500).json({ success: false, message: 'Error marcando asistencia', error: error.message });
  }
};

module.exports = {
  listAsistencias,
  marcarAsistencia,
};


