// ejecutar-migraciones.js
// Script para ejecutar las migraciones SQL directamente sin Sequelize CLI
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || process.env.POSTGRES_DB || process.env.PROD_DB_NAME || 'kawait_prod',
  process.env.DB_USER || process.env.POSTGRES_USER || process.env.PROD_DB_USER || 'admin',
  process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || process.env.PROD_DB_PASSWORD || 'postgres_35702',
  {
    host: process.env.DB_HOST || process.env.PROD_DB_HOST || 'localhost',
    port: process.env.DB_PORT || process.env.PROD_DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function ejecutarMigraciones() {
  try {
    console.log('🔄 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión establecida correctamente\n');

    console.log('🔄 Ejecutando migraciones...\n');

    // Migración 1: Agregar campos de tour personalizado
    console.log('1. Agregando campos de tour personalizado...');
    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS tour_nombre VARCHAR(255);
    `);
    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS tour_destino VARCHAR(255);
    `);
    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS tour_descripcion TEXT;
    `);
    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS fecha_inicio DATE;
    `);
    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS fecha_fin DATE;
    `);
    console.log('   ✅ Campos de tour personalizado agregados\n');

    // Migración 2: Hacer tour_id opcional
    console.log('2. Haciendo tour_id opcional...');
    await sequelize.query(`
      ALTER TABLE reservas ALTER COLUMN tour_id DROP NOT NULL;
    `);
    console.log('   ✅ tour_id ahora es opcional\n');

    // Migración 3: Agregar campos adicionales
    console.log('3. Agregando campos adicionales...');
    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS referencia VARCHAR(255);
    `);
    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS descripcion TEXT;
    `);
    console.log('   ✅ Campos adicionales agregados\n');

    // Migración 4: Agregar campo de moneda
    console.log('4. Agregando campo de moneda...');
    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS moneda_precio_unitario VARCHAR(3) NOT NULL DEFAULT 'ARS';
    `);
    console.log('   ✅ Campo de moneda agregado\n');

    // Migración 4.5: Agregar campos de pago a reservas
    console.log('4.5. Agregando campos de pago a reservas...');
    try {
      await sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_reservas_metodo_pago') THEN
            CREATE TYPE enum_reservas_metodo_pago AS ENUM ('efectivo', 'transferencia', 'tarjeta_credito', 'otro');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_reservas_estado_pago') THEN
            CREATE TYPE enum_reservas_estado_pago AS ENUM ('pendiente', 'parcial', 'completo');
          END IF;
        END
        $$;
      `);
    } catch (e) {
      console.log('   ⚠️ Enums de pago ya existían o no pudieron crearse');
    }

    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS metodo_pago enum_reservas_metodo_pago;
    `);
    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS monto_abonado DECIMAL(10, 2) DEFAULT 0;
    `);
    await sequelize.query(`
      ALTER TABLE reservas ADD COLUMN IF NOT EXISTS estado_pago enum_reservas_estado_pago DEFAULT 'pendiente';
    `);
    console.log('   ✅ Campos de pago agregados a reservas\n');

    // Migración 5: Crear tabla reserva_clientes
    console.log('5. Creando tabla reserva_clientes...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS reserva_clientes (
        id SERIAL PRIMARY KEY,
        reserva_id INTEGER NOT NULL REFERENCES reservas(id) ON DELETE CASCADE ON UPDATE CASCADE,
        cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE ON UPDATE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_reserva_cliente UNIQUE (reserva_id, cliente_id)
      );
    `);
    console.log('   ✅ Tabla reserva_clientes creada\n');

    // Migración 5.5: Agregar campos titular y proveedor a reserva_referencias
    console.log('5.5. Agregando campos titular y proveedor a reserva_referencias...');
    await sequelize.query(`
      ALTER TABLE reserva_referencias ADD COLUMN IF NOT EXISTS titular VARCHAR(255);
    `);
    await sequelize.query(`
      ALTER TABLE reserva_referencias ADD COLUMN IF NOT EXISTS proveedor VARCHAR(255);
    `);
    console.log('   ✅ Campos titular y proveedor agregados a reserva_referencias\n');

    // Migración 5.6: Actualizar tabla pagos para soportar reservas sin cuotas y pagos directos
    console.log('5.6. Actualizando tabla pagos para soportar reservas sin cuotas...');
    await sequelize.query(`
      ALTER TABLE pagos ALTER COLUMN cuenta_corriente_id DROP NOT NULL;
    `);
    await sequelize.query(`
      ALTER TABLE pagos ALTER COLUMN cliente_id DROP NOT NULL;
    `);
    await sequelize.query(`
      ALTER TABLE pagos ADD COLUMN IF NOT EXISTS reserva_id INTEGER REFERENCES reservas(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    await sequelize.query(`
      ALTER TABLE pagos ADD COLUMN IF NOT EXISTS nombre_pagador VARCHAR(255);
    `);
    await sequelize.query(`
      ALTER TABLE pagos ADD COLUMN IF NOT EXISTS email_pagador VARCHAR(255);
    `);
    console.log('   ✅ Tabla pagos actualizada exitosamente\n');

    // Verificar columnas
    console.log('6. Verificando columnas de la tabla reservas...');
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'reservas' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Columnas de la tabla reservas:');
    results.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n✅ ¡Todas las migraciones se ejecutaron correctamente!');
    console.log('🔄 Ahora reinicia el backend con: pm2 restart backend\n');

  } catch (error) {
    console.error('❌ Error al ejecutar las migraciones:', error.message);
    console.error('\nDetalles del error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

ejecutarMigraciones();
