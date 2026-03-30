/**
 * Servicio de detección y normalización de campos dinámicos.
 *
 * Detecta tres tipos de patrones:
 *   1. Corchetes explícitos     — [NOMBRE], [FECHA DEL CONTRATO]
 *   2. Líneas en blanco cortas  — ____ o .... (4–19 caracteres) → campo real
 *   3. Separadores decorativos  — 20+ guiones/puntos seguidos   → inferir etiqueta del contexto
 *
 * Output: texto con todos los patrones reemplazados por [Etiqueta]
 */

// ── Patrones ─────────────────────────────────────────────────────────────────

const BRACKET_PATTERN   = /\[([^\]]{1,60})\]/g;          // [CAMPO EXISTENTE]
const BLANK_PATTERN     = /[._]{4,19}/g;                  // ____ campo corto real
const DECORATIVE_PATTERN = /[-_.]{20,}/g;                 // ------...------ decorativo largo

// ── Mapa de palabras clave → etiqueta ────────────────────────────────────────

const KEYWORD_MAP = [
  {
    keywords: ['fecha', 'día', 'dia', 'mes', 'año', 'ano', 'periodo',
               'plazo', 'vigencia', 'expedición', 'expedicion', 'emite',
               'suscribe', 'celebra', 'otorga'],
    label: 'Fecha',
  },
  {
    keywords: ['nombre', 'nombres', 'apellido', 'denominación', 'denominacion',
               'razón social', 'razon social', 'ciudadano', 'persona',
               'suscribe', 'subscribe', 'comparece', 'interesado'],
    label: 'Nombre',
  },
  {
    keywords: ['cargo', 'puesto', 'función', 'funcion', 'rol',
               'título', 'titulo', 'representante', 'apoderado'],
    label: 'Cargo',
  },
  {
    keywords: ['lugar', 'ciudad', 'municipio', 'estado', 'localidad',
               'domicilio', 'dirección', 'direccion', 'calle', 'colonia',
               'vecino', 'originario', 'residencia'],
    label: 'Lugar',
  },
  {
    keywords: ['cantidad', 'monto', 'importe', 'total', 'suma',
               'valor', 'precio', 'pago', 'salario', 'sueldo'],
    label: 'Monto',
  },
  {
    keywords: ['número', 'numero', 'folio', 'expediente', 'oficio',
               'clave', 'id', 'referencia', 'acta', 'registro'],
    label: 'Número',
  },
  {
    keywords: ['firma', 'firmas', 'rubrica', 'rúbrica', 'firma autógrafa',
               'sello', 'atentamente'],
    label: 'Firma',
  },
  {
    keywords: ['curp', 'rfc', 'ine', 'identificación', 'identificacion',
               'pasaporte', 'credencial'],
    label: 'CURP/RFC',
  },
  {
    keywords: ['objeto', 'descripción', 'descripcion', 'asunto',
               'motivo', 'concepto', 'hago constar', 'constancia'],
    label: 'Descripción',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extrae texto antes y después de una posición para inferir contexto.
 */
function getContext(text, start, end) {
  const before = text.slice(Math.max(0, start - 120), start);
  const after  = text.slice(end, Math.min(text.length, end + 120));
  return { before, after };
}

/**
 * Infiere una etiqueta legible a partir del contexto cercano al patrón.
 * Devuelve algo como "Fecha", "Nombre", "Lugar", etc.
 */
function inferLabel(before, after) {
  const context = `${before} ${after}`.toLowerCase();

  for (const { keywords, label } of KEYWORD_MAP) {
    if (keywords.some((kw) => context.includes(kw))) {
      return label;
    }
  }

  return 'Campo';  // fallback genérico
}

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * Procesa el texto extraído del documento y devuelve:
 *   - normalizedText : texto con [Etiqueta] en lugar de todos los patrones
 *   - fields         : array de campos detectados con su metadata
 */
function detectFields(text) {
  const matches = [];

  // ── 1. Corchetes explícitos [YA SON CAMPOS] ───────────────────────────────
  const bracketRe = new RegExp(BRACKET_PATTERN.source, 'g');
  let m;
  while ((m = bracketRe.exec(text)) !== null) {
    matches.push({
      start:         m.index,
      end:           m.index + m[0].length,
      originalMatch: m[0],
      baseLabel:     m[1].trim(),          // usar el texto del corchete directamente
      source:        'bracket',
    });
  }

  // ── 2. Blancos cortos (campo real, inferir etiqueta) ──────────────────────
  const blankRe = new RegExp(BLANK_PATTERN.source, 'g');
  while ((m = blankRe.exec(text)) !== null) {
    // Evitar solapar con corchetes ya detectados
    const overlaps = matches.some(x => m.index >= x.start && m.index < x.end);
    if (overlaps) continue;

    const { before, after } = getContext(text, m.index, m.index + m[0].length);
    matches.push({
      start:         m.index,
      end:           m.index + m[0].length,
      originalMatch: m[0],
      baseLabel:     inferLabel(before, after),
      source:        'blank',
    });
  }

  // ── 3. Separadores decorativos (inferir etiqueta del contexto) ────────────
  const decorRe = new RegExp(DECORATIVE_PATTERN.source, 'g');
  while ((m = decorRe.exec(text)) !== null) {
    const overlaps = matches.some(x => m.index >= x.start && m.index < x.end);
    if (overlaps) continue;

    const { before, after } = getContext(text, m.index, m.index + m[0].length);
    matches.push({
      start:         m.index,
      end:           m.index + m[0].length,
      originalMatch: m[0],
      baseLabel:     inferLabel(before, after),
      source:        'decorative',
    });
  }

  // Ordenar por posición de aparición
  matches.sort((a, b) => a.start - b.start);

  // ── Construir normalizedText reemplazando de atrás hacia adelante ─────────
  const seen = new Map();

  // Primero asignar etiquetas únicas a cada match en orden
    for (const match of matches) {
        match.label = match.baseLabel;  // ✅ "Fecha" siempre es "Fecha"
    }   

  // Luego reemplazar en el texto de atrás hacia adelante (para no desplazar índices)
  let normalizedText = text;
  for (const match of [...matches].reverse()) {
    normalizedText =
      normalizedText.slice(0, match.start) +
      `[${match.label}]` +
      normalizedText.slice(match.end);
  }

  // ── Construir array de fields ─────────────────────────────────────────────
  const fields = matches.map((match) => ({
    label:         match.label,          // "Fecha", "Nombre 2", etc.
    source:        match.source,         // 'bracket' | 'blank' | 'decorative'
    originalMatch: match.originalMatch,  // texto original que se reemplazó
  }));

  return { fields, normalizedText };
}

module.exports = { detectFields };
