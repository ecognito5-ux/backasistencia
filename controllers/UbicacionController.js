const { executeQuery } = require('../config/database');

const TABLE = 'ubicaciones_geograficas';

// Obtener todas las ubicaciones
const getAllUbicaciones = async (req, res) => {
  try {
    const ubicaciones = await executeQuery(`
      SELECT 
        id,
        nombre,
        descripcion,
        tipo,
        centro_lat,
        centro_lng,
        radio,
        esquina1_lat,
        esquina1_lng,
        esquina2_lat,
        esquina2_lng,
        creado_por,
        fecha_creacion,
        fecha_actualizacion,
        activo
      FROM ${TABLE}
      WHERE activo = TRUE
      ORDER BY fecha_creacion DESC
    `);

    // Formatear las ubicaciones para el frontend
    const ubicacionesFormateadas = ubicaciones.map(ubicacion => {
      const base = {
        id: ubicacion.id,
        name: ubicacion.nombre,
        description: ubicacion.descripcion,
        type: ubicacion.tipo,
        creado_por: ubicacion.creado_por,
        fecha_creacion: ubicacion.fecha_creacion,
        fecha_actualizacion: ubicacion.fecha_actualizacion
      };

      if (ubicacion.tipo === 'circle') {
        return {
          ...base,
          center: [parseFloat(ubicacion.centro_lat), parseFloat(ubicacion.centro_lng)],
          radius: parseFloat(ubicacion.radio)
        };
      } else {
        return {
          ...base,
          start: [parseFloat(ubicacion.esquina1_lat), parseFloat(ubicacion.esquina1_lng)],
          end: [parseFloat(ubicacion.esquina2_lat), parseFloat(ubicacion.esquina2_lng)]
        };
      }
    });

    return res.json({ success: true, data: ubicacionesFormateadas });
  } catch (error) {
    console.error('Error obteniendo ubicaciones:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo ubicaciones', 
      error: error.message 
    });
  }
};

// Obtener una ubicación por ID
const getUbicacionById = async (req, res) => {
  try {
    const { id } = req.params;
    const ubicaciones = await executeQuery(`
      SELECT * FROM ${TABLE} WHERE id = ? AND activo = TRUE
    `, [id]);

    if (ubicaciones.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ubicación no encontrada' 
      });
    }

    return res.json({ success: true, data: ubicaciones[0] });
  } catch (error) {
    console.error('Error obteniendo ubicación:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo ubicación', 
      error: error.message 
    });
  }
};

// Crear una nueva ubicación
const createUbicacion = async (req, res) => {
  try {
    const { name, description, type, center, radius, start, end } = req.body;

    // Validaciones
    if (!name || !type) {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre y el tipo son requeridos' 
      });
    }

    if (type === 'circle' && (!center || !radius)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Para círculos se requiere centro y radio' 
      });
    }

    if (type === 'rectangle' && (!start || !end)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Para rectángulos se requieren las dos esquinas' 
      });
    }

    // Preparar datos según el tipo
    let queryData;
    if (type === 'circle') {
      queryData = {
        nombre: name,
        descripcion: description || null,
        tipo: type,
        centro_lat: center[0],
        centro_lng: center[1],
        radio: radius,
        esquina1_lat: null,
        esquina1_lng: null,
        esquina2_lat: null,
        esquina2_lng: null
      };
    } else {
      queryData = {
        nombre: name,
        descripcion: description || null,
        tipo: type,
        centro_lat: null,
        centro_lng: null,
        radio: null,
        esquina1_lat: start[0],
        esquina1_lng: start[1],
        esquina2_lat: end[0],
        esquina2_lng: end[1]
      };
    }

    // Obtener el ID del admin desde el token (si está disponible)
    const creado_por = req.user ? req.user.id : null;
    queryData.creado_por = creado_por;

    const result = await executeQuery(
      `INSERT INTO ${TABLE} 
        (nombre, descripcion, tipo, centro_lat, centro_lng, radio, esquina1_lat, esquina1_lng, esquina2_lat, esquina2_lng, creado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        queryData.nombre,
        queryData.descripcion,
        queryData.tipo,
        queryData.centro_lat,
        queryData.centro_lng,
        queryData.radio,
        queryData.esquina1_lat,
        queryData.esquina1_lng,
        queryData.esquina2_lat,
        queryData.esquina2_lng,
        queryData.creado_por
      ]
    );

    return res.status(201).json({ 
      success: true, 
      message: 'Ubicación creada exitosamente',
      data: { id: result.insertId, ...queryData }
    });
  } catch (error) {
    console.error('Error creando ubicación:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error creando ubicación', 
      error: error.message 
    });
  }
};

// Actualizar una ubicación
const updateUbicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, center, radius, start, end } = req.body;

    // Verificar que la ubicación existe
    const ubicacionExistente = await executeQuery(
      `SELECT * FROM ${TABLE} WHERE id = ? AND activo = TRUE`,
      [id]
    );

    if (ubicacionExistente.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ubicación no encontrada' 
      });
    }

    // Preparar datos según el tipo
    let queryData;
    if (type === 'circle') {
      queryData = {
        nombre: name,
        descripcion: description || null,
        tipo: type,
        centro_lat: center[0],
        centro_lng: center[1],
        radio: radius,
        esquina1_lat: null,
        esquina1_lng: null,
        esquina2_lat: null,
        esquina2_lng: null
      };
    } else {
      queryData = {
        nombre: name,
        descripcion: description || null,
        tipo: type,
        centro_lat: null,
        centro_lng: null,
        radio: null,
        esquina1_lat: start[0],
        esquina1_lng: start[1],
        esquina2_lat: end[0],
        esquina2_lng: end[1]
      };
    }

    await executeQuery(
      `UPDATE ${TABLE} 
       SET nombre = ?, descripcion = ?, tipo = ?, centro_lat = ?, centro_lng = ?, radio = ?, 
           esquina1_lat = ?, esquina1_lng = ?, esquina2_lat = ?, esquina2_lng = ?
       WHERE id = ?`,
      [
        queryData.nombre,
        queryData.descripcion,
        queryData.tipo,
        queryData.centro_lat,
        queryData.centro_lng,
        queryData.radio,
        queryData.esquina1_lat,
        queryData.esquina1_lng,
        queryData.esquina2_lat,
        queryData.esquina2_lng,
        id
      ]
    );

    return res.json({ 
      success: true, 
      message: 'Ubicación actualizada exitosamente' 
    });
  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error actualizando ubicación', 
      error: error.message 
    });
  }
};

// Eliminar una ubicación (soft delete)
const deleteUbicacion = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la ubicación existe
    const ubicacionExistente = await executeQuery(
      `SELECT * FROM ${TABLE} WHERE id = ? AND activo = TRUE`,
      [id]
    );

    if (ubicacionExistente.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ubicación no encontrada' 
      });
    }

    // Soft delete: marcar como inactivo
    await executeQuery(
      `UPDATE ${TABLE} SET activo = FALSE WHERE id = ?`,
      [id]
    );

    return res.json({ 
      success: true, 
      message: 'Ubicación eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando ubicación:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error eliminando ubicación', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllUbicaciones,
  getUbicacionById,
  createUbicacion,
  updateUbicacion,
  deleteUbicacion
};


