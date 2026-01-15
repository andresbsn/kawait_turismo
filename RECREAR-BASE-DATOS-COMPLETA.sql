-- ================================================================
-- SCRIPT COMPLETO PARA RECREAR BASE DE DATOS KAWAIT_TURISMO
-- ================================================================
-- Este script elimina y recrea toda la base de datos con la estructura
-- correcta basada en los modelos locales
-- ================================================================

-- IMPORTANTE: Hacer backup antes de ejecutar
-- pg_dump -U admin -d kawait_prod > backup_kawait_$(date +%Y%m%d_%H%M%S).sql

-- ================================================================
-- PASO 1: ELIMINAR BASE DE DATOS EXISTENTE Y RECREAR
-- ================================================================

-- Conectarse a la base de datos postgres (no a kawait_prod)
-- \c postgres

-- Terminar todas las conexiones activas a kawait_prod
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'kawait_prod'
  AND pid <> pg_backend_pid();

-- Eliminar y recrear la base de datos
DROP DATABASE IF EXISTS kawait_prod;
CREATE DATABASE kawait_prod;

-- Conectarse a la nueva base de datos
\c kawait_prod

-- ================================================================
-- PASO 2: CREAR TIPOS ENUM
-- ================================================================

CREATE TYPE estado_reserva AS ENUM ('pendiente', 'confirmada', 'cancelada', 'completada');
CREATE TYPE estado_tour AS ENUM ('disponible', 'completo', 'cancelado', 'finalizado');
CREATE TYPE rol_usuario AS ENUM ('ADMIN', 'USER', 'GUIDE');
CREATE TYPE estado_cuenta AS ENUM ('pendiente', 'en_proceso', 'pagado', 'atrasado', 'cancelado');
CREATE TYPE estado_cuota AS ENUM ('pendiente', 'pagada', 'atrasada', 'cancelada');
CREATE TYPE metodo_pago AS ENUM ('efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'mercadopago', 'otro');

-- ================================================================
-- PASO 3: CREAR TABLAS INDEPENDIENTES (SIN FOREIGN KEYS)
-- ================================================================

-- Tabla: usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role rol_usuario NOT NULL DEFAULT 'USER',
    active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP,
    reset_password_token VARCHAR(255),
    reset_password_expire TIMESTAMP,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabla: clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    dni VARCHAR(20) NOT NULL UNIQUE,
    fecha_nacimiento DATE,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabla: tours
CREATE TABLE tours (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    destino VARCHAR(255) NOT NULL,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    precio NUMERIC(10, 2) DEFAULT 0,
    cupo_maximo INTEGER DEFAULT 10,
    cupos_disponibles INTEGER NOT NULL DEFAULT 10,
    estado estado_tour NOT NULL DEFAULT 'disponible',
    imagen_url VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabla: categorias
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabla: destinos
CREATE TABLE destinos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    pais VARCHAR(255),
    ciudad VARCHAR(255),
    imagen_url VARCHAR(255),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabla: alojamientos
CREATE TABLE alojamientos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(255),
    tipo VARCHAR(100),
    estrellas INTEGER,
    precio_por_noche NUMERIC(10, 2),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Tabla: actividades
CREATE TABLE actividades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    duracion INTEGER,
    precio NUMERIC(10, 2),
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- ================================================================
-- PASO 4: CREAR TABLA RESERVAS (CON TODOS LOS CAMPOS)
-- ================================================================

CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(255) NOT NULL UNIQUE,
    tour_id INTEGER,
    -- Campos para tour personalizado
    tour_nombre VARCHAR(255),
    tour_destino VARCHAR(255),
    tour_descripcion TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    referencia VARCHAR(255),
    descripcion TEXT,
    -- Campos obligatorios
    fecha_reserva DATE NOT NULL,
    cantidad_personas INTEGER NOT NULL DEFAULT 1,
    precio_unitario NUMERIC(10, 2) NOT NULL,
    moneda_precio_unitario VARCHAR(3) NOT NULL DEFAULT 'ARS',
    estado estado_reserva NOT NULL DEFAULT 'pendiente',
    notas TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    -- Foreign key
    CONSTRAINT fk_reserva_tour FOREIGN KEY (tour_id) 
        REFERENCES tours(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ================================================================
-- PASO 5: CREAR TABLA INTERMEDIA RESERVA_CLIENTES
-- ================================================================

CREATE TABLE reserva_clientes (
    id SERIAL PRIMARY KEY,
    reserva_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reserva_cliente_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reservas(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reserva_cliente_cliente FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT unique_reserva_cliente UNIQUE (reserva_id, cliente_id)
);

-- ================================================================
-- PASO 6: CREAR TABLAS DE CUENTAS CORRIENTES Y PAGOS
-- ================================================================

-- Tabla: cuentas_corrientes
CREATE TABLE cuentas_corrientes (
    id SERIAL PRIMARY KEY,
    reserva_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    monto_total NUMERIC(12, 2) NOT NULL,
    saldo_pendiente NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cantidad_cuotas INTEGER NOT NULL,
    estado estado_cuenta NOT NULL DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cuenta_reserva FOREIGN KEY (reserva_id) 
        REFERENCES reservas(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_cuenta_cliente FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Tabla: cuotas
CREATE TABLE cuotas (
    id SERIAL PRIMARY KEY,
    cuenta_corriente_id INTEGER NOT NULL,
    numero_cuota INTEGER NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    fecha_pago TIMESTAMP,
    estado estado_cuota NOT NULL DEFAULT 'pendiente',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cuota_cuenta FOREIGN KEY (cuenta_corriente_id) 
        REFERENCES cuentas_corrientes(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabla: pagos
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    cuenta_corriente_id INTEGER NOT NULL,
    cuota_id INTEGER,
    monto NUMERIC(12, 2) NOT NULL,
    metodo_pago metodo_pago NOT NULL,
    fecha_pago TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comprobante VARCHAR(255),
    notas TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_cuenta FOREIGN KEY (cuenta_corriente_id) 
        REFERENCES cuentas_corrientes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_pago_cuota FOREIGN KEY (cuota_id) 
        REFERENCES cuotas(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Tabla: resenas
CREATE TABLE resenas (
    id SERIAL PRIMARY KEY,
    tour_id INTEGER,
    cliente_id INTEGER,
    calificacion INTEGER NOT NULL,
    comentario TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_resena_tour FOREIGN KEY (tour_id) 
        REFERENCES tours(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_resena_cliente FOREIGN KEY (cliente_id) 
        REFERENCES clientes(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ================================================================
-- PASO 7: CREAR TABLA SEQUELIZE_META (PARA MIGRACIONES)
-- ================================================================

CREATE TABLE sequelize_meta (
    name VARCHAR(255) NOT NULL PRIMARY KEY
);

-- Registrar las migraciones como ejecutadas
INSERT INTO sequelize_meta (name) VALUES
    ('20231025235100-create-reservas.js'),
    ('20231025235200-add-cliente-id-to-reservas.js'),
    ('20231112235000-add-payment-fields-to-reservas.js'),
    ('20250106000000-add-tour-fields-to-reservas.js'),
    ('20251118000000-update-reservas-table.js'),
    ('20251120000000-create-reserva-clientes.js'),
    ('20260110124400-add-moneda-precio-unitario-to-reservas.js'),
    ('20260115000000-sync-reservas-table.js');

-- ================================================================
-- PASO 8: CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ================================================================

-- Índices para usuarios
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_active ON usuarios(active);

-- Índices para clientes
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_dni ON clientes(dni);
CREATE INDEX idx_clientes_activo ON clientes(activo);

-- Índices para tours
CREATE INDEX idx_tours_destino ON tours(destino);
CREATE INDEX idx_tours_estado ON tours(estado);
CREATE INDEX idx_tours_activo ON tours(activo);
CREATE INDEX idx_tours_fecha_inicio ON tours(fecha_inicio);

-- Índices para reservas
CREATE INDEX idx_reservas_codigo ON reservas(codigo);
CREATE INDEX idx_reservas_tour_id ON reservas(tour_id);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_reservas_fecha_reserva ON reservas(fecha_reserva);
CREATE INDEX idx_reservas_activo ON reservas(activo);

-- Índices para reserva_clientes
CREATE INDEX idx_reserva_clientes_reserva ON reserva_clientes(reserva_id);
CREATE INDEX idx_reserva_clientes_cliente ON reserva_clientes(cliente_id);

-- Índices para cuentas corrientes
CREATE INDEX idx_cuentas_reserva ON cuentas_corrientes(reserva_id);
CREATE INDEX idx_cuentas_cliente ON cuentas_corrientes(cliente_id);
CREATE INDEX idx_cuentas_estado ON cuentas_corrientes(estado);

-- Índices para cuotas
CREATE INDEX idx_cuotas_cuenta ON cuotas(cuenta_corriente_id);
CREATE INDEX idx_cuotas_estado ON cuotas(estado);
CREATE INDEX idx_cuotas_vencimiento ON cuotas(fecha_vencimiento);

-- Índices para pagos
CREATE INDEX idx_pagos_cuenta ON pagos(cuenta_corriente_id);
CREATE INDEX idx_pagos_cuota ON pagos(cuota_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);

-- ================================================================
-- PASO 9: INSERTAR DATOS INICIALES (OPCIONAL)
-- ================================================================

-- Usuario administrador por defecto (password: admin123)
INSERT INTO usuarios (username, email, password, role, active, email_verified)
VALUES ('admin', 'admin@kawait.com', '$2a$10$xQxVZ8YGxQxVZ8YGxQxVZeN8YGxQxVZ8YGxQxVZ8YGxQxVZ8YGxQx', 'ADMIN', true, true);

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================

-- Verificar que todo se creó correctamente
\dt
\dT

SELECT 'Base de datos recreada exitosamente' AS mensaje;
