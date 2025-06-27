# 📄 PDF Extractor API - Respuestas Individuales

Backend NestJS simplificado para procesar archivos PDF individualmente usando OpenAI GPT-4.1 Mini.

## ✨ Características

- 🚀 **Procesamiento Individual**: Un archivo por petición
- 🤖 **IA Integrada**: OpenAI GPT-4.1 Mini para análisis inteligente
- 📊 **Respuestas Directas**: Sin consolidación compleja
- 🔄 **Compatible con N8N**: Funciona perfecto con flujos existentes
- 🐛 **Menos Errores**: Lógica simplificada y más robusta
- ⚡ **Más Rápido**: Sin procesamiento paralelo complejo

## 🎯 Formato de Respuesta

### ✅ Respuesta Exitosa
```json
{
  "success": true,
  "timestamp": "2025-01-26T21:30:45.123Z",
  "filename": "CLAIM_ACK_LETTER.pdf",
  "fieldname": "claim_ack_letter_summary",
  "summary": "On November 4, 2024, Defendant acknowledged the claim...",
  "processing_time_ms": 2737
}
```

### ❌ Respuesta con Error
```json
{
  "success": false,
  "timestamp": "2025-01-26T21:30:45.123Z",
  "filename": "UNKNOWN_FILE.pdf",
  "fieldname": "",
  "summary": "",
  "processing_time_ms": 150,
  "error": "Archivo no configurado en la base de datos"
}
```

## 🚀 Instalación y Uso

### Requisitos
- Node.js 18+
- MySQL 8.0+
- OpenAI API Key

### Configuración
1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Configura variables de entorno (ver `env.example`)
4. Inicia el servidor: `npm run start:dev`

### Variables de Entorno
```env
PORT=5010
NODE_ENV=production
DB_HOST=automate_mysql
DB_NAME=axioma
DB_USERNAME=mysql
DB_PASSWORD=tu_password
OPENAI_API_KEY=sk-tu-api-key
OPENAI_MODEL=gpt-4.1-mini
MAX_FILE_SIZE=10485760
```

## 📋 Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/process-claims` | POST | Procesa UN archivo PDF |
| `/api/health` | GET | Estado del servicio |
| `/api/claims/config` | GET | Configuración de archivos |

## 🔧 Uso con cURL

```bash
# Procesar un archivo
curl -X POST http://localhost:5010/api/process-claims \
  -F "file=@CLAIM_ACK_LETTER.pdf"

# Health check
curl -X GET http://localhost:5010/api/health

# Ver configuración
curl -X GET http://localhost:5010/api/claims/config
```

## 🛠️ Integración con N8N

### Configuración HTTP Request Node
- **URL**: `http://automate_extractor:5010/api/process-claims`
- **Method**: POST
- **Body Content Type**: Form-Data
- **Parameter Name**: `file` (singular)
- **Type**: `n8n Binary File`

### Ejemplo Function Node
```javascript
// Procesar respuesta individual
const response = {
  filename: $json.filename,
  content: $json.summary,
  success: $json.success,
  processing_time: $json.processing_time_ms + "ms"
};

return { json: response };
```

## 🗃️ Base de Datos

La API lee la configuración desde la tabla `claimextract`:

```sql
CREATE TABLE claimextract (
  id INT PRIMARY KEY,
  filename VARCHAR(255),
  fieldname VARCHAR(255),
  prompt TEXT
);
```

## 📊 Archivos Soportados

- `CLAIM_ACK_LETTER.pdf` → `claim_ack_letter_summary`
- `COVERAGE_DETERMINATION.pdf` → `cov_det_summary`
- `DEMAND_LETTER.pdf` → `demand_letter_summary`

## 🐛 Manejo de Errores

- **Archivo no configurado**: Devuelve error específico
- **PDF corrupto**: Error de extracción de texto
- **OpenAI falla**: Error de procesamiento IA
- **BD desconectada**: Error 500

## 🎉 Ventajas de la Simplificación

1. **🚀 Más Simple**: Una petición = Una respuesta
2. **🔄 Compatible**: Funciona con N8N actual
3. **⚡ Más Rápido**: Sin lógica de consolidación
4. **🐛 Menos Errores**: Código más simple y robusto
5. **📊 Respuesta Directa**: Sin formato complejo

## 📞 Soporte

Para problemas o preguntas, revisa los logs del servidor o contacta al equipo de desarrollo.

---

**Versión**: 2.0.0 (Simplificada)  
**Autor**: Alan Reyes  
**Licencia**: MIT 