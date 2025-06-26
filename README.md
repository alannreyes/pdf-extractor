# PDF Extractor - Backend NestJS

Backend en NestJS que procesa archivos PDF usando OpenAI GPT-4.1 Mini según configuraciones almacenadas en una base de datos MySQL existente.

## 🚀 Características

- ✅ Procesamiento de archivos PDF (0-3 archivos por request)
- ✅ Integración con OpenAI GPT-4.1 Mini (configurable)
- ✅ Conexión a base de datos MySQL existente
- ✅ Manejo robusto de errores con filtros globales
- ✅ Logging detallado con interceptores
- ✅ API REST con 3 endpoints
- ✅ **Procesamiento paralelo** de archivos para mejor rendimiento
- ✅ **Cache inteligente** para consultas de base de datos
- ✅ **Validación avanzada** de archivos con sanitización
- ✅ **Configuración de seguridad** CORS y validaciones
- ✅ **Limpieza automática** de memoria y buffers

## 📋 Endpoints

### Procesamiento Principal
```
POST /api/process-claims
Content-Type: multipart/form-data
```

### Health Check
```
GET /api/health
```

### Configuración
```
GET /api/claims/config
```

## ⚙️ Variables de Entorno

Copiar `env.example` a `.env` y configurar:

```bash
# Base de datos
DB_HOST=automate_mysql
DB_PORT=3306
DB_USERNAME=mysql
DB_PASSWORD=REPLACE_WITH_ACTUAL_PASSWORD
DB_DATABASE=axioma

# OpenAI
OPENAI_API_KEY=sk-REPLACE_WITH_YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TIMEOUT=30000
OPENAI_MAX_RETRIES=2

# Aplicación
PORT=3000
NODE_ENV=production
MAX_FILE_SIZE=10485760
```

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus valores

# Ejecutar en desarrollo
npm run start:dev

# Ejecutar en producción
npm run build
npm run start:prod
```

## 📊 Estado del Desarrollo

Ver `plan.txt` para el progreso detallado del desarrollo.

## 🔧 Tecnologías

- **Framework**: NestJS
- **Base de datos**: MySQL + TypeORM
- **IA**: OpenAI GPT-4.1 Mini
- **Procesamiento PDF**: pdf-parse
- **Lenguaje**: TypeScript 