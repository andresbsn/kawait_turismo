'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cuentas_corrientes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      reserva_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'reservas',
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
      monto_total: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      saldo_pendiente: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      cantidad_cuotas: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'en_proceso', 'pagado', 'atrasado', 'cancelado'),
        allowNull: false,
        defaultValue: 'pendiente'
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
    await queryInterface.addIndex('cuentas_corrientes', ['reserva_id'], { unique: true });
    await queryInterface.addIndex('cuentas_corrientes', ['cliente_id']);
    await queryInterface.addIndex('cuentas_corrientes', ['estado']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cuentas_corrientes');
  }
};
