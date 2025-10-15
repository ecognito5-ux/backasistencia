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
      `SELECT id, username, nombre_completo FROM ${TABLE} WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!admins.length) return res.status(404).json({ message: 'Admin no encontrado' });
    return res.json({ admin: admins[0] });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo perfil', error: error.message });
  }
};

// CRUD básico de super_admin
const list = async (req, res) => {
  try {
    const admins = await executeQuery(`SELECT id, username, nombre_completo FROM ${TABLE}`);
    return res.json({ data: admins });
  } catch (error) {
    return res.status(500).json({ message: 'Error listando admins', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const admins = await executeQuery(
      `SELECT id, username, nombre_completo FROM ${TABLE} WHERE id = ?`,
      [id]
    );
    return res.json({ data: admins[0] || null });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo admin', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { username, password, nombre_completo } = req.body;
    const result = await executeQuery(
      `INSERT INTO ${TABLE} (username, password, nombre_completo) VALUES (?, ?, ?)`,
      [username, password, nombre_completo]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    return res.status(500).json({ message: 'Error creando admin', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, nombre_completo } = req.body;
    await executeQuery(
      `UPDATE ${TABLE} SET username = ?, password = ?, nombre_completo = ? WHERE id = ?`,
      [username, password, nombre_completo, id]
    );
    return res.json({ message: 'Actualizado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error actualizando admin', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    return res.json({ message: 'Eliminado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error eliminando admin', error: error.message });
  }
};

module.exports = { login, me, list, getById, create, update, remove };