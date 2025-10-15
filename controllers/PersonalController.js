const { executeQuery } = require('../config/database');

const TABLE = 'personal_area';

const list = async (req, res) => {
  try {
    const rows = await executeQuery(`SELECT * FROM ${TABLE}`);
    return res.json({ data: rows });
  } catch (error) {
    return res.status(500).json({ message: 'Error listando personal de área', error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await executeQuery(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
    return res.json({ data: rows[0] || null });
  } catch (error) {
    return res.status(500).json({ message: 'Error obteniendo personal de área', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { id_area_laboral, username, password, nombre_completo } = req.body;
    const result = await executeQuery(
      `INSERT INTO ${TABLE} (id_area_laboral, username, password, nombre_completo) VALUES (?, ?, ?, ?)`,
      [id_area_laboral, username, password, nombre_completo]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    return res.status(500).json({ message: 'Error creando personal de área', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_area_laboral, username, password, nombre_completo } = req.body;
    await executeQuery(
      `UPDATE ${TABLE} SET id_area_laboral = ?, username = ?, password = ?, nombre_completo = ? WHERE id = ?`,
      [id_area_laboral, username, password, nombre_completo, id]
    );
    return res.json({ message: 'Actualizado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error actualizando personal de área', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    await executeQuery(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    return res.json({ message: 'Eliminado' });
  } catch (error) {
    return res.status(500).json({ message: 'Error eliminando personal de área', error: error.message });
  }
};

module.exports = { list, getById, create, update, remove };