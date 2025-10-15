const { executeQuery } = require('../config/database');
const jwt = require('jsonwebtoken');

const TABLE = 'personal_area';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Obtener todo el personal de área con información del área
const getAllPersonalArea = async (req, res) => {
  try {
    const personal = await executeQuery(`
      SELECT 
        pa.id,
        pa.username,
        pa.nombre_completo,
        pa.id_area_laboral,
        al.descripcion as area_descripcion
      FROM ${TABLE} pa
      LEFT JOIN area_laboral al ON pa.id_area_laboral = al.id
      ORDER BY pa.nombre_completo
    `);
    
    return res.json({ 
      success: true, 
      data: personal 
    });
  } catch (error) {
    console.error('Error obteniendo personal de área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo personal de área', 
      error: error.message 
    });
  }
};

// Obtener personal de área por ID
const getPersonalAreaById = async (req, res) => {
  try {
    const { id } = req.params;
    const personal = await executeQuery(`
      SELECT 
        pa.id,
        pa.username,
        pa.nombre_completo,
        pa.id_area_laboral,
        al.descripcion as area_descripcion
      FROM ${TABLE} pa
      LEFT JOIN area_laboral al ON pa.id_area_laboral = al.id
      WHERE pa.id = ?
    `, [id]);
    
    if (!personal.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Personal de área no encontrado' 
      });
    }
    
    return res.json({ 
      success: true, 
      data: personal[0] 
    });
  } catch (error) {
    console.error('Error obteniendo personal de área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo personal de área', 
      error: error.message 
    });
  }
};

// Crear nuevo personal de área
const createPersonalArea = async (req, res) => {
  try {
    const { username, password, nombre_completo, id_area_laboral } = req.body;
    
    // Validaciones
    if (!username || username.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'El username es requerido' 
      });
    }
    
    if (!password || password.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'La contraseña es requerida' 
      });
    }
    
    if (!nombre_completo || nombre_completo.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre completo es requerido' 
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
    
    // Verificar si ya existe un username con ese nombre
    const existingUsername = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE username = ?`,
      [username.trim()]
    );
    
    if (existingUsername.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe un personal de área con ese username' 
      });
    }
    
    const result = await executeQuery(
      `INSERT INTO ${TABLE} (username, password, nombre_completo, id_area_laboral) VALUES (?, ?, ?, ?)`,
      [username.trim(), password.trim(), nombre_completo.trim(), id_area_laboral]
    );
    
    return res.status(201).json({ 
      success: true, 
      message: 'Personal de área creado exitosamente',
      data: { 
        id: result.insertId, 
        username: username.trim(),
        nombre_completo: nombre_completo.trim(),
        id_area_laboral: parseInt(id_area_laboral)
      }
    });
  } catch (error) {
    console.error('Error creando personal de área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error creando personal de área', 
      error: error.message 
    });
  }
};

// Actualizar personal de área
const updatePersonalArea = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nombre_completo, id_area_laboral } = req.body;
    
    // Validaciones
    if (!username || username.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'El username es requerido' 
      });
    }
    
    if (!password || password.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'La contraseña es requerida' 
      });
    }
    
    if (!nombre_completo || nombre_completo.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre completo es requerido' 
      });
    }
    
    if (!id_area_laboral) {
      return res.status(400).json({ 
        success: false, 
        message: 'El área laboral es requerida' 
      });
    }
    
    // Verificar si el personal existe
    const existingPersonal = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    
    if (!existingPersonal.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Personal de área no encontrado' 
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
    
    // Verificar si ya existe otro personal con ese username
    const duplicateUsername = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE username = ? AND id != ?`,
      [username.trim(), id]
    );
    
    if (duplicateUsername.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Ya existe otro personal de área con ese username' 
      });
    }
    
    await executeQuery(
      `UPDATE ${TABLE} SET username = ?, password = ?, nombre_completo = ?, id_area_laboral = ? WHERE id = ?`,
      [username.trim(), password.trim(), nombre_completo.trim(), id_area_laboral, id]
    );
    
    return res.json({ 
      success: true, 
      message: 'Personal de área actualizado exitosamente',
      data: { 
        id: parseInt(id), 
        username: username.trim(),
        nombre_completo: nombre_completo.trim(),
        id_area_laboral: parseInt(id_area_laboral)
      }
    });
  } catch (error) {
    console.error('Error actualizando personal de área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error actualizando personal de área', 
      error: error.message 
    });
  }
};

// Eliminar personal de área
const deletePersonalArea = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el personal existe
    const existingPersonal = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    
    if (!existingPersonal.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Personal de área no encontrado' 
      });
    }
    
    // Verificar si hay trabajadores asociados a este personal
    const trabajadoresAsociados = await executeQuery(
      `SELECT COUNT(*) as count FROM personal_trabajador WHERE id_personal_area = ?`,
      [id]
    );
    
    if (trabajadoresAsociados[0].count > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'No se puede eliminar el personal porque tiene trabajadores asociados' 
      });
    }
    
    await executeQuery(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    
    return res.json({ 
      success: true, 
      message: 'Personal de área eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando personal de área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error eliminando personal de área', 
      error: error.message 
    });
  }
};

// Obtener personal por área laboral
const getPersonalByArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    
    const personal = await executeQuery(`
      SELECT 
        pa.id,
        pa.username,
        pa.nombre_completo,
        pa.id_area_laboral,
        al.descripcion as area_descripcion
      FROM ${TABLE} pa
      LEFT JOIN area_laboral al ON pa.id_area_laboral = al.id
      WHERE pa.id_area_laboral = ?
      ORDER BY pa.nombre_completo
    `, [areaId]);
    
    return res.json({ 
      success: true, 
      data: personal 
    });
  } catch (error) {
    console.error('Error obteniendo personal por área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo personal por área', 
      error: error.message 
    });
  }
};

// Login de personal de área
const loginPersonalArea = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username y contraseña son requeridos' 
      });
    }
    
    // Buscar usuario con información del área
    const personal = await executeQuery(`
      SELECT 
        pa.id,
        pa.username,
        pa.password,
        pa.nombre_completo,
        pa.id_area_laboral,
        al.descripcion as area_descripcion
      FROM ${TABLE} pa
      LEFT JOIN area_laboral al ON pa.id_area_laboral = al.id
      WHERE pa.username = ?
    `, [username.trim()]);
    
    if (!personal.length) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario o contraseña incorrectos' 
      });
    }
    
    // Verificar contraseña (texto plano)
    if (personal[0].password !== password.trim()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario o contraseña incorrectos' 
      });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: personal[0].id, 
        username: personal[0].username,
        role: 'area',
        id_area_laboral: personal[0].id_area_laboral
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Remover la contraseña de la respuesta
    const { password: _, ...userData } = personal[0];
    
    return res.json({ 
      success: true, 
      message: 'Login exitoso',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Error en login de personal de área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error en el proceso de login', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllPersonalArea,
  getPersonalAreaById,
  createPersonalArea,
  updatePersonalArea,
  deletePersonalArea,
  getPersonalByArea,
  loginPersonalArea
};
