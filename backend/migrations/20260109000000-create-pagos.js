'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('pagos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      correlativo: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
      },
      numero_comprobante: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      cuenta_corriente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cuentas_corrientes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cuota_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'cuotas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      monto: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      metodo_pago: {
        type: Sequelize.ENUM(
          'efectivo',
          'transferencia',
          'tarjeta_credito',
          'tarjeta_debito',
          'deposito',
          'cheque',
          'echq',
          'otro'
        ),
        allowNull: false
      },
      fecha_pago: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now')
      },
      observaciones: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      extra: {
        type: Sequelize.JSONB,
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

    await queryInterface.addIndex('pagos', ['cuenta_corriente_id']);
    await queryInterface.addIndex('pagos', ['cliente_id']);
    await queryInterface.addIndex('pagos', ['cuota_id']);
    await queryInterface.addIndex('pagos', ['fecha_pago']);
    await queryInterface.addIndex('pagos', ['numero_comprobante']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('pagos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pagos_metodo_pago";');
  }
};
