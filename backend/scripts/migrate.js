const { exec } = require('child_process');
const path = require('path');

// Configuración
const config = {
  database: 'postgres',
  username: 'postgres',
  password: 'postgres_35702',
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres',
  migrationStorageTableName: 'sequelize_meta',
  migrationStorageTableSchema: 'public',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
  seederStorageTableSchema: 'public',
  define: {
    schema: 'public',
    freezeTableName: true,
    underscored: true,
    timestamps: true,
    paranoid: true
  }
};

// Función para ejecutar comandos
function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Ejecutando: ${command}`);
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return reject(stderr);
      }
      console.log(stdout);
      resolve(stdout);
    });

    // Mostrar la salida en tiempo real
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  });
}

// Función principal
async function main() {
  try {
    // Configurar variables de entorno
    process.env.DATABASE_URL = `${config.dialect}://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
    
    // Ejecutar migraciones
    console.log('\n=== Ejecutando migraciones ===');
    await runCommand(`npx sequelize-cli db:migrate --url "${process.env.DATABASE_URL}"`);
    
    console.log('\n=== Migraciones completadas exitosamente ===');
  } catch (error) {
    console.error('\n=== Error durante la migración ===');
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar el script
main();
