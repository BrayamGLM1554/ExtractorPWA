const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

/**
 * Extrae texto plano de un buffer DOCX
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractFromDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });

  if (result.messages && result.messages.length > 0) {
    const warnings = result.messages
      .filter((m) => m.type === 'warning')
      .map((m) => m.message);
    if (warnings.length) {
      console.warn('[DOCX Warnings]', warnings.join(' | '));
    }
  }

  return result.value.trim();
}

/**
 * Extrae texto plano de un buffer PDF
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
async function extractFromPdf(buffer) {
  const data = await pdfParse(buffer);
  return data.text.trim();
}

/**
 * Detecta el tipo de archivo y extrae el texto
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @returns {Promise<string>}
 */
async function extractText(buffer, mimetype) {
  if (
    mimetype ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractFromDocx(buffer);
  }

  if (mimetype === 'application/pdf') {
    return extractFromPdf(buffer);
  }

  throw Object.assign(
    new Error(`Tipo de archivo no soportado: ${mimetype}`),
    { status: 400 }
  );
}

module.exports = { extractText };
