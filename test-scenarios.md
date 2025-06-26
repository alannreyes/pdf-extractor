# 🧪 ESCENARIOS DE PRUEBA - PDF Extractor API

## 📋 Lista de Verificación de Pruebas

### ✅ Casos Básicos
- [ ] 9.1 POST vacío (sin archivos)
- [ ] 9.2 Un archivo válido 
- [ ] 9.3 Dos archivos válidos
- [ ] 9.4 Tres archivos válidos (caso ideal)
- [ ] 9.5 PDF corrupto
- [ ] 9.6 Archivo extra no registrado
- [ ] 9.7 Timeout de OpenAI
- [ ] 9.8 Error de conexión a BD
- [ ] 9.9 Validar estructura JSON
- [ ] 9.10 Validar logs generados

## 🔍 **CASO 1: Health Check**
```bash
curl -X GET https://tu-dominio.com/api/health
```
**Respuesta esperada:**
```json
{
  "status": "ok",
  "database": "connected", 
  "openai": "configured",
  "uptime": "string"
}
```

## 🔍 **CASO 2: Configuración**
```bash
curl -X GET https://tu-dominio.com/api/claims/config
```
**Respuesta esperada:**
```json
{
  "expectedFiles": [
    {"filename": "CLAIM_ACK_LETTER.pdf", "fieldname": "claim_ack_letter_summary"},
    {"filename": "COVERAGE_DETERMINATION.pdf", "fieldname": "cov_det_summary"},
    {"filename": "DEMAND_LETTER.pdf", "fieldname": "demand_letter_summary"}
  ]
}
```

## 🔍 **CASO 3: POST Vacío (Sin archivos)**
```bash
curl -X POST https://tu-dominio.com/api/process-claims
```
**Respuesta esperada:**
```json
{
  "success": false,
  "message": "No se proporcionaron archivos para procesar",
  "processedFiles": 0,
  "results": [],
  "errors": ["No files provided"],
  "totalProcessingTime": "0ms"
}
```

## 🔍 **CASO 4: Un Archivo Válido**
```bash
curl -X POST https://tu-dominio.com/api/process-claims \
  -F "files=@CLAIM_ACK_LETTER.pdf"
```
**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Procesamiento completado con 1 archivo",
  "processedFiles": 1,
  "results": [
    {
      "filename": "CLAIM_ACK_LETTER.pdf",
      "fieldname": "claim_ack_letter_summary", 
      "success": true,
      "summary": "Resumen generado...",
      "processingTime": "2.5s"
    }
  ],
  "errors": [],
  "totalProcessingTime": "2.5s"
}
```

## 🔍 **CASO 5: Tres Archivos Válidos (Caso Ideal)**
```bash
curl -X POST https://tu-dominio.com/api/process-claims \
  -F "files=@CLAIM_ACK_LETTER.pdf" \
  -F "files=@COVERAGE_DETERMINATION.pdf" \
  -F "files=@DEMAND_LETTER.pdf"
```
**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Procesamiento completado con 3 archivos",
  "processedFiles": 3,
  "results": [
    {
      "filename": "CLAIM_ACK_LETTER.pdf",
      "fieldname": "claim_ack_letter_summary",
      "success": true,
      "summary": "Resumen...",
      "processingTime": "2.5s"
    },
    {
      "filename": "COVERAGE_DETERMINATION.pdf", 
      "fieldname": "cov_det_summary",
      "success": true,
      "summary": "Resumen...",
      "processingTime": "3.1s"
    },
    {
      "filename": "DEMAND_LETTER.pdf",
      "fieldname": "demand_letter_summary",
      "success": true, 
      "summary": "Resumen...",
      "processingTime": "2.8s"
    }
  ],
  "errors": [],
  "totalProcessingTime": "8.4s"
}
```

