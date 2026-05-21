const { executeQuery } = require('../config/database');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmailPersonalArea } = require('../services/emailService');

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
        pa.correo,
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
        pa.correo,
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
    const { username, password, nombre_completo, id_area_laboral, correo } = req.body;
    
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
      `INSERT INTO ${TABLE} (username, password, nombre_completo, correo, id_area_laboral) VALUES (?, ?, ?, ?, ?)`,
      [username.trim(), password.trim(), nombre_completo.trim(), correo ? correo.trim() : null, id_area_laboral]
    );
    
    // Enviar correo de bienvenida si se proporcionó un correo (DESACTIVADO POR AHORA)
    // if (correo && correo.trim()) {
    //   try {
    //     await sendWelcomeEmailPersonalArea(correo.trim(), nombre_completo.trim(), username.trim());
    //     console.log('📧 Correo de bienvenida enviado a:', correo.trim());
    //   } catch (emailError) {
    //     console.error('Error enviando correo de bienvenida:', emailError);
    //     // No fallar la creación si el correo no se envía
    //   }
    // }
    
    return res.status(201).json({ 
      success: true, 
      message: 'Personal de área creado exitosamente',
      data: { 
        id: result.insertId, 
        username: username.trim(),
        nombre_completo: nombre_completo.trim(),
        correo: correo ? correo.trim() : null,
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
    const { username, password, nombre_completo, id_area_laboral, correo } = req.body;
    
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
      `UPDATE ${TABLE} SET username = ?, password = ?, nombre_completo = ?, correo = ?, id_area_laboral = ? WHERE id = ?`,
      [username.trim(), password.trim(), nombre_completo.trim(), correo ? correo.trim() : null, id_area_laboral, id]
    );
    
    return res.json({ 
      success: true, 
      message: 'Personal de área actualizado exitosamente',
      data: { 
        id: parseInt(id), 
        username: username.trim(),
        nombre_completo: nombre_completo.trim(),
        correo: correo ? correo.trim() : null,
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
        pa.correo,
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

// Obtener mi propio perfil
const getMe = async (req, res) => {
  try {
    const { id } = req.user;
    const personal = await executeQuery(`
      SELECT pa.id, pa.username, pa.nombre_completo, pa.correo, pa.id_area_laboral, al.descripcion as area_descripcion
      FROM ${TABLE} pa
      LEFT JOIN area_laboral al ON pa.id_area_laboral = al.id
      WHERE pa.id = ?
    `, [id]);
    if (!personal.length) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    return res.json({ success: true, data: personal[0] });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Actualizar mi propio perfil
const updateMe = async (req, res) => {
  try {
    const { id } = req.user;
    const { username, nombre_completo, correo, currentPassword, newPassword } = req.body;
    if (!username || !nombre_completo) {
      return res.status(400).json({ success: false, message: 'Username y nombre completo son requeridos' });
    }
    const [user] = await executeQuery(`SELECT id, password FROM ${TABLE} WHERE id = ?`, [id]);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (newPassword && newPassword.trim()) {
      if (!currentPassword || user.password !== currentPassword.trim()) {
        return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
      }
    }
    const updates = ['username = ?', 'nombre_completo = ?', 'correo = ?'];
    const params = [username.trim(), nombre_completo.trim(), correo ? correo.trim() : null];
    if (newPassword && newPassword.trim()) { updates.push('password = ?'); params.push(newPassword.trim()); }
    params.push(id);
    await executeQuery(`UPDATE ${TABLE} SET ${updates.join(', ')} WHERE id = ?`, params);
    const [data] = await executeQuery(`
      SELECT pa.id, pa.username, pa.nombre_completo, pa.correo, pa.id_area_laboral, al.descripcion as area_descripcion
      FROM ${TABLE} pa LEFT JOIN area_laboral al ON pa.id_area_laboral = al.id WHERE pa.id = ?
    `, [id]);
    return res.json({ success: true, message: 'Perfil actualizado', data: data });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: error.message });
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
        pa.correo,
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
  getMe,
  updateMe,
  createPersonalArea,
  updatePersonalArea,
  deletePersonalArea,
  getPersonalByArea,
  loginPersonalArea
};
