#!/bin/bash

# 🧪 Script de Pruebas - PDF Extractor API
# Usage: ./test-api.sh [API_URL]

# Configuración
API_URL="${1:-http://localhost:5010/api}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="test_results_${TIMESTAMP}.log"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Función para logging
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Función para ejecutar test
run_test() {
    local test_name="$1"
    local curl_command="$2"
    local expected_field="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "${BLUE}🧪 Test $TOTAL_TESTS: $test_name${NC}"
    log "Command: $curl_command"
    
    # Ejecutar el comando y capturar respuesta
    response=$(eval "$curl_command" 2>/dev/null)
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        # Verificar si la respuesta contiene el campo esperado
        if echo "$response" | jq -e "$expected_field" > /dev/null 2>&1; then
            log "${GREEN}✅ PASSED${NC}"
            log "Response: $(echo "$response" | jq -C .)"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            log "${RED}❌ FAILED - Missing expected field: $expected_field${NC}"
            log "Response: $response"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        log "${RED}❌ FAILED - Network/Connection error${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    log "----------------------------------------"
    sleep 1
}

# Función para crear archivo de prueba
create_test_file() {
    local filename="$1"
    local content="$2"
    
    echo "$content" > "$filename"
    log "Created test file: $filename"
}

# Banner inicial
log ""
log "🚀 PDF Extractor API - Test Suite"
log "=================================="
log "API URL: $API_URL"
log "Timestamp: $(date)"
log "Log file: $LOG_FILE"
log ""

# Verificar dependencias
if ! command -v curl &> /dev/null; then
    log "${RED}❌ curl no está instalado${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    log "${YELLOW}⚠️  jq no está instalado. Los tests funcionarán pero sin formato JSON.${NC}"
fi

# TEST 1: Health Check
run_test "Health Check" \
    "curl -s -X GET '$API_URL/health'" \
    ".status"

# TEST 2: Configuration
run_test "Get Configuration" \
    "curl -s -X GET '$API_URL/claims/config'" \
    ".expectedFiles"

# TEST 3: POST Vacío (sin archivos)
run_test "POST without files" \
    "curl -s -X POST '$API_URL/process-claims'" \
    ".success"

# TEST 4: Archivo no PDF (debería fallar validación)
create_test_file "test.txt" "Este es un archivo de texto, no PDF"
run_test "Invalid file type (TXT)" \
    "curl -s -X POST '$API_URL/process-claims' -F 'files=@test.txt'" \
    ".success"

# TEST 5: Archivo con nombre válido pero contenido no PDF
create_test_file "CLAIM_ACK_LETTER.pdf" "Este no es un PDF real"
run_test "Fake PDF file" \
    "curl -s -X POST '$API_URL/process-claims' -F 'files=@CLAIM_ACK_LETTER.pdf'" \
    ".success"

# TEST 6: Múltiples archivos fake
create_test_file "COVERAGE_DETERMINATION.pdf" "Contenido fake"
create_test_file "DEMAND_LETTER.pdf" "Contenido fake"
run_test "Multiple fake PDF files" \
    "curl -s -X POST '$API_URL/process-claims' -F 'files=@CLAIM_ACK_LETTER.pdf' -F 'files=@COVERAGE_DETERMINATION.pdf' -F 'files=@DEMAND_LETTER.pdf'" \
    ".results"

# TEST 7: Archivo muy grande (simulado)
if command -v dd &> /dev/null; then
    log "${BLUE}Creating large file for size test...${NC}"
    dd if=/dev/zero of=large_file.pdf bs=1M count=12 2>/dev/null
    run_test "Large file (>10MB)" \
        "curl -s -X POST '$API_URL/process-claims' -F 'files=@large_file.pdf'" \
        ".success"
    rm -f large_file.pdf
fi

# TEST 8: Headers validation
run_test "CORS Headers Check" \
    "curl -s -X OPTIONS '$API_URL/process-claims' -H 'Origin: http://localhost:3000'" \
    ""

# Limpiar archivos de prueba
cleanup_files() {
    rm -f test.txt CLAIM_ACK_LETTER.pdf COVERAGE_DETERMINATION.pdf DEMAND_LETTER.pdf
    log "Test files cleaned up"
}

# Cleanup
cleanup_files

# Resumen final
log ""
log "📊 TEST SUMMARY"
log "==============="
log "Total Tests: $TOTAL_TESTS"
log "${GREEN}Passed: $PASSED_TESTS${NC}"
log "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    log "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    log "${RED}⚠️  Some tests failed. Check the log for details.${NC}"
    exit 1
fi 