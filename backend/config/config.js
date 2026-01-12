// config/config.js
require('dotenv').config();

const DEFAULT_SCHEMA = process.env.DB_SCHEMA || 'public';

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres_35702',
    database: process.env.DB_NAME || 'kawait',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
    define: {
      schema: DEFAULT_SCHEMA,
      freezeTableName: true,
      underscored: true,
      timestamps: true,
      paranoid: true
    },
    dialectOptions: {
      prependSearchPath: true,
      ssl: process.env.DB_SSL === 'true' 
        ? { require: true, rejectUnauthorized: false } 
        : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Configuración de migraciones
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeders'
  },

  test: {
    username: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'postgres_35702',
    database: process.env.TEST_DB_NAME || 'kawait_test',
    host: process.env.TEST_DB_HOST || '127.0.0.1',
    port: Number(process.env.TEST_DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      schema: DEFAULT_SCHEMA,
      freezeTableName: true,
      underscored: true,
      timestamps: true
    },
    dialectOptions: {
      prependSearchPath: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  production: {
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    port: Number(process.env.PROD_DB_PORT) || 5432,
    dialect: 'postgres',
    logging: false,
    define: {
      schema: DEFAULT_SCHEMA,
      freezeTableName: true,
      underscored: true,
      timestamps: true
    },
    dialectOptions: {
      prependSearchPath: true,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 20000
    }
  }
};
