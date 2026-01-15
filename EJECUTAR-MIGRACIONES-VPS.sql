-- ================================================================
-- SCRIPT SQL PARA ACTUALIZAR LA TABLA RESERVAS EN PRODUCCIÓN
-- ================================================================
-- Este script agrega todas las columnas faltantes en la tabla reservas
-- Ejecutar en la base de datos kawait_prod en el VPS
-- ================================================================

-- 1. Agregar campos de tour personalizado (migración 20250106000000)
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS tour_nombre VARCHAR(255);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS tour_destino VARCHAR(255);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS tour_descripcion TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS fecha_inicio DATE;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS fecha_fin DATE;

-- 2. Hacer tour_id opcional (permitir NULL)
ALTER TABLE reservas ALTER COLUMN tour_id DROP NOT NULL;

-- 3. Agregar campos adicionales (migración 20251118000000)
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS referencia VARCHAR(255);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- 4. Agregar campo de moneda (migración 20260110124400)
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS moneda_precio_unitario VARCHAR(3) NOT NULL DEFAULT 'ARS';

-- 5. Crear tabla reserva_clientes si no existe
CREATE TABLE IF NOT EXISTS reserva_clientes (
  id SERIAL PRIMARY KEY,
  reserva_id INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE ON UPDATE CASCADE,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_reserva_cliente UNIQUE (reserva_id, cliente_id)
);

-- 6. Verificar que todo se creó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'reservas'
ORDER BY ordinal_position;

-- ================================================================
-- FIN DEL SCRIPT
-- ================================================================
