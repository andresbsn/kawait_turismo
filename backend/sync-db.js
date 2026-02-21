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
      const ReservaAdjunto = sequelize.models.ReservaAdjunto;
      const Reserva = sequelize.models.Reserva;
      if (!Pago || !ReservaAdjunto || !Reserva) {
        throw new Error('Modelos no cargados correctamente.');
      }
      await Pago.sync({ alter: true });

      // Agregar nuevo valor al ENUM de tipo si no existe (PostgreSQL)
      try {
        await sequelize.query(`ALTER TYPE "enum_reserva_adjuntos_tipo" ADD VALUE IF NOT EXISTS 'liquidacion_reserva';`);
        console.log('✅ Enum liquidacion_reserva agregado o ya existía.');
      } catch (e) {
        console.warn('⚠️ No se pudo alterar el ENUM (puede que ya exista):', e.message);
      }

      await ReservaAdjunto.sync({ alter: true });

      // Agregar nuevos campos a Reserva
      await Reserva.sync({ alter: true });

      // Sincronizar tabla de Gastos
      const Gasto = sequelize.models.Gasto;
      if (Gasto) {
        await Gasto.sync({ alter: true });
      }
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
