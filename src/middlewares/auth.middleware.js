const axios = require('axios');

const LOGIN_API_URL =
  process.env.LOGIN_API_URL || 'https://login-pwa-atoto.onrender.com';

/**
 * Valida el Bearer token consultando el endpoint /perfil de la API de login.
 * Si el token es válido, adjunta el perfil del usuario en req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const response = await axios.get(`${LOGIN_API_URL}/auth/perfil`, {
      headers: { Authorization: authHeader },
      timeout: 8000,
    });

    // La API de login devuelve { perfil: { ... } }
    req.user = response.data.perfil;

    next();
  } catch (err) {
    if (err.response) {
      // El token fue rechazado por la API de login
      return res.status(err.response.status).json(err.response.data);
    }
    // Error de red / timeout
    return res.status(502).json({
      error: 'No se pudo verificar el token con el servicio de autenticación',
    });
  }
};

/**
 * Solo permite acceso a usuarios con rol ADMIN.
 */
const soloAdmin = (req, res, next) => {
  if (req.user?.rol !== 'ADMIN') {
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  }
  next();
};

/**
 * Permite acceso a ADMIN y JEFE_AREA (quienes pueden gestionar machotes).
 */
const puedeGestionarMachotes = (req, res, next) => {
  if (!['ADMIN', 'JEFE_AREA'].includes(req.user?.rol)) {
    return res.status(403).json({
      error: 'No tienes permiso para gestionar machotes',
    });
  }
  next();
};

module.exports = { authMiddleware, soloAdmin, puedeGestionarMachotes };