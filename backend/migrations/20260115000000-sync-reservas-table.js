'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Verificar que la tabla existe
      const tableExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('reservas'));
      
      if (!tableExists) {
        throw new Error('La tabla reservas no existe. Ejecuta las migraciones base primero.');
      }

      // Obtener la descripción actual de la tabla
      const tableDescription = await queryInterface.describeTable('reservas');
      
      console.log('Sincronizando tabla reservas con el modelo local...');

      // 1. Hacer tour_id opcional (si existe y es NOT NULL)
      if (tableDescription.tour_id && !tableDescription.tour_id.allowNull) {
        console.log('  - Haciendo tour_id opcional...');
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

      // 2. Agregar campos de tour personalizado
      if (!tableDescription.tour_nombre) {
        console.log('  - Agregando tour_nombre...');
        await queryInterface.addColumn('reservas', 'tour_nombre', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      if (!tableDescription.tour_destino) {
        console.log('  - Agregando tour_destino...');
        await queryInterface.addColumn('reservas', 'tour_destino', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      if (!tableDescription.tour_descripcion) {
        console.log('  - Agregando tour_descripcion...');
        await queryInterface.addColumn('reservas', 'tour_descripcion', {
          type: Sequelize.TEXT,
          allowNull: true,
        }, { transaction });
      }

      // 3. Agregar campos de fechas
      if (!tableDescription.fecha_inicio) {
        console.log('  - Agregando fecha_inicio...');
        await queryInterface.addColumn('reservas', 'fecha_inicio', {
          type: Sequelize.DATEONLY,
          allowNull: true,
        }, { transaction });
      }

      if (!tableDescription.fecha_fin) {
        console.log('  - Agregando fecha_fin...');
        await queryInterface.addColumn('reservas', 'fecha_fin', {
          type: Sequelize.DATEONLY,
          allowNull: true,
        }, { transaction });
      }

      // 4. Agregar campos adicionales
      if (!tableDescription.referencia) {
        console.log('  - Agregando referencia...');
        await queryInterface.addColumn('reservas', 'referencia', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      if (!tableDescription.descripcion) {
        console.log('  - Agregando descripcion...');
        await queryInterface.addColumn('reservas', 'descripcion', {
          type: Sequelize.TEXT,
          allowNull: true,
        }, { transaction });
      }

      // 5. Agregar campo de moneda
      if (!tableDescription.moneda_precio_unitario) {
        console.log('  - Agregando moneda_precio_unitario...');
        await queryInterface.addColumn('reservas', 'moneda_precio_unitario', {
          type: Sequelize.STRING(3),
          allowNull: false,
          defaultValue: 'ARS',
        }, { transaction });
      }

      // 6. Crear tabla reserva_clientes si no existe
      const reservaClientesExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('reserva_clientes'));
      
      if (!reservaClientesExists) {
        console.log('  - Creando tabla reserva_clientes...');
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
          },
        }, { transaction });

        // Agregar constraint único
        await queryInterface.addConstraint('reserva_clientes', {
          fields: ['reserva_id', 'cliente_id'],
          type: 'unique',
          name: 'unique_reserva_cliente',
          transaction
        });
      }

      await transaction.commit();
      console.log('✅ Sincronización completada exitosamente');
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error durante la sincronización:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Eliminar constraint y tabla reserva_clientes
      await queryInterface.removeConstraint('reserva_clientes', 'unique_reserva_cliente', { transaction });
      await queryInterface.dropTable('reserva_clientes', { transaction });
      
      // Eliminar columnas agregadas
      await queryInterface.removeColumn('reservas', 'moneda_precio_unitario', { transaction });
      await queryInterface.removeColumn('reservas', 'descripcion', { transaction });
      await queryInterface.removeColumn('reservas', 'referencia', { transaction });
      await queryInterface.removeColumn('reservas', 'fecha_fin', { transaction });
      await queryInterface.removeColumn('reservas', 'fecha_inicio', { transaction });
      await queryInterface.removeColumn('reservas', 'tour_descripcion', { transaction });
      await queryInterface.removeColumn('reservas', 'tour_destino', { transaction });
      await queryInterface.removeColumn('reservas', 'tour_nombre', { transaction });
      
      // Restaurar tour_id como NOT NULL
      await queryInterface.changeColumn('reservas', 'tour_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tours',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
