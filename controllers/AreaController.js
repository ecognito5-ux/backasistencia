const { executeQuery } = require('../config/database');

const TABLE = 'area_laboral';

// Obtener todas las áreas laborales
const getAllAreas = async (req, res) => {
  try {
    const areas = await executeQuery(`SELECT * FROM ${TABLE} ORDER BY descripcion`);
    return res.json({ 
      success: true, 
      data: areas 
    });
  } catch (error) {
    console.error('Error obteniendo áreas:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo áreas laborales', 
      error: error.message 
    });
  }
};

// Obtener un área por ID
const getAreaById = async (req, res) => {
  try {
    const { id } = req.params;
    const areas = await executeQuery(
      `SELECT * FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    
    if (!areas.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Área laboral no encontrada' 
      });
    }
    
    return res.json({ 
      success: true, 
      data: areas[0] 
    });
  } catch (error) {
    console.error('Error obteniendo área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo área laboral', 
      error: error.message 
    });
  }
};

// Crear nueva área laboral
const createArea = async (req, res) => {
  try {
    const { descripcion } = req.body;
    
    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'La descripción del área es requerida' 
      });
    }
    
    // Verificar si ya existe un área con la misma descripción
    const existingAreas = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE descripcion = ?`,
      [descripcion.trim()]
    );
    
    if (existingAreas.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe un área laboral con esa descripción' 
      });
    }
    
    const result = await executeQuery(
      `INSERT INTO ${TABLE} (descripcion) VALUES (?)`,
      [descripcion.trim()]
    );
    
    return res.status(201).json({ 
      success: true, 
      message: 'Área laboral creada exitosamente',
      data: { id: result.insertId, descripcion: descripcion.trim() }
    });
  } catch (error) {
    console.error('Error creando área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error creando área laboral', 
      error: error.message 
    });
  }
};

// Actualizar área laboral
const updateArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;
    
    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'La descripción del área es requerida' 
      });
    }
    
    // Verificar si el área existe
    const existingArea = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    
    if (!existingArea.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Área laboral no encontrada' 
      });
    }
    
    // Verificar si ya existe otra área con la misma descripción
    const duplicateAreas = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE descripcion = ? AND id != ?`,
      [descripcion.trim(), id]
    );
    
    if (duplicateAreas.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe otra área laboral con esa descripción' 
      });
    }
    
    await executeQuery(
      `UPDATE ${TABLE} SET descripcion = ? WHERE id = ?`,
      [descripcion.trim(), id]
    );
    
    return res.json({ 
      success: true, 
      message: 'Área laboral actualizada exitosamente',
      data: { id: parseInt(id), descripcion: descripcion.trim() }
    });
  } catch (error) {
    console.error('Error actualizando área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error actualizando área laboral', 
      error: error.message 
    });
  }
};

// Eliminar área laboral
const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el área existe
    const existingArea = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    
    if (!existingArea.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Área laboral no encontrada' 
      });
    }
    
    // Verificar si hay roles asociados a esta área
    const rolesAsociados = await executeQuery(
      `SELECT COUNT(*) as count FROM roles WHERE id_area_laboral = ?`,
      [id]
    );
    
    if (rolesAsociados[0].count > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'No se puede eliminar el área porque tiene roles asociados' 
      });
    }
    
    // Verificar si hay personal de área asociado
    const personalAsociado = await executeQuery(
      `SELECT COUNT(*) as count FROM personal_area WHERE id_area_laboral = ?`,
      [id]
    );
    
    if (personalAsociado[0].count > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'No se puede eliminar el área porque tiene personal asociado' 
      });
    }
    
    await executeQuery(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    
    return res.json({ 
      success: true, 
      message: 'Área laboral eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error eliminando área laboral', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea
};
