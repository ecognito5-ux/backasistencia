const { executeQuery } = require('../config/database');
const jwt = require('jsonwebtoken');

const TABLE = 'personal_trabajador';
const ROLES_TABLE = 'personal_trabajador_roles';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Obtener todos los trabajadores con información completa
const getAllTrabajadores = async (req, res) => {
  try {
    const trabajadores = await executeQuery(`
      SELECT 
        pt.id,
        pt.username,
        pt.nombre_completo,
        pt.id_personal_area,
        pt.id_area_laboral,
        pa.nombre_completo as personal_area_nombre,
        al.descripcion as area_descripcion,
        GROUP_CONCAT(r.descripcion SEPARATOR ', ') as roles_asignados
      FROM ${TABLE} pt
      LEFT JOIN personal_area pa ON pt.id_personal_area = pa.id
      LEFT JOIN area_laboral al ON pt.id_area_laboral = al.id
      LEFT JOIN ${ROLES_TABLE} ptr ON pt.id = ptr.id_personal_trabajador
      LEFT JOIN roles r ON ptr.id_rol = r.id
      GROUP BY pt.id
      ORDER BY al.descripcion, pt.nombre_completo
    `);
    
    return res.json({ 
      success: true, 
      data: trabajadores 
    });
  } catch (error) {
    console.error('Error obteniendo trabajadores:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo trabajadores', 
      error: error.message 
    });
  }
};

// Obtener trabajadores por área
const getTrabajadoresByArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    
    const trabajadores = await executeQuery(`
      SELECT 
        pt.id,
        pt.username,
        pt.nombre_completo,
        pt.id_personal_area,
        pt.id_area_laboral,
        pa.nombre_completo as personal_area_nombre,
        al.descripcion as area_descripcion,
        GROUP_CONCAT(r.descripcion SEPARATOR ', ') as roles_asignados
      FROM ${TABLE} pt
      LEFT JOIN personal_area pa ON pt.id_personal_area = pa.id
      LEFT JOIN area_laboral al ON pt.id_area_laboral = al.id
      LEFT JOIN ${ROLES_TABLE} ptr ON pt.id = ptr.id_personal_trabajador
      LEFT JOIN roles r ON ptr.id_rol = r.id
      WHERE pt.id_area_laboral = ?
      GROUP BY pt.id
      ORDER BY pt.nombre_completo
    `, [areaId]);
    
    return res.json({ 
      success: true, 
      data: trabajadores 
    });
  } catch (error) {
    console.error('Error obteniendo trabajadores por área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo trabajadores por área', 
      error: error.message 
    });
  }
};

// Obtener trabajadores por personal de área
const getTrabajadoresByPersonalArea = async (req, res) => {
  try {
    const { personalAreaId } = req.params;
    
    const trabajadores = await executeQuery(`
      SELECT 
        pt.id,
        pt.username,
        pt.nombre_completo,
        pt.id_personal_area,
        pt.id_area_laboral,
        pa.nombre_completo as personal_area_nombre,
        al.descripcion as area_descripcion,
        GROUP_CONCAT(r.descripcion SEPARATOR ', ') as roles_asignados
      FROM ${TABLE} pt
      LEFT JOIN personal_area pa ON pt.id_personal_area = pa.id
      LEFT JOIN area_laboral al ON pt.id_area_laboral = al.id
      LEFT JOIN ${ROLES_TABLE} ptr ON pt.id = ptr.id_personal_trabajador
      LEFT JOIN roles r ON ptr.id_rol = r.id
      WHERE pt.id_personal_area = ?
      GROUP BY pt.id
      ORDER BY pt.nombre_completo
    `, [personalAreaId]);
    
    return res.json({ 
      success: true, 
      data: trabajadores 
    });
  } catch (error) {
    console.error('Error obteniendo trabajadores por personal de área:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error obteniendo trabajadores por personal de área', 
      error: error.message 
    });
  }
};

