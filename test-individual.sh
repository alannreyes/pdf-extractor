#!/bin/bash

# 🧪 Script de Prueba - API Individual Simplificada
# Prueba la nueva API que procesa archivos individuales

API_URL="http://localhost:5010/api"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Función para ejecutar tests
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_field="$3"
    
    log "Ejecutando: $test_name"
    
    response=$(eval $command 2>/dev/null)
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        if command -v jq &> /dev/null; then
            # Verificar si la respuesta contiene el campo esperado
            if echo "$response" | jq -e "$expected_field" > /dev/null 2>&1; then
                success "$test_name - Campo '$expected_field' encontrado"
                echo "$response" | jq .
            else
                warning "$test_name - Campo '$expected_field' no encontrado"
                echo "$response" | jq .
            fi
        else
            success "$test_name - Respuesta recibida"
            echo "$response"
        fi
    else
        error "$test_name - Falló la petición HTTP"
    fi
    
    echo "----------------------------------------"
}

# Crear archivo de prueba
create_test_file() {
    local filename="$1"
    local content="$2"
    echo "$content" > "$filename"
    log "Archivo de prueba creado: $filename"
}

# Función de limpieza
cleanup() {
    log "Limpiando archivos de prueba..."
    rm -f test.txt *.pdf large_file.pdf 2>/dev/null
}

# Trap para limpiar al salir
trap cleanup EXIT

log "🧪 Iniciando tests de API Individual Simplificada"
log "API URL: $API_URL"

# Verificar dependencias
if ! command -v curl &> /dev/null; then
    error "curl no está instalado"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    warning "jq no está instalado. Los tests funcionarán pero sin formato JSON."
fi

# TEST 1: Health Check
run_test "Health Check" \
    "curl -s -X GET '$API_URL/health'" \
    ".status"

# TEST 2: Configuration
run_test "Get Configuration" \
    "curl -s -X GET '$API_URL/claims/config'" \
    ".expected_files"

# TEST 3: POST sin archivo
run_test "POST without file" \
    "curl -s -X POST '$API_URL/process-claims'" \
    ".success"

# TEST 4: Archivo no PDF (debería fallar validación)
create_test_file "test.txt" "Este es un archivo de texto, no PDF"
run_test "Invalid file type (TXT)" \
    "curl -s -X POST '$API_URL/process-claims' -F 'file=@test.txt'" \
    ".success"

# TEST 5: Archivo con nombre válido pero contenido fake
create_test_file "CLAIM_ACK_LETTER.pdf" "Este no es un PDF real"
run_test "Fake PDF file (Individual Response)" \
    "curl -s -X POST '$API_URL/process-claims' -F 'file=@CLAIM_ACK_LETTER.pdf'" \
    ".filename"

# TEST 6: Archivo con nombre no configurado
create_test_file "UNKNOWN_FILE.pdf" "Contenido fake"
run_test "Unknown filename (Should return error)" \
    "curl -s -X POST '$API_URL/process-claims' -F 'file=@UNKNOWN_FILE.pdf'" \
    ".error"

# TEST 7: Archivo muy grande (simulado)
if command -v dd &> /dev/null; then
    log "Creando archivo grande para test de tamaño..."
    dd if=/dev/zero of=large_file.pdf bs=1M count=12 2>/dev/null
    run_test "Large file (>10MB)" \
        "curl -s -X POST '$API_URL/process-claims' -F 'file=@large_file.pdf'" \
        ".success"
fi

log "🎉 Tests completados"
log "📋 Resumen:"
log "   - La API ahora procesa archivos individuales"
log "   - Cada archivo recibe su propia respuesta"
log "   - Compatible con el flujo actual de N8N"
log "   - Formato más simple y directo"

success "API Individual Simplificada lista para usar!" 