require('dotenv').config();
const { sequelize } = require('./models');

const syncDatabase = async () => {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    // Sincronizar modelos con la base de datos
    console.log('🔄 Sincronizando modelos con la base de datos...');
    const force = String(process.env.FORCE || '').toLowerCase() === 'true';
    const alter = !force;

    if (force) {
      // ¡CUIDADO! Esto elimina datos existentes
      await sequelize.sync({ force: true });
    } else {
      // Por defecto NO hacemos alter global porque puede fallar al intentar convertir columnas
      // existentes (ej: enums). En su lugar, sincronizamos solo las tablas nuevas/faltantes.
      const Pago = sequelize.models.Pago;
      if (!Pago) {
        throw new Error('Modelo Pago no está cargado. No se puede crear la tabla pagos.');
      }
      await Pago.sync({ alter: true });
    }
    
    console.log('✅ Base de datos sincronizada correctamente.');
    console.log(`Modo sync: ${force ? 'force (BORRA datos)' : 'Pago.sync(alter) (no altera enums existentes)'}`);
    console.log('📊 Tablas creadas en el esquema: public');
    
    // Listar las tablas creadas
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📋 Tablas creadas:');
    results.forEach(({ table_name }) => {
      console.log(`- ${table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error al sincronizar la base de datos:');
    console.error(error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
    process.exit(0);
  }
};

// Ejecutar la sincronización
syncDatabase();
