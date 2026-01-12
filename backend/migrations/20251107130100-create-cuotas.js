'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cuotas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      cuenta_corriente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cuentas_corrientes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      numero_cuota: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      monto: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      fecha_vencimiento: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      fecha_pago: {
        type: Sequelize.DATE,
        allowNull: true
      },
      monto_pagado: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'pagada_parcial', 'pagada_total', 'vencida', 'cancelada'),
        allowNull: false,
        defaultValue: 'pendiente'
      },
      metodo_pago: {
        type: Sequelize.STRING,
        allowNull: true
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fecha_creacion: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now')
      },
      fecha_actualizacion: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });

    // Índices para mejorar el rendimiento de las consultas
    await queryInterface.addIndex('cuotas', ['cuenta_corriente_id']);
    await queryInterface.addIndex('cuotas', ['fecha_vencimiento']);
    await queryInterface.addIndex('cuotas', ['estado']);
    await queryInterface.addIndex('cuotas', ['numero_cuota', 'cuenta_corriente_id'], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cuotas');
  }
};
