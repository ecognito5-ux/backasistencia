const { executeQuery } = require('../config/database');

const TABLE = 'roles';

// Obtener todos los roles con información del área
const getAllRoles = async (req, res) => {
  try {
    const roles = await executeQuery(`
      SELECT 
        r.id,
        r.descripcion,
        r.id_area_laboral,
        al.descripcion as area_descripcion
      FROM ${TABLE} r
      LEFT JOIN area_laboral al ON r.id_area_laboral = al.id
      ORDER BY al.descripcion, r.descripcion
    `);
    
    return res.json({ 
      success: true, 
      data: roles 
    });
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo roles', 
      error: error.message 
    });
  }
};

// Obtener roles por área
const getRolesByArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    
    const roles = await executeQuery(`
      SELECT 
        r.id,
        r.descripcion,
        r.id_area_laboral,
        al.descripcion as area_descripcion
      FROM ${TABLE} r
      LEFT JOIN area_laboral al ON r.id_area_laboral = al.id
      WHERE r.id_area_laboral = ?
      ORDER BY r.descripcion
    `, [areaId]);
    
    return res.json({ 
      success: true, 
      data: roles 
    });
  } catch (error) {
    console.error('Error obteniendo roles por área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo roles por área', 
      error: error.message 
    });
  }
};

// Obtener roles por personal de área
const getRolesByPersonalArea = async (req, res) => {
  try {
    const { personalAreaId } = req.params;
    
    const roles = await executeQuery(`
      SELECT 
        r.id,
        r.descripcion,
        r.id_area_laboral,
        al.descripcion as area_descripcion
      FROM ${TABLE} r
      LEFT JOIN area_laboral al ON r.id_area_laboral = al.id
      LEFT JOIN personal_area pa ON r.id_area_laboral = pa.id_area_laboral
      WHERE pa.id = ?
      ORDER BY r.descripcion
    `, [personalAreaId]);
    
    return res.json({ 
      success: true, 
      data: roles 
    });
  } catch (error) {
    console.error('Error obteniendo roles por personal de área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo roles por personal de área', 
      error: error.message 
    });
  }
};

// Crear nuevo rol
const createRole = async (req, res) => {
  try {
    const { descripcion, id_area_laboral } = req.body;
    
    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'La descripción del rol es requerida' 
      });
    }
    
    if (!id_area_laboral) {
      return res.status(400).json({ 
        success: false, 
        message: 'El área laboral es requerida' 
      });
    }
    
    // Verificar si el área laboral existe
    const areaExists = await executeQuery(
      `SELECT id FROM area_laboral WHERE id = ?`,
      [id_area_laboral]
    );
    
    if (!areaExists.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'El área laboral especificada no existe' 
      });
    }
    
    // Verificar si ya existe un rol con la misma descripción en esa área
    const existingRole = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE descripcion = ? AND id_area_laboral = ?`,
      [descripcion.trim(), id_area_laboral]
    );
    
    if (existingRole.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe un rol con esa descripción en esta área' 
      });
    }
    
    const result = await executeQuery(
      `INSERT INTO ${TABLE} (descripcion, id_area_laboral) VALUES (?, ?)`,
      [descripcion.trim(), id_area_laboral]
    );
    
    return res.status(201).json({ 
      success: true, 
      message: 'Rol creado exitosamente',
      data: { 
        id: result.insertId, 
        descripcion: descripcion.trim(),
        id_area_laboral: parseInt(id_area_laboral)
      }
    });
  } catch (error) {
    console.error('Error creando rol:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error creando rol', 
      error: error.message 
    });
  }
};

// Actualizar rol
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, id_area_laboral } = req.body;
    
    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'La descripción del rol es requerida' 
      });
    }
    
    if (!id_area_laboral) {
      return res.status(400).json({ 
        success: false, 
        message: 'El área laboral es requerida' 
      });
    }
    
    // Verificar si el rol existe
    const existingRole = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    
    if (!existingRole.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rol no encontrado' 
      });
    }
    
    // Verificar si el área laboral existe
    const areaExists = await executeQuery(
      `SELECT id FROM area_laboral WHERE id = ?`,
      [id_area_laboral]
    );
    
    if (!areaExists.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'El área laboral especificada no existe' 
      });
    }
    
    // Verificar si ya existe otro rol con la misma descripción en esa área
    const duplicateRole = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE descripcion = ? AND id_area_laboral = ? AND id != ?`,
      [descripcion.trim(), id_area_laboral, id]
    );
    
    if (duplicateRole.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe otro rol con esa descripción en esta área' 
      });
    }
    
    await executeQuery(
      `UPDATE ${TABLE} SET descripcion = ?, id_area_laboral = ? WHERE id = ?`,
      [descripcion.trim(), id_area_laboral, id]
    );
    
    return res.json({ 
      success: true, 
      message: 'Rol actualizado exitosamente',
      data: { 
        id: parseInt(id), 
        descripcion: descripcion.trim(),
        id_area_laboral: parseInt(id_area_laboral)
      }
    });
  } catch (error) {
    console.error('Error actualizando rol:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error actualizando rol', 
      error: error.message 
    });
  }
};

// Eliminar rol
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el rol existe
    const existingRole = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    
    if (!existingRole.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Rol no encontrado' 
      });
    }
    
    // Verificar si hay trabajadores asignados a este rol
    const trabajadoresAsignados = await executeQuery(
      `SELECT COUNT(*) as count FROM personal_trabajador_roles WHERE id_rol = ?`,
      [id]
    );
    
    if (trabajadoresAsignados[0].count > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'No se puede eliminar el rol porque tiene trabajadores asignados' 
      });
    }
    
    await executeQuery(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    
    return res.json({ 
      success: true, 
      message: 'Rol eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando rol:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error eliminando rol', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllRoles,
  getRolesByArea,
  getRolesByPersonalArea,
  createRole,
  updateRole,
  deleteRole
};
