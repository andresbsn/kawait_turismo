'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Check if the table exists
      const tableExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('reservas'));
      
      if (!tableExists) {
        console.log('La tabla reservas no existe. No se pueden realizar cambios.');
        return;
      }

      // Make tour_id nullable if it exists
      const tableDescription = await queryInterface.describeTable('reservas');
      
      if (tableDescription.tour_id) {
        await queryInterface.changeColumn('reservas', 'tour_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'tours',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        }, { transaction });
      }

      // Add new fields if they don't exist
      if (!tableDescription.referencia) {
        await queryInterface.addColumn('reservas', 'referencia', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Código o referencia de la reserva'
        }, { transaction });
      }

      if (!tableDescription.descripcion) {
        await queryInterface.addColumn('reservas', 'descripcion', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Detalles adicionales del viaje'
        }, { transaction });
      }

      // Check if reserva_clientes table already exists
      const reservaClientesExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('reserva_clientes'));
      
      if (!reservaClientesExists) {
        // Create reserva_cliente junction table
        await queryInterface.createTable('reserva_clientes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      reserva_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'reservas',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

        // Add unique constraint to prevent duplicate client-reservation pairs
        await queryInterface.addConstraint('reserva_clientes', {
          fields: ['reserva_id', 'cliente_id'],
          type: 'unique',
          name: 'unique_reserva_cliente',
          transaction
        });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('Error during migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('reserva_clientes', 'unique_reserva_cliente');
    await queryInterface.dropTable('reserva_clientes');
    await queryInterface.removeColumn('reservas', 'descripcion');
    await queryInterface.removeColumn('reservas', 'referencia');
    
    // Restore tour_id to not nullable if needed
    await queryInterface.changeColumn('reservas', 'tour_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'tours',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  }
};
