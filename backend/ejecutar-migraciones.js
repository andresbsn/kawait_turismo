// ejecutar-migraciones.js
// Script para ejecutar las migraciones SQL directamente sin Sequelize CLI
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.PROD_DB_NAME || process.env.POSTGRES_DB || 'kawait_prod',
  process.env.PROD_DB_USER || process.env.POSTGRES_USER || 'admin',
  process.env.PROD_DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres_35702',
  {
    host: process.env.PROD_DB_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.PROD_DB_PORT || 5432,
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
