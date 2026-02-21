'use strict';

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];

const db = {};

// Configurar la conexión a la base de datos
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: config.dialect,
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true
      }
    }
  );
}

// Cargar modelos en el orden correcto (primero los modelos independientes)
// 1. Primero cargar modelos que no tienen dependencias
const modelFiles = [
  'categoria.model',
  'user.model',
  'cliente.model',
  'destino.model',
  'alojamiento.model',
  'actividad.model',
  'Reserva',  // Cambiado de 'reserva.model' a 'Reserva'
  'resena.model',
  'Tour',  // Añadir el modelo Tour
  'CuentaCorriente',
  'Cuota',
  'Pago',
  'ReservaAdjunto', // Modelo para adjuntos de reserva
  'reservaCliente.model',  // Modelo para la relación muchos a muchos entre reservas y clientes
  'Gasto'  // Modelo para gastos
];

// Cargar cada modelo
modelFiles.forEach(file => {
  const model = require(`./${file}`)(sequelize, DataTypes);
  const modelName = model.name;
  db[modelName] = model;
});

// Verificar que todos los modelos se cargaron correctamente
const modelNames = Object.keys(db);
console.log('Modelos cargados:', modelNames.join(', '));

// Configurar relaciones después de cargar todos los modelos
modelNames.forEach(modelName => {
  const model = db[modelName];
  if (model && typeof model.associate === 'function') {
    try {
      console.log(`Configurando relaciones para: ${modelName}`);
      model.associate(db);
    } catch (err) {
      console.error(`Error al configurar relaciones para el modelo ${modelName}:`, err.message);
      // Detener la ejecución si hay un error crítico
      if (process.env.NODE_ENV === 'development') {
        process.exit(1);
      }
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Función auxiliar para esperar
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para sincronizar modelos con la base de datos con reintentos
db.syncDatabase = async (options = {}) => {
  const maxRetries = 5;
  const retryDelay = 3000; // 3 segundos

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intento ${attempt}/${maxRetries} de conexión a la base de datos...`);

      // Por defecto, solo verificar la conexión
      if (options.force) {
        await sequelize.sync({ force: true });
        console.log('Base de datos recreada completamente (force: true)');
      } else if (options.alter) {
        await sequelize.sync({ alter: true });
        console.log('Esquema de base de datos actualizado (alter: true)');
      } else {
        // Solo verificar la conexión
        await sequelize.authenticate();
        console.log('Conexión a la base de datos establecida correctamente');
      }
      return true;
    } catch (error) {
      console.error(`Error en intento ${attempt}/${maxRetries}:`, error.message);

      if (attempt < maxRetries) {
        console.log(`Reintentando en ${retryDelay / 1000} segundos...`);
        await sleep(retryDelay);
      } else {
        console.error('Error al sincronizar la base de datos después de todos los reintentos:', error);
        return false;
      }
    }
  }
};

module.exports = db;