// Crear nuevo trabajador
const createTrabajador = async (req, res) => {
  try {
    const { username, password, nombre_completo, id_personal_area, id_area_laboral, roles_ids } = req.body;
    
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
    
    if (!id_personal_area) {
      return res.status(400).json({ 
        success: false, 
        message: 'El personal de área es requerido' 
      });
    }
    
    if (!id_area_laboral) {
      return res.status(400).json({ 
        success: false, 
        message: 'El área laboral es requerida' 
      });
    }
    
    // Verificar si el username ya existe
    const usernameExists = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE username = ?`,
      [username.trim()]
    );
    
    if (usernameExists.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'El username ya está en uso' 
      });
    }
    
    // Verificar si el personal de área existe
    const personalExists = await executeQuery(
      `SELECT id FROM personal_area WHERE id = ?`,
      [id_personal_area]
    );
    
    if (!personalExists.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'El personal de área especificado no existe' 
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
    
    // Crear el trabajador
    const result = await executeQuery(
      `INSERT INTO ${TABLE} (username, password, nombre_completo, id_personal_area, id_area_laboral) VALUES (?, ?, ?, ?, ?)`,
      [username.trim(), password.trim(), nombre_completo.trim(), id_personal_area, id_area_laboral]
    );
    
    const trabajadorId = result.insertId;
    
    // Asignar roles si se proporcionan
    if (roles_ids && roles_ids.length > 0) {
      for (const rolId of roles_ids) {
        // Verificar que el rol existe y pertenece al área correcta
        const rolExists = await executeQuery(
          `SELECT id FROM roles WHERE id = ? AND id_area_laboral = ?`,
          [rolId, id_area_laboral]
        );
        
        if (rolExists.length > 0) {
          await executeQuery(
            `INSERT INTO ${ROLES_TABLE} (id_personal_trabajador, id_rol) VALUES (?, ?)`,
            [trabajadorId, rolId]
          );
        }
      }
    }
    
    return res.status(201).json({ 
      success: true, 
      message: 'Trabajador creado exitosamente',
      data: { 
        id: trabajadorId,
        username: username.trim(),
        nombre_completo: nombre_completo.trim(),
        id_personal_area: parseInt(id_personal_area),
        id_area_laboral: parseInt(id_area_laboral)
      }
    });
  } catch (error) {
    console.error('Error creando trabajador:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error creando trabajador', 
      error: error.message 
    });
  }
};

// Actualizar trabajador
const updateTrabajador = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nombre_completo, id_personal_area, id_area_laboral, roles_ids } = req.body;
    
    if (!username || username.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'El username es requerido' 
      });
    }
    
    if (!nombre_completo || nombre_completo.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'El nombre completo es requerido' 
      });
    }
    
    if (!id_personal_area) {
      return res.status(400).json({ 
        success: false, 
        message: 'El personal de área es requerido' 
      });
    }
    
    if (!id_area_laboral) {
      return res.status(400).json({ 
        success: false, 
        message: 'El área laboral es requerida' 
      });
    }
    
    // Verificar si el trabajador existe
    const existingTrabajador = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    
    if (!existingTrabajador.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trabajador no encontrado' 
      });
    }
    
    // Verificar si el username ya existe en otro trabajador
    const usernameExists = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE username = ? AND id != ?`,
      [username.trim(), id]
    );
    
    if (usernameExists.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'El username ya está en uso por otro trabajador' 
      });
    }
    
    // Verificar si el personal de área existe
    const personalExists = await executeQuery(
      `SELECT id FROM personal_area WHERE id = ?`,
      [id_personal_area]
    );
    
    if (!personalExists.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'El personal de área especificado no existe' 
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
    
    // Preparar actualización
    let updateQuery = `UPDATE ${TABLE} SET username = ?, nombre_completo = ?, id_personal_area = ?, id_area_laboral = ?`;
    let updateParams = [username.trim(), nombre_completo.trim(), id_personal_area, id_area_laboral];
    
    // Solo actualizar password si se proporciona
    if (password && password.trim() !== '') {
      updateQuery += `, password = ?`;
      updateParams.push(password.trim());
    }
    
    updateQuery += ` WHERE id = ?`;
    updateParams.push(id);
    
    // Actualizar el trabajador
    await executeQuery(updateQuery, updateParams);
    
    // Actualizar roles si se proporcionan
    if (roles_ids !== undefined) {
      // Eliminar roles actuales
      await executeQuery(
        `DELETE FROM ${ROLES_TABLE} WHERE id_personal_trabajador = ?`,
        [id]
      );
      
      // Asignar nuevos roles
      if (roles_ids && roles_ids.length > 0) {
        for (const rolId of roles_ids) {
          // Verificar que el rol existe y pertenece al área correcta
          const rolExists = await executeQuery(
            `SELECT id FROM roles WHERE id = ? AND id_area_laboral = ?`,
            [rolId, id_area_laboral]
          );
          
          if (rolExists.length > 0) {
            await executeQuery(
              `INSERT INTO ${ROLES_TABLE} (id_personal_trabajador, id_rol) VALUES (?, ?)`,
              [id, rolId]
            );
          }
        }
      }
    }
    
    return res.json({ 
      success: true, 
      message: 'Trabajador actualizado exitosamente',
      data: { 
        id: parseInt(id),
        username: username.trim(),
        nombre_completo: nombre_completo.trim(),
        id_personal_area: parseInt(id_personal_area),
        id_area_laboral: parseInt(id_area_laboral)
      }
    });
  } catch (error) {
    console.error('Error actualizando trabajador:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error actualizando trabajador', 
      error: error.message 
    });
  }
};

// Eliminar trabajador
const deleteTrabajador = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el trabajador existe
    const existingTrabajador = await executeQuery(
      `SELECT id FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    
    if (!existingTrabajador.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trabajador no encontrado' 
      });
    }
    
    // Eliminar trabajador (las relaciones se eliminan por CASCADE)
    await executeQuery(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    
    return res.json({ 
      success: true, 
      message: 'Trabajador eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando trabajador:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error eliminando trabajador', 
      error: error.message 
    });
  }
};

// Login de trabajador
const loginTrabajador = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username y contraseña son requeridos' 
      });
    }
    
    // Buscar trabajador con toda su información
    const trabajador = await executeQuery(`
      SELECT 
        pt.id,
        pt.username,
        pt.password,
        pt.nombre_completo,
        pt.id_personal_area,
        pt.id_area_laboral,
        pa.nombre_completo as encargado_nombre,
        al.descripcion as area_descripcion,
        GROUP_CONCAT(r.descripcion SEPARATOR ', ') as roles_asignados,
        GROUP_CONCAT(r.id) as roles_ids
      FROM ${TABLE} pt
      LEFT JOIN personal_area pa ON pt.id_personal_area = pa.id
      LEFT JOIN area_laboral al ON pt.id_area_laboral = al.id
      LEFT JOIN ${ROLES_TABLE} ptr ON pt.id = ptr.id_personal_trabajador
      LEFT JOIN roles r ON ptr.id_rol = r.id
      WHERE pt.username = ?
      GROUP BY pt.id
    `, [username.trim()]);
    
    if (!trabajador.length) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario o contraseña incorrectos' 
      });
    }
    
    // Verificar contraseña (texto plano)
    if (trabajador[0].password !== password.trim()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario o contraseña incorrectos' 
      });
    }
    
    // Generar token JWT
    const token = jwt.sign(
      { 
        id: trabajador[0].id, 
        username: trabajador[0].username,
        role: 'trabajador',
        id_area_laboral: trabajador[0].id_area_laboral,
        id_personal_area: trabajador[0].id_personal_area
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Remover la contraseña de la respuesta
    const { password: _, ...userData } = trabajador[0];
    
    return res.json({ 
      success: true, 
      message: 'Login exitoso',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Error en login de trabajador:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error en el proceso de login', 
      error: error.message 
    });
  }
};

// Cambiar contraseña de trabajador
const changePassword = async (req, res) => {
  try {
    const { id, currentPassword, newPassword } = req.body;
    
    if (!id || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos los campos son requeridos' 
      });
    }
    
    // Verificar que el trabajador existe y obtener su contraseña actual
    const trabajador = await executeQuery(
      `SELECT id, password FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    
    if (!trabajador.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trabajador no encontrado' 
      });
    }
    
    // Verificar que la contraseña actual es correcta (texto plano)
    if (trabajador[0].password !== currentPassword.trim()) {
      return res.status(401).json({ 
        success: false, 
        message: 'La contraseña actual es incorrecta' 
      });
    }
    
    // Actualizar la contraseña
    await executeQuery(
      `UPDATE ${TABLE} SET password = ? WHERE id = ?`,
      [newPassword.trim(), id]
    );
    
    return res.json({ 
      success: true, 
      message: 'Contraseña cambiada exitosamente' 
    });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al cambiar la contraseña', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllTrabajadores,
  getTrabajadoresByArea,
  getTrabajadoresByPersonalArea,
  createTrabajador,
  updateTrabajador,
  deleteTrabajador,
  loginTrabajador,
  changePassword
};