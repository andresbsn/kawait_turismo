'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Crear la tabla de unión
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
        tipo_cliente: {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'titular',
          comment: 'Tipo de cliente en la reserva (ej: titular, acompañante)'
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
      }, { transaction });

      // 2. Añadir restricción única
      await queryInterface.addConstraint('reserva_clientes', {
        fields: ['reserva_id', 'cliente_id'],
        type: 'unique',
        name: 'unique_reserva_cliente',
        transaction
      });

      // 3. Eliminar columnas de cliente de la tabla reservas
      const tableDescription = await queryInterface.describeTable('reservas');
      
      const columnasAEliminar = [
        'cliente_id',
        'nombre_cliente',
        'email_cliente',
        'telefono_cliente'
      ];

      for (const columna of columnasAEliminar) {
        if (tableDescription[columna]) {
          await queryInterface.removeColumn('reservas', columna, { transaction });
          console.log(`Columna ${columna} eliminada de la tabla reservas`);
        }
      }

      await transaction.commit();
      console.log('Migración completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('Error durante la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // 1. Volver a agregar las columnas a la tabla reservas
      await queryInterface.addColumn('reservas', 'cliente_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clientes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }, { transaction });

      await queryInterface.addColumn('reservas', 'nombre_cliente', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('reservas', 'email_cliente', {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          isEmail: true,
        },
      }, { transaction });

      await queryInterface.addColumn('reservas', 'telefono_cliente', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      // 2. Eliminar la tabla de unión
      await queryInterface.dropTable('reserva_clientes', { transaction });

      await transaction.commit();
      console.log('Rollback completado exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('Error durante el rollback:', error);
      throw error;
    }
  }
};
