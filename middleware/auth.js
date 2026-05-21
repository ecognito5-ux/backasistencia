const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Requiere que el token tenga rol 'admin' (super admin del sistema)
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol de super admin' });
  }
  next();
};

const requireArea = (req, res, next) => {
  if (!req.user || req.user.role !== 'area') {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol de área' });
  }
  next();
};

const requireTrabajador = (req, res, next) => {
  if (!req.user || req.user.role !== 'trabajador') {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol de trabajador' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin, requireArea, requireTrabajador };