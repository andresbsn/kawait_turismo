'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reservas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      codigo: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      tour_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tours',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      nombre_cliente: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email_cliente: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      telefono_cliente: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fecha_reserva: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      cantidad_personas: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      precio_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'confirmada', 'cancelada', 'completada'),
        defaultValue: 'pendiente',
        allowNull: false
      },
      notas: {
        type: Sequelize.TEXT,
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

    // Crear índices
    await queryInterface.addIndex('reservas', ['codigo'], {
      name: 'idx_reservas_codigo',
      unique: true
    });
    await queryInterface.addIndex('reservas', ['email_cliente'], {
      name: 'idx_reservas_email'
    });
    await queryInterface.addIndex('reservas', ['estado'], {
      name: 'idx_reservas_estado'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reservas');
  }
};