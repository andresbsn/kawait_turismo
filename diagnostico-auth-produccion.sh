#!/bin/bash

echo "=========================================="
echo "DIAGNÓSTICO DE AUTENTICACIÓN EN PRODUCCIÓN"
echo "=========================================="
echo ""

echo "1. VERIFICANDO VARIABLES DE ENTORNO DEL BACKEND"
echo "------------------------------------------------"
echo "CORS_ORIGINS configurado:"
grep CORS_ORIGINS .env 2>/dev/null || echo "❌ No se encontró CORS_ORIGINS en .env"
echo ""
echo "JWT_SECRET configurado:"
grep JWT_SECRET .env 2>/dev/null | sed 's/JWT_SECRET=.*/JWT_SECRET=***/' || echo "❌ No se encontró JWT_SECRET en .env"
echo ""
echo "NODE_ENV:"
grep NODE_ENV .env 2>/dev/null || echo "⚠️  No se encontró NODE_ENV en .env"
echo ""

echo "2. VERIFICANDO LOGS DEL BACKEND (últimas 50 líneas)"
echo "----------------------------------------------------"
echo "Buscando errores de autenticación..."
echo ""

# Si usas PM2
if command -v pm2 &> /dev/null; then
    echo "📋 Logs de PM2:"
    pm2 logs backend --lines 50 --nostream 2>/dev/null | grep -E "AUTH|401|Token|CORS" || echo "No se encontraron logs de PM2"
fi

# Si usas Docker
if command -v docker &> /dev/null; then
    echo "🐳 Logs de Docker:"
    docker logs $(docker ps -q -f name=backend) --tail 50 2>/dev/null | grep -E "AUTH|401|Token|CORS" || echo "No se encontraron logs de Docker"
fi

echo ""
echo "3. VERIFICANDO PROCESO DEL BACKEND"
echo "-----------------------------------"
if command -v pm2 &> /dev/null; then
    pm2 list | grep backend
elif command -v docker &> /dev/null; then
    docker ps | grep backend
else
    ps aux | grep node | grep -v grep
fi

echo ""
echo "4. VERIFICANDO CONECTIVIDAD"
echo "----------------------------"
echo "Probando conexión al backend en puerto 3004:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3004/api/auth/me 2>/dev/null || echo "❌ No se pudo conectar al backend"

echo ""
echo "5. INSTRUCCIONES PARA DEBUGGING"
echo "--------------------------------"
echo "Para ver logs en tiempo real:"
echo "  - Con PM2: pm2 logs backend --lines 100"
echo "  - Con Docker: docker logs -f <container_name>"
echo ""
echo "Para reiniciar el backend:"
echo "  - Con PM2: pm2 restart backend"
echo "  - Con Docker: docker-compose restart backend"
echo ""
echo "Para verificar el .env:"
echo "  - cat .env | grep -E 'CORS|JWT|NODE_ENV'"
