const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

const TABLE = 'super_admin';

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '2h',
  });
};

// Autenticación de administrador (texto plano, sin bcrypt)
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username y password son requeridos' });
  }

  try {
    const admins = await executeQuery(
      `SELECT id, username, password, nombre_completo FROM ${TABLE} WHERE username = ? LIMIT 1`,
      [username]
    );

    if (!admins.length) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const admin = admins[0];
    if (admin.password !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = generateToken({ id: admin.id, username: admin.username, role: 'admin' });
    return res.json({
      message: 'Autenticación exitosa',
      token,
      admin: { id: admin.id, username: admin.username, nombre_completo: admin.nombre_completo },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error en autenticación', error: error.message });
  }
};

// Perfil del admin autenticado
const me = async (req, res) => {
  try {
    const { id } = req.user;
    const admins = await executeQuery(
      `SELECT id, username, nombre_completo, correo FROM ${TABLE} WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!admins.length) return res.status(404).json({ message: 'Admin no encontrado' });
    return res.json({ admin: admins[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo perfil', error: error.message });
  }
};

// Actualizar mi propio perfil (correo, contraseña, nombre)
const updateMe = async (req, res) => {
  try {
    const { id } = req.user;
    const { username, nombre_completo, correo, currentPassword, newPassword } = req.body;

    if (!username || !nombre_completo) {
      return res.status(400).json({ message: 'Username y nombre completo son requeridos' });
    }

    const [admin] = await executeQuery(
      `SELECT id, username, password, nombre_completo, correo FROM ${TABLE} WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!admin) return res.status(404).json({ message: 'Admin no encontrado' });

    // Si se quiere cambiar contraseña, verificar la actual
    if (newPassword && newPassword.trim()) {
      if (!currentPassword || currentPassword.trim() === '') {
        return res.status(400).json({ message: 'Debes ingresar tu contraseña actual para cambiarla' });
      }
      if (admin.password !== currentPassword.trim()) {
        return res.status(401).json({ message: 'Contraseña actual incorrecta' });
      }
    }

    const updates = ['username = ?', 'nombre_completo = ?', 'correo = ?'];
    const params = [username.trim(), nombre_completo.trim(), correo ? correo.trim() : null];

    if (newPassword && newPassword.trim()) {
      updates.push('password = ?');
      params.push(newPassword.trim());
    }
    params.push(id);

    await executeQuery(
      `UPDATE ${TABLE} SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const [updated] = await executeQuery(
      `SELECT id, username, nombre_completo, correo FROM ${TABLE} WHERE id = ?`,
      [id]
    );

    return res.json({
      message: 'Perfil actualizado correctamente',
      admin: updated
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error actualizando perfil', error: error.message });
  }
};

// CRUD básico de super_admin
const list = async (req, res) => {
  try {
    const admins = await executeQuery(`SELECT id, username, nombre_completo, correo FROM ${TABLE}`);
    return res.json({ data: admins });
  } catch (error) {
    return res.status(500).json({ message: 'Error listando admins', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const admins = await executeQuery(
      `SELECT id, username, nombre_completo, correo FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return res.json({ data: admins[0] || null });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo admin', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { username, password, nombre_completo, correo } = req.body;
    if (!username?.trim() || !password?.trim() || !nombre_completo?.trim()) {
      return res.status(400).json({ message: 'Usuario, contraseña y nombre completo son requeridos' });
    }
    let existe;
    if (correo?.trim()) {
      existe = await executeQuery(
        `SELECT id FROM ${TABLE} WHERE username = ? OR correo = ? LIMIT 1`,
        [username.trim(), correo.trim()]
      );
    } else {
      existe = await executeQuery(
        `SELECT id FROM ${TABLE} WHERE username = ? LIMIT 1`,
        [username.trim()]
      );
    }
    if (existe.length) {
      return res.status(409).json({ message: 'Ya existe un super admin con ese usuario o correo' });
    }
    const result = await executeQuery(
      `INSERT INTO ${TABLE} (username, password, nombre_completo, correo) VALUES (?, ?, ?, ?)`,
      [username.trim(), password.trim(), nombre_completo.trim(), correo?.trim() || null]
    );
    const [nuevo] = await executeQuery(
      `SELECT id, username, nombre_completo, correo FROM ${TABLE} WHERE id = ?`,
      [result.insertId]
    );
    return res.status(201).json({ success: true, message: 'Super admin creado', data: nuevo });
  } catch (error) {
    return res.status(500).json({ message: 'Error creando admin', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nombre_completo, correo } = req.body;
    if (!username?.trim() || !nombre_completo?.trim()) {
      return res.status(400).json({ message: 'Usuario y nombre completo son requeridos' });
    }
    let dup;
    if (correo?.trim()) {
      dup = await executeQuery(
        `SELECT id FROM ${TABLE} WHERE (username = ? OR correo = ?) AND id != ? LIMIT 1`,
        [username.trim(), correo.trim(), id]
      );
    } else {
      dup = await executeQuery(
        `SELECT id FROM ${TABLE} WHERE username = ? AND id != ? LIMIT 1`,
        [username.trim(), id]
      );
    }
    if (dup.length) {
      return res.status(409).json({ message: 'Usuario o correo ya en uso por otro super admin' });
    }
    const updates = ['username = ?', 'nombre_completo = ?', 'correo = ?'];
    const params = [username.trim(), nombre_completo.trim(), correo?.trim() || null];
    if (password && password.trim()) {
      updates.push('password = ?');
      params.push(password.trim());
    }
    params.push(id);
    await executeQuery(`UPDATE ${TABLE} SET ${updates.join(', ')} WHERE id = ?`, params);
    const [actualizado] = await executeQuery(
      `SELECT id, username, nombre_completo, correo FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return res.json({ success: true, message: 'Super admin actualizado', data: actualizado });
  } catch (error) {
    return res.status(500).json({ message: 'Error actualizando admin', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const targetId = parseInt(id, 10);
    if (req.user?.id === targetId) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }
    const total = await executeQuery(`SELECT COUNT(*) AS n FROM ${TABLE}`);
    if (total[0]?.n <= 1) {
      return res.status(400).json({ message: 'Debe existir al menos un super admin en el sistema' });
    }
    await executeQuery(`DELETE FROM ${TABLE} WHERE id = ?`, [targetId]);
    return res.json({ success: true, message: 'Super admin eliminado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error eliminando admin', error: error.message });
  }
};

// Purga total de datos (excepto tabla super_admin)
// Elimina datos de tablas relacionadas al sistema y restablece autoincrementos
const purge = async (req, res) => {
  try {
    // Protección adicional: requerir confirmación explícita en el body
    const { confirm } = req.body || {};
    if (confirm !== 'BORRAR_TODO') {
      return res.status(400).json({ message: "Confirmación inválida. Envíe confirm='BORRAR_TODO'." });
    }

    // Deshabilitar FK y truncar en bloque
    await executeQuery('SET FOREIGN_KEY_CHECKS = 0');

    // Listado explícito de tablas a limpiar (no toca super_admin)
    const tablesToTruncate = [
      'asistencias_control',
      'asignaciones_control',
      'personal_trabajador_roles',
      'personal_trabajador',
      'personal_area',
      'roles',
      'ubicaciones_geograficas',
      'area_laboral'
    ];

    for (const table of tablesToTruncate) {
      try {
        await executeQuery(`TRUNCATE TABLE \`${table}\``);
      } catch (innerErr) {
        // Continuar con otras tablas y reportar al final
        console.error(`Error truncando tabla ${table}:`, innerErr.message);
      }
    }

    await executeQuery('SET FOREIGN_KEY_CHECKS = 1');

    return res.json({ message: 'Base de datos limpiada (excepto super_admin)' });
  } catch (error) {
    // Rehabilitar FK por seguridad
    try { await executeQuery('SET FOREIGN_KEY_CHECKS = 1'); } catch {}
    return res.status(500).json({ message: 'Error durante la limpieza', error: error.message });
  }
};

module.exports = { login, me, updateMe, list, getById, create, update, remove, purge };