# 🚀 Configuración para VPS y Acceso Externo

## 📋 Configuraciones según tu escenario

### **Escenario 1: VPS con IP Pública (sin dominio)**

Si tu VPS tiene IP pública `123.45.67.89`:

**Archivo `.env` en el VPS:**
```bash
# PostgreSQL
POSTGRES_DB=kawait_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro_aqui

# Database URL
DATABASE_URL=postgres://postgres:tu_password_seguro_aqui@db:5432/kawait_prod

# Node Environment
NODE_ENV=production

# CORS - Permitir acceso desde tu IP pública
CORS_ORIGINS=http://123.45.67.89,http://123.45.67.89:3000,http://localhost

# Frontend API URL
VITE_API_URL=http://123.45.67.89:3001
```

**Acceso:**
- Frontend: `http://123.45.67.89:3000`
- Backend API: `http://123.45.67.89:3001`

---

### **Escenario 2: VPS con Dominio (Recomendado)**

Si tenés un dominio `tuempresa.com`:

**Archivo `.env` en el VPS:**
```bash
# PostgreSQL
POSTGRES_DB=kawait_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro_aqui

# Database URL
DATABASE_URL=postgres://postgres:tu_password_seguro_aqui@db:5432/kawait_prod

# Node Environment
NODE_ENV=production

# CORS - Permitir acceso desde tu dominio
CORS_ORIGINS=https://tuempresa.com,http://tuempresa.com,https://www.tuempresa.com,http://www.tuempresa.com

# Frontend API URL
VITE_API_URL=https://api.tuempresa.com
```

**Configuración DNS:**
- `tuempresa.com` → IP del VPS (puerto 3000)
- `api.tuempresa.com` → IP del VPS (puerto 3001)

**Acceso:**
- Frontend: `https://tuempresa.com`
- Backend API: `https://api.tuempresa.com`

---

### **Escenario 3: Desarrollo Local + VPS**

Si trabajás localmente pero también querés acceder al VPS:

**Archivo `.env` en el VPS:**
```bash
# PostgreSQL
POSTGRES_DB=kawait_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_seguro_aqui

# Database URL
DATABASE_URL=postgres://postgres:tu_password_seguro_aqui@db:5432/kawait_prod

# Node Environment
NODE_ENV=production

# CORS - Permitir tanto local como remoto
CORS_ORIGINS=http://localhost,http://localhost:3000,http://localhost:5173,http://123.45.67.89,http://123.45.67.89:3000

# Frontend API URL
VITE_API_URL=/api
```

---

## 🔧 Pasos para Configurar en el VPS

### 1. Conectarse al VPS
```bash
ssh usuario@tu.ip.publica
```

### 2. Clonar/Subir el proyecto
```bash
git clone tu-repositorio.git kawait_turismo
cd kawait_turismo
```

### 3. Crear archivo `.env`
```bash
nano .env
# Copiar la configuración según tu escenario
# Guardar: Ctrl+O, Enter, Ctrl+X
```

### 4. Levantar Docker
```bash
# Detener contenedores anteriores si existen
docker compose down

# Construir y levantar
docker compose up -d --build

# Ver logs
docker compose logs -f
```

### 5. Verificar que funciona
```bash
# Ver logs del backend
docker compose logs backend

# Deberías ver:
# ✅ Servidor corriendo en http://localhost:3001
# ✅ Conexión a la base de datos establecida correctamente.
```

---

## 🌐 Configurar Firewall (Importante)

Abrí los puertos necesarios en tu VPS:

```bash
# Puerto 3000 - Frontend
sudo ufw allow 3000/tcp

# Puerto 3001 - Backend API
sudo ufw allow 3001/tcp

# Puerto 22 - SSH (si no está abierto)
sudo ufw allow 22/tcp

# Activar firewall
sudo ufw enable

# Ver estado
sudo ufw status
```

---

## 🔒 Configurar HTTPS con Nginx (Opcional pero Recomendado)

Si tenés un dominio, podés usar Let's Encrypt para SSL gratis:

### 1. Instalar Nginx y Certbot
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 2. Configurar Nginx
```bash
sudo nano /etc/nginx/sites-available/kawait
```

Contenido:
```nginx
# Frontend
server {
    listen 80;
    server_name tuempresa.com www.tuempresa.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.tuempresa.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Activar configuración
```bash
sudo ln -s /etc/nginx/sites-available/kawait /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Obtener certificado SSL
```bash
sudo certbot --nginx -d tuempresa.com -d www.tuempresa.com -d api.tuempresa.com
```

---

## 🐛 Troubleshooting

### Error: "No permitido por CORS"
**Solución:** Verificá que el origen desde donde accedés esté en `CORS_ORIGINS`

```bash
# Ver logs del backend
docker compose logs backend | grep CORS

# Deberías ver algo como:
# CORS bloqueado para origen: http://tu-origen
# Orígenes permitidos: [lista]

# Agregá el origen bloqueado a CORS_ORIGINS en .env
```

### Error: "Connection refused"
**Solución:** Verificá que los puertos estén abiertos en el firewall

```bash
# Ver puertos en uso
sudo netstat -tulpn | grep LISTEN

# Verificar firewall
sudo ufw status
```

### Error: "Cannot connect to database"
**Solución:** Verificá las credenciales en `.env`

```bash
# Ver logs de la base de datos
docker compose logs db

# Verificar que DATABASE_URL tenga las credenciales correctas
```

---

## 📝 Checklist de Configuración

- [ ] Archivo `.env` creado con las variables correctas
- [ ] `CORS_ORIGINS` incluye todos los orígenes desde donde vas a acceder
- [ ] `DATABASE_URL` tiene las credenciales correctas
- [ ] Puertos 3000 y 3001 abiertos en el firewall
- [ ] Docker compose levantado sin errores
- [ ] Logs del backend muestran conexión exitosa
- [ ] Podés acceder al frontend desde el navegador
- [ ] Podés hacer login y las peticiones funcionan

---

## 🆘 Soporte

Si seguís teniendo problemas:

1. **Ver logs completos:**
   ```bash
   docker compose logs -f
   ```

2. **Reiniciar servicios:**
   ```bash
   docker compose restart
   ```

3. **Reconstruir desde cero:**
   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

4. **Verificar conectividad:**
   ```bash
   # Desde tu máquina local
   curl http://tu.ip.publica:3001
   
   # Deberías ver:
   # {"message":"Bienvenido a la API de Kawait Turismo"}
   ```
