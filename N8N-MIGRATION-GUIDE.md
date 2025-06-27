# 🔄 Guía API Simplificada - Respuestas Individuales

## ✨ ¿Qué Cambió?

La API ahora está **SIMPLIFICADA** para procesar **UN archivo a la vez** y devolver **respuestas individuales**:

### ✅ Formato Nuevo (Individual y Simple)
```json
{
  "success": true,
  "timestamp": "2025-01-26T21:30:45.123Z",
  "filename": "CLAIM_ACK_LETTER.pdf",
  "fieldname": "claim_ack_letter_summary",
  "summary": "On November 4, 2024, Defendant acknowledged the claim and assigned the adjustment of the claim to Christi Manly...",
  "processing_time_ms": 2737
}
```

### ❌ Formato de Error Individual
```json
{
  "success": false,
  "timestamp": "2025-01-26T21:30:45.123Z",
  "filename": "UNKNOWN_FILE.pdf",
  "fieldname": "",
  "summary": "",
  "processing_time_ms": 150,
  "error": "Archivo UNKNOWN_FILE.pdf no está configurado en la base de datos"
}
```

## 🛠️ Configuración N8N Actualizada

### HTTP Request Node
- **URL**: `http://automate_extractor:5010/api/process-claims`
- **Method**: POST
- **Body Content Type**: Form-Data
- **Parameter Name**: `file` (singular, no `files`)
- **Type**: `n8n Binary File`
- **Input Data Field Name**: `data`

### ✅ Ventajas del Formato Individual

1. **🚀 Más Simple**: Una petición = Una respuesta
2. **🔄 Compatible con N8N**: Funciona perfecto con el flujo actual
3. **📊 Respuesta Directa**: Sin consolidación compleja
4. **⚡ Más Rápido**: Sin lógica de agrupación
5. **🐛 Menos Errores**: Lógica más simple = menos bugs

## 📋 Cambios en el Endpoint

### Antes (Múltiples archivos)
```bash
curl -X POST http://localhost:5010/api/process-claims \
  -F "files=@CLAIM_ACK_LETTER.pdf" \
  -F "files=@COVERAGE_DETERMINATION.pdf" \
  -F "files=@DEMAND_LETTER.pdf"
```

### Ahora (Un archivo)
```bash
curl -X POST http://localhost:5010/api/process-claims \
  -F "file=@CLAIM_ACK_LETTER.pdf"
```

## 🎯 Uso en N8N

### Ejemplo de Uso en Function Node
```javascript
// Acceder a la respuesta individual
const filename = $json.filename;
const summary = $json.summary;
const success = $json.success;
const processingTime = $json.processing_time_ms;

// Crear respuesta personalizada
const response = {
  file: filename,
  content: summary,
  processed_successfully: success,
  time_taken: processingTime + "ms"
};

return { json: response };
```

### Manejo de Errores
```javascript
if (!$json.success) {
  // Archivo falló
  const errorMessage = $json.error || 'Error desconocido';
  return { 
    json: { 
      error: true, 
      message: errorMessage,
      filename: $json.filename 
    } 
  };
}

// Archivo procesado exitosamente
return { 
  json: { 
    success: true, 
    summary: $json.summary,
    filename: $json.filename
  } 
};
```

## 🔧 Configuración Recomendada en N8N

1. **Nodo "Descargar Archivo"**: Mantener igual
2. **Nodo "PDF Extract"**: 
   - Cambiar `files` por `file`
   - Una ejecución por archivo (N8N lo hace automáticamente)
3. **Nodos Siguientes**: Procesar respuesta individual

## 📞 Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/process-claims` | POST | Procesa UN archivo PDF |
| `/api/health` | GET | Estado del servicio |
| `/api/claims/config` | GET | Archivos esperados |

## 🚀 Migración Inmediata

**No necesitas cambiar nada en N8N** - el flujo actual funcionará perfectamente porque:
- N8N ya envía archivos individuales
- La API ahora los procesa individualmente
- Cada archivo recibe su propia respuesta

¡Es la solución perfecta! 🎉 