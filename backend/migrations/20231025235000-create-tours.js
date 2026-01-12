'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tours', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      destino: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fecha_inicio: {
        type: Sequelize.DATE,
        allowNull: false
      },
      fecha_fin: {
        type: Sequelize.DATE,
        allowNull: false
      },
      precio: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      cupo_maximo: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      cupos_disponibles: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('disponible', 'completo', 'cancelado', 'finalizado'),
        defaultValue: 'disponible'
      },
      imagen_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Agregar índices para mejorar el rendimiento
    await queryInterface.addIndex('tours', ['estado']);
    await queryInterface.addIndex('tours', ['fecha_inicio']);
    await queryInterface.addIndex('tours', ['destino']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tours');
  }
};
