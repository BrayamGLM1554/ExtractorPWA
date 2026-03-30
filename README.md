# Machotes Extractor API

API REST para extraer texto de archivos `.docx` y `.pdf` y guardarlos como machotes en el sistema SaaS centralizado.

## Estructura del proyecto

```
machotes-api/
├── src/
│   ├── index.js                        # Punto de entrada
│   ├── app.js                          # Express app
│   ├── routes/
│   │   └── extract.routes.js
│   ├── controllers/
│   │   └── extract.controller.js
│   ├── services/
│   │   ├── extractor.service.js        # Extracción DOCX / PDF
│   │   └── machotes.service.js         # POST a API externa
│   └── middlewares/
│       └── upload.middleware.js        # Multer
├── .env.example
├── package.json
└── README.md
```

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con los valores reales
npm run dev      # desarrollo
npm start        # producción
```

## Variables de entorno

| Variable            | Descripción                                          | Default                                      |
|---------------------|------------------------------------------------------|----------------------------------------------|
| `PORT`              | Puerto del servidor                                  | `3000`                                       |
| `MACHOTES_API_URL`  | URL base de la API externa donde se guardan machotes | `https://machotes-guardado.onrender.com`     |

## Endpoint principal

### `POST /api/extract`

Recibe un archivo como `multipart/form-data` junto con los metadatos del machote.

**Form fields:**

| Campo          | Tipo           | Req | Descripción                                          |
|----------------|----------------|-----|------------------------------------------------------|
| `file`         | File (.docx/.pdf) | ✅ | Archivo a procesar (máx 10 MB)                      |
| `title`        | string         | ✅  | Nombre del machote                                   |
| `areaKey`      | string         | ✅  | Clave del área (ej: `"SEC"`)                         |
| `area`         | string         | ✅  | Nombre del área (ej: `"Secretaría"`)                 |
| `status`       | string         |     | `"active"` \| `"inactive"` — default: `"active"`    |
| `letterheadRef`| JSON string    |     | `{ id, areaId, nombre }`                             |
| `letterheadUrl`| string         |     | URL de la hoja membretada                            |
| `actor`        | JSON string    |     | `{ userId, name, email, role }`                      |

**Ejemplo con cURL:**

```bash
curl -X POST http://localhost:3000/api/extract \
  -F "file=@manual.docx" \
  -F "title=Manual de Procedimientos" \
  -F "areaKey=SEC" \
  -F "area=Secretaría" \
  -F "status=active" \
  -F 'letterheadRef={"id":"69b745dc2e6c8ae9f1e08117","areaId":"Secretaría","nombre":"Secretaria Oficial"}' \
  -F "letterheadUrl=https://res.cloudinary.com/xxxxx/image/upload/v123/hoja.png" \
  -F 'actor={"userId":"123","name":"Juan Mateo","email":"juan@correo.com","role":"ADMIN"}'
```

**Respuesta exitosa (201):**

```json
{
  "message": "Machote extraído y guardado correctamente",
  "data": {
    "_id": "...",
    "title": "Manual de Procedimientos",
    "areaKey": "SEC",
    "area": "Secretaría",
    "status": "active",
    "content": {
      "text": "PRESENTACIÓN INSTITUCIONAL\n\nEl Ayuntamiento de Atotonilco...",
      "html": "",
      "json": null
    },
    "letterheadRef": { ... },
    "letterheadUrl": "...",
    "createdBy": { ... }
  }
}
```

### `GET /health`

```json
{ "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z" }
```

---

## Opciones de hosting gratuito

### 1. Render ⭐ (Recomendado)
- **URL:** https://render.com
- **Plan gratuito:** Sí (se duerme tras 15 min de inactividad)
- **Despliegue:** Conecta tu repo de GitHub, elige "Web Service", Node.js detectado automáticamente
- **Variables de entorno:** Panel de configuración web
- **Notas:** Ideal para proyectos pequeños. El mismo `onrender.com` donde vive tu API externa.

### 2. Railway
- **URL:** https://railway.app
- **Plan gratuito:** $5 de crédito/mes (suficiente para proyectos ligeros)
- **Despliegue:** `railway up` desde terminal o conectar GitHub
- **Variables de entorno:** Panel web o `railway variables set`
- **Notas:** No duerme el servidor. Mejor experiencia DX que Render.

### 3. Fly.io
- **URL:** https://fly.io
- **Plan gratuito:** 3 VMs compartidas gratuitas
- **Despliegue:** `fly launch` + `fly deploy` con CLI
- **Variables de entorno:** `fly secrets set MACHOTES_API_URL=...`
- **Notas:** Más potente pero requiere tarjeta de crédito para registro.

### 4. Cyclic (ahora Koyeb)
- **URL:** https://www.koyeb.com
- **Plan gratuito:** 1 instancia nano gratuita (sin dormir)
- **Despliegue:** Conectar GitHub o Docker
- **Notas:** Buena alternativa sin cold starts.

### Comparativa rápida

| Plataforma | Gratuito | Duerme | Deploy desde GitHub | CLI |
|------------|----------|--------|---------------------|-----|
| Render     | ✅ Sí    | ✅ Sí  | ✅ Sí               | ✅  |
| Railway    | ⚠️ $5/mes | ❌ No | ✅ Sí               | ✅  |
| Fly.io     | ✅ Sí    | ❌ No  | ⚠️ Manual           | ✅  |
| Koyeb      | ✅ Sí    | ❌ No  | ✅ Sí               | ✅  |

---

## Despliegue en Render (paso a paso)

1. Sube el código a un repo en GitHub
2. Ve a https://render.com → New → Web Service
3. Conecta el repo
4. Configura:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. En "Environment Variables" agrega:
   - `MACHOTES_API_URL` = `https://machotes-guardado.onrender.com`
6. Deploy automático en cada push a `main`
