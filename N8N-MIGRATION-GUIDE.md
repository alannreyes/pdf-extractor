# 🔄 Guía de Migración N8N - Formato Consolidado

## ✨ ¿Qué Cambió?

La API ahora retorna un **formato consolidado más limpio** en lugar de respuestas individuales:

### ❌ Formato Anterior (Complejo)
```json
{
  "success": true,
  "data": {
    "claim_ack_letter_summary": "...",
    "cov_det_summary": "...",
    "demand_letter_summary": "..."
  },
  "metadata": {
    "processed_files": 3,
    "total_expected": 3,
    "processing_time_ms": 8750
  }
}
```

### ✅ Formato Nuevo (Consolidado)
```json
{
  "success": true,
  "timestamp": "2025-01-26T21:30:45.123Z",
  "summaries": {
    "claim_acknowledgment": "...",
    "coverage_determination": "...",
    "demand_letter": "..."
  },
  "processing_stats": {
    "files_processed": 3,
    "total_time_ms": 8750,
    "average_time_per_file": 2917,
    "successful_extractions": 3,
    "failed_extractions": 0
  }
}
```

## 🛠️ Actualización del Flujo N8N

### Opción 1: Usar Directamente (Recomendado)
Ya no necesitas Function Node para consolidar. Usa directamente:

```javascript
// Acceder a los summaries
const claimAck = $json.summaries.claim_acknowledgment;
const covDet = $json.summaries.coverage_determination;
const demandLetter = $json.summaries.demand_letter;

// Estadísticas disponibles
const stats = $json.processing_stats;
const totalTime = stats.total_time_ms;
const avgTime = stats.average_time_per_file;
```

### Opción 2: Mantener Compatibilidad
Si quieres mantener el formato anterior, agrega un Function Node:

```javascript
// Convertir nuevo formato a formato legacy
return {
  json: {
    success: $json.success,
    data: {
      claim_ack_letter_summary: $json.summaries.claim_acknowledgment,
      cov_det_summary: $json.summaries.coverage_determination,
      demand_letter_summary: $json.summaries.demand_letter
    },
    metadata: {
      processed_files: $json.processing_stats.files_processed,
      total_expected: 3,
      processing_time_ms: $json.processing_stats.total_time_ms
    }
  }
};
```

## 🎯 Ventajas del Nuevo Formato

1. **✅ Más Limpio**: Nombres de campos más claros
2. **✅ Más Información**: Estadísticas detalladas de procesamiento
3. **✅ Timestamp**: Marca de tiempo de procesamiento
4. **✅ Mejor Estructura**: Agrupación lógica de datos
5. **✅ Extensible**: Fácil agregar nuevos campos

## 🔧 Configuración N8N Actualizada

### HTTP Request Node
- **URL**: `http://automate_extractor:5010/api/process-claims`
- **Method**: POST
- **Body Content Type**: Form-Data
- **Parameter Name**: `files`
- **Type**: `n8n Binary Data`
- **Input Data Field Name**: `data`

### Uso en Nodos Siguientes
```javascript
// Ejemplo: Enviar solo el summary de claim acknowledgment
const summary = $json.summaries.claim_acknowledgment;

// Ejemplo: Crear respuesta completa
const response = {
  timestamp: $json.timestamp,
  claim_summary: $json.summaries.claim_acknowledgment,
  coverage_summary: $json.summaries.coverage_determination,
  demand_summary: $json.summaries.demand_letter,
  processing_time: $json.processing_stats.total_time_ms + "ms",
  success_rate: `${$json.processing_stats.successful_extractions}/${$json.processing_stats.files_processed}`
};
```

## 🚀 ¿Cuándo Actualizar?

- **Inmediatamente**: Si quieres el formato más limpio
- **Gradualmente**: Usar Opción 2 para mantener compatibilidad
- **Automático**: La API ya está devolviendo el nuevo formato

## 📞 Soporte

Si tienes problemas con la migración, verifica:
1. La URL de la API es correcta
2. Los nombres de campos han cambiado
3. La estructura de respuesta es diferente

¡El nuevo formato es mucho más fácil de usar! 🎉 