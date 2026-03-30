const { extractText } = require('../services/extractor.service');
const { detectFields } = require('../services/fieldDetector.service');

/**
 * POST /api/preview
 *
 * Extrae el texto del archivo y detecta campos dinámicos automáticamente.
 * No guarda nada — el cliente decide qué hacer con el resultado.
 *
 * Respuesta:
 *   - text          Texto completo extraído
 *   - normalizedText  Texto con marcadores reemplazados por {{key}}
 *   - fields        Array de campos dinámicos detectados
 *   - hasFields     Booleano indicando si se encontraron campos
 */
async function previewExtraction(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Se requiere un archivo (.docx o .pdf)' });
    }

    // ── 1. Extraer texto ──────────────────────────────────────────────────
    const text = await extractText(req.file.buffer, req.file.mimetype);

    if (!text) {
      return res.status(422).json({
        error: 'No se pudo extraer texto del archivo. ¿Está vacío o escaneado?',
      });
    }

    // ── 2. Detectar campos dinámicos ──────────────────────────────────────
    const { fields, normalizedText } = detectFields(text);

    // ── 3. Respuesta ──────────────────────────────────────────────────────
    return res.json({
      message: 'Extracción exitosa',
      data: {
        filename:       req.file.originalname,
        mimetype:       req.file.mimetype,
        size:           req.file.size,
        charCount:      text.length,
        wordCount:      text.trim().split(/\s+/).length,
        hasFields:      fields.length > 0,
        fields,          // el usuario puede editar los "label" antes de guardar
        text,            // texto original intacto
        normalizedText,  // texto con {{key}} en lugar de los marcadores
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { previewExtraction };