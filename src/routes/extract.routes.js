const { Router } = require('express');
const upload = require('../middlewares/upload.middleware');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { previewExtraction } = require('../controllers/preview.controller');

const router = Router();

/**
 * POST /api/preview
 * Extrae el texto del archivo y lo devuelve sin guardar nada.
 * El frontend recibe el texto, el usuario lo revisa y decide
 * si mandarlo directamente a la API de machotes.
 * Requiere Bearer token válido (cualquier rol).
 */
router.post(
  '/preview',
  authMiddleware,
  upload.single('file'),
  previewExtraction
);

module.exports = router;