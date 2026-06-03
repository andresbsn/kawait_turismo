const path = require('path');
const { Sequelize } = require('sequelize');

const migrationName = process.argv[2];
const databaseUrl = process.argv[3];

if (!migrationName || !databaseUrl) {
  console.error('Uso: node scripts/run-single-migration.js <archivo-migracion.js> <database-url>');
  process.exit(1);
}

const migrationPath = path.resolve(__dirname, '..', 'migrations', migrationName);

(async () => {
  const sequelize = new Sequelize(databaseUrl, { logging: console.log });

  try {
    const migration = require(migrationPath);

    if (!migration || typeof migration.up !== 'function') {
      throw new Error(`La migración ${migrationName} no exporta una función up válida`);
    }

    await sequelize.authenticate();
    console.log(`Ejecutando migración: ${migrationName}`);

    await migration.up(sequelize.getQueryInterface(), Sequelize);

    await sequelize.query('CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) NOT NULL UNIQUE PRIMARY KEY);');
    await sequelize.query('INSERT INTO "SequelizeMeta" (name) VALUES (:name) ON CONFLICT (name) DO NOTHING;', {
      replacements: { name: migrationName },
    });

    console.log(`Migración aplicada correctamente: ${migrationName}`);
  } catch (error) {
    console.error('Error ejecutando migración:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
