-- ============================================================================
-- MIGRACIÓN COMPLETA: 2026-02-20
-- 
-- Cambios de DB desde commit 05351ed9 hasta HEAD:
--   1. Tabla "reservas": 3 columnas nuevas
--   2. Tabla "reserva_adjuntos": tabla nueva completa + ENUM
--   3. Tabla "pagos": cuota_id nullable + drop unique + nueva columna
--   4. Tabla "gastos": tabla nueva completa + 3 ENUMs
--   5. Tabla "cuentas_corrientes": validación min cuotas 1→0 (solo lógica app, no SQL)
-- ============================================================================

BEGIN;

-- ========================================
-- 1. TABLA RESERVAS — Nuevas columnas
-- ========================================

-- fecha_vencimiento_hotel
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reservas' AND column_name = 'fecha_vencimiento_hotel'
    ) THEN
        ALTER TABLE "reservas" ADD COLUMN "fecha_vencimiento_hotel" DATE;
        COMMENT ON COLUMN "reservas"."fecha_vencimiento_hotel" IS 'Fecha de vencimiento del hotel';
    END IF;
END$$;

-- requisitos_ingresos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reservas' AND column_name = 'requisitos_ingresos'
    ) THEN
        ALTER TABLE "reservas" ADD COLUMN "requisitos_ingresos" TEXT;
        COMMENT ON COLUMN "reservas"."requisitos_ingresos" IS 'Requisitos de ingreso al destino';
    END IF;
END$$;

-- condiciones_generales
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reservas' AND column_name = 'condiciones_generales'
    ) THEN
        ALTER TABLE "reservas" ADD COLUMN "condiciones_generales" TEXT;
        COMMENT ON COLUMN "reservas"."condiciones_generales" IS 'Condiciones generales de la reserva';
    END IF;
END$$;


-- ========================================
-- 2. TABLA RESERVA_ADJUNTOS — Nueva tabla completa
-- ========================================

-- ENUM: tipo de adjunto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_reserva_adjuntos_tipo') THEN
        CREATE TYPE "enum_reserva_adjuntos_tipo" AS ENUM (
            'presupuesto', 'voucher', 'ticket_aereo', 'asistencia_viajero',
            'factura', 'liquidacion_reserva', 'otro'
        );
    END IF;
END$$;

-- Si el ENUM ya existe, agregar 'liquidacion_reserva' por si falta
DO $$
BEGIN
    ALTER TYPE "enum_reserva_adjuntos_tipo" ADD VALUE IF NOT EXISTS 'liquidacion_reserva';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;

-- Crear tabla
CREATE TABLE IF NOT EXISTS "reserva_adjuntos" (
    "id"              SERIAL PRIMARY KEY,
    "reserva_id"      INTEGER NOT NULL REFERENCES "reservas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "tipo"            "enum_reserva_adjuntos_tipo" NOT NULL,
    "nombre_archivo"  VARCHAR(255) NOT NULL,
    "ruta_archivo"    VARCHAR(255) NOT NULL,
    "mimetype"        VARCHAR(255),
    "size"            INTEGER,
    "created_at"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updated_at"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "deleted_at"      TIMESTAMP WITH TIME ZONE
);

COMMENT ON COLUMN "reserva_adjuntos"."nombre_archivo" IS 'Nombre original del archivo';
COMMENT ON COLUMN "reserva_adjuntos"."ruta_archivo"   IS 'Ruta relativa donde se guardó el archivo';


-- ========================================
-- 3. TABLA PAGOS — Cambios en cuota_id + nueva columna
-- ========================================

-- 3a. Hacer cuota_id nullable (para entregas libres sin cuota)
ALTER TABLE "pagos" ALTER COLUMN "cuota_id" DROP NOT NULL;

-- 3b. Eliminar constraint UNIQUE en cuota_id (si existe)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'pagos'::regclass
      AND contype = 'u'
      AND array_position(conkey, (
          SELECT attnum FROM pg_attribute
          WHERE attrelid = 'pagos'::regclass AND attname = 'cuota_id'
      )) IS NOT NULL
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE pagos DROP CONSTRAINT "' || constraint_name || '"';
        RAISE NOTICE 'Dropped unique constraint: %', constraint_name;
    END IF;
END$$;

-- 3c. Nueva columna comprobante_transferencia
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pagos' AND column_name = 'comprobante_transferencia'
    ) THEN
        ALTER TABLE "pagos" ADD COLUMN "comprobante_transferencia" VARCHAR(255);
        COMMENT ON COLUMN "pagos"."comprobante_transferencia"
            IS 'Ruta del archivo del comprobante de transferencia adjuntado por el cliente';
    END IF;
END$$;


-- ========================================
-- 4. TABLA GASTOS — Nueva tabla completa
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

COMMENT ON COLUMN "gastos"."descripcion"       IS 'Descripción del gasto';
COMMENT ON COLUMN "gastos"."categoria"         IS 'Categoría del gasto';
COMMENT ON COLUMN "gastos"."fecha_vencimiento" IS 'Fecha de vencimiento del gasto';
COMMENT ON COLUMN "gastos"."fecha_pago"        IS 'Fecha en que se realizó el pago (null si no se pagó)';
COMMENT ON COLUMN "gastos"."metodo_pago"       IS 'Método de pago utilizado';
COMMENT ON COLUMN "gastos"."proveedor"         IS 'Nombre del proveedor';
COMMENT ON COLUMN "gastos"."numero_factura"    IS 'Número de factura o comprobante';
COMMENT ON COLUMN "gastos"."reserva_id"        IS 'Reserva asociada (opcional)';


COMMIT;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- 
-- Para ejecutar:
--   psql -U <usuario> -d <base_de_datos> -f migrations/2026-02-20_migracion.sql
--
-- Resumen de cambios:
--   ✅ reservas: +fecha_vencimiento_hotel, +requisitos_ingresos, +condiciones_generales
--   ✅ reserva_adjuntos: nueva tabla + ENUM (presupuesto, voucher, ticket_aereo, etc.)
--   ✅ pagos: cuota_id nullable + drop unique + +comprobante_transferencia
--   ✅ gastos: nueva tabla + 3 ENUMs (categoria, estado, metodo_pago)
-- ============================================================================
