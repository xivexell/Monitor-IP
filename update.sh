#!/bin/bash

# Colores para mensajes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Iniciando actualización de MonitorIP...${NC}"

# Detener el servidor actual
echo "Deteniendo servidor actual..."
pm2 stop ip-monitor-server || true

# Backup de la base de datos
echo "Creando backup de la base de datos..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -u ip_monitor_user -p'L3n0v0-2019' ip_monitor > "$BACKUP_FILE"

# Actualizar archivos del servidor
echo "Actualizando archivos del servidor..."
mkdir -p /opt/ip-monitor/server
cp -r server/* /opt/ip-monitor/server/
cp package.json /opt/ip-monitor/

# Actualizar dependencias
echo "Actualizando dependencias..."
cd /opt/ip-monitor
npm install

# Construir el frontend
echo "Construyendo frontend..."
npm run build
rm -rf /var/www/html/ip-monitor/*
cp -r dist/* /var/www/html/ip-monitor/

# Reiniciar el servidor
echo "Reiniciando servidor..."
cd /opt/ip-monitor/server
pm2 start server.ts --name ip-monitor-server

echo -e "${GREEN}¡Actualización completada!${NC}"