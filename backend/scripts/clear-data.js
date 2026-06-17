'use strict';

const db = require('../models');

async function clearData() {
  console.log('🧹 Iniciando limpieza de base de datos...');
  
  const transaction = await db.sequelize.transaction();
  
  try {
    // Desactivar temporalmente los triggers/constraints si fuera necesario (opcional, mejor orden correcto)
    // 1. Eliminar pagos
    console.log('- Limpiando tabla: pagos');
    await db.sequelize.query('TRUNCATE TABLE pagos RESTART IDENTITY CASCADE;', { transaction });
    
    // 2. Eliminar cuotas
    console.log('- Limpiando tabla: cuotas');
    await db.sequelize.query('TRUNCATE TABLE cuotas RESTART IDENTITY CASCADE;', { transaction });
    
    // 3. Eliminar cuentas corrientes
    console.log('- Limpiando tabla: cuentas_corrientes');
    await db.sequelize.query('TRUNCATE TABLE cuentas_corrientes RESTART IDENTITY CASCADE;', { transaction });
    
    // 4. Eliminar reserva_clientes (tabla intermedia muchos a muchos)
    console.log('- Limpiando tabla: reserva_clientes');
    await db.sequelize.query('TRUNCATE TABLE reserva_clientes RESTART IDENTITY CASCADE;', { transaction });
    
    // 5. Eliminar reserva_referencias
    console.log('- Limpiando tabla: reserva_referencias');
    await db.sequelize.query('TRUNCATE TABLE reserva_referencias RESTART IDENTITY CASCADE;', { transaction });
    
    // 6. Eliminar reserva_adjuntos
    console.log('- Limpiando tabla: reserva_adjuntos');
    await db.sequelize.query('TRUNCATE TABLE reserva_adjuntos RESTART IDENTITY CASCADE;', { transaction });
    
    // 7. Eliminar reservas
    console.log('- Limpiando tabla: reservas');
    await db.sequelize.query('TRUNCATE TABLE reservas RESTART IDENTITY CASCADE;', { transaction });
    
    await transaction.commit();
    console.log('✅ Base de datos limpiada correctamente. Se han borrado todos los pagos, cuotas, cuentas corrientes y reservas.');
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error al limpiar la base de datos:', error);
    process.exit(1);
  }
}

clearData();
