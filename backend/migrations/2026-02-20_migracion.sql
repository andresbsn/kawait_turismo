-- ============================================================================
-- MIGRACIÓN: 2026-02-20
-- Cambios:
--   1. Nueva tabla "gastos" (módulo completo de gastos)
--   2. Columna "comprobante_transferencia" en tabla "pagos"
--   3. Columna "cuota_id" en "pagos" pasa a ser nullable (para entregas libres)
-- ============================================================================

BEGIN;

-- ========================================
-- 1. TABLA GASTOS — Crear ENUMs y tabla
-- ========================================

-- ENUM: categoría del gasto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_gastos_categoria') THEN
        CREATE TYPE "enum_gastos_categoria" AS ENUM (
            'alojamiento', 'transporte', 'excursion', 'seguro',
            'comision', 'impuesto', 'proveedor', 'operativo', 'otro'
        );
    END IF;
END$$;

-- ENUM: estado del gasto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_gastos_estado') THEN
        CREATE TYPE "enum_gastos_estado" AS ENUM (
            'pendiente', 'pagado', 'vencido', 'cancelado'
        );
    END IF;
END$$;

-- ENUM: método de pago del gasto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_gastos_metodo_pago') THEN
        CREATE TYPE "enum_gastos_metodo_pago" AS ENUM (
            'efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'cheque', 'otro'
        );
    END IF;
END$$;

-- Crear tabla gastos
CREATE TABLE IF NOT EXISTS "gastos" (
    "id"                  SERIAL PRIMARY KEY,
    "descripcion"         TEXT NOT NULL,
    "categoria"           "enum_gastos_categoria" NOT NULL DEFAULT 'otro',
    "importe"             DECIMAL(12, 2) NOT NULL,
    "moneda"              VARCHAR(3) NOT NULL DEFAULT 'ARS',
    "fecha_vencimiento"   DATE NOT NULL,
    "fecha_pago"          DATE,
    "estado"              "enum_gastos_estado" NOT NULL DEFAULT 'pendiente',
    "metodo_pago"         "enum_gastos_metodo_pago",
    "proveedor"           VARCHAR(255),
    "numero_factura"      VARCHAR(255),
    "reserva_id"          INTEGER REFERENCES "reservas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "observaciones"       TEXT,
    "created_at"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deleted_at"          TIMESTAMP WITH TIME ZONE
);

-- Comentarios en columnas
COMMENT ON COLUMN "gastos"."descripcion"       IS 'Descripción del gasto';
COMMENT ON COLUMN "gastos"."categoria"         IS 'Categoría del gasto';
COMMENT ON COLUMN "gastos"."fecha_vencimiento" IS 'Fecha de vencimiento del gasto';
COMMENT ON COLUMN "gastos"."fecha_pago"        IS 'Fecha en que se realizó el pago (null si no se pagó)';
COMMENT ON COLUMN "gastos"."metodo_pago"       IS 'Método de pago utilizado';
COMMENT ON COLUMN "gastos"."proveedor"         IS 'Nombre del proveedor';
COMMENT ON COLUMN "gastos"."numero_factura"    IS 'Número de factura o comprobante';
COMMENT ON COLUMN "gastos"."reserva_id"        IS 'Reserva asociada (opcional)';


-- ========================================
-- 2. TABLA PAGOS — Nueva columna comprobante_transferencia
-- ========================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pagos' AND column_name = 'comprobante_transferencia'
    ) THEN
        ALTER TABLE "pagos"
        ADD COLUMN "comprobante_transferencia" VARCHAR(255);

        COMMENT ON COLUMN "pagos"."comprobante_transferencia"
        IS 'Ruta del archivo del comprobante de transferencia adjuntado por el cliente';
    END IF;
END$$;


-- ========================================
-- 3. TABLA PAGOS — cuota_id debe ser nullable (para entregas sin cuota)
-- ========================================

ALTER TABLE "pagos" ALTER COLUMN "cuota_id" DROP NOT NULL;


COMMIT;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