## 🔍 **CASO 6: Archivo No Válido (No PDF)**
```bash
curl -X POST https://tu-dominio.com/api/process-claims \
  -F "files=@documento.txt"
```
**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Error de validación de archivos",
  "processedFiles": 0,
  "results": [],
  "errors": ["File documento.txt is not a valid PDF"],
  "totalProcessingTime": "0ms"
}
```

## 🔍 **CASO 7: Archivo Extra No Registrado**
```bash
curl -X POST https://tu-dominio.com/api/process-claims \
  -F "files=@CLAIM_ACK_LETTER.pdf" \
  -F "files=@ARCHIVO_DESCONOCIDO.pdf"
```
**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Procesamiento completado con 1 archivo procesado",
  "processedFiles": 1,
  "results": [
    {
      "filename": "CLAIM_ACK_LETTER.pdf",
      "fieldname": "claim_ack_letter_summary",
      "success": true,
      "summary": "Resumen...",
      "processingTime": "2.5s"
    },
    {
      "filename": "ARCHIVO_DESCONOCIDO.pdf",
      "fieldname": "",
      "success": false,
      "summary": "",
      "processingTime": "0ms",
      "error": "Archivo no configurado en la base de datos"
    }
  ],
  "errors": ["ARCHIVO_DESCONOCIDO.pdf no está configurado"],
  "totalProcessingTime": "2.5s"
}
```

## 🔍 **CASO 8: Tamaño de Archivo Excesivo**
```bash
# Archivo > 10MB
curl -X POST https://tu-dominio.com/api/process-claims \
  -F "files=@archivo-grande.pdf"
```
**Respuesta esperada:**
```json
{
  "success": false,
  "message": "Error de validación de archivos",
  "processedFiles": 0,
  "results": [],
  "errors": ["File archivo-grande.pdf exceeds maximum size of 10MB"],
  "totalProcessingTime": "0ms"
}
```

## 🔍 **CASO 9: PDF Corrupto**
```bash
curl -X POST https://tu-dominio.com/api/process-claims \
  -F "files=@pdf-corrupto.pdf"
```
**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Procesamiento completado con errores",
  "processedFiles": 0,
  "results": [
    {
      "filename": "pdf-corrupto.pdf",
      "fieldname": "claim_ack_letter_summary",
      "success": false,
      "summary": "",
      "processingTime": "1.2s",
      "error": "Error al extraer texto del PDF"
    }
  ],
  "errors": ["Error procesando pdf-corrupto.pdf"],
  "totalProcessingTime": "1.2s"
}
```

## 📊 **Validaciones de Estructura JSON**

Todas las respuestas DEBEN contener:
- ✅ `success`: boolean
- ✅ `message`: string
- ✅ `processedFiles`: number
- ✅ `results`: array
- ✅ `errors`: array
- ✅ `totalProcessingTime`: string

Cada item en `results` DEBE contener:
- ✅ `filename`: string
- ✅ `fieldname`: string
- ✅ `success`: boolean
- ✅ `summary`: string
- ✅ `processingTime`: string
- ❓ `error`: string (solo si success=false)

## 🎯 **Criterios de Aceptación**

1. **Nunca Error 500** - Solo errores de BD pueden generar 500
2. **Estructura Consistente** - Todas las respuestas tienen la misma estructura
3. **Manejo de Errores** - Errores parciales no interrumpen procesamiento
4. **Limpieza de Memoria** - No memory leaks después del procesamiento
5. **Logs Informativos** - Cada operación se logea apropiadamente
6. **Timeouts Manejados** - Timeouts de OpenAI se manejan gracefully

## 🚀 **Script de Pruebas Automáticas**

```bash
#!/bin/bash
API_URL="https://tu-dominio.com/api"

echo "🧪 Iniciando pruebas de API..."

# Test 1: Health Check
echo "Test 1: Health Check"
curl -s "$API_URL/health" | jq .

# Test 2: Config
echo "Test 2: Config"  
curl -s "$API_URL/claims/config" | jq .

# Test 3: POST vacío
echo "Test 3: POST vacío"
curl -s -X POST "$API_URL/process-claims" | jq .

echo "✅ Pruebas completadas"
``` 