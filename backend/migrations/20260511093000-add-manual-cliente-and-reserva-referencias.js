'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableDescription = await queryInterface.describeTable('reservas');

      if (!tableDescription.nombre_cliente) {
        await queryInterface.addColumn('reservas', 'nombre_cliente', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      if (!tableDescription.apellido_cliente) {
        await queryInterface.addColumn('reservas', 'apellido_cliente', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      if (!tableDescription.dni_cliente) {
        await queryInterface.addColumn('reservas', 'dni_cliente', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      if (!tableDescription.email_cliente) {
        await queryInterface.addColumn('reservas', 'email_cliente', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      if (!tableDescription.telefono_cliente) {
        await queryInterface.addColumn('reservas', 'telefono_cliente', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      const allTables = await queryInterface.showAllTables();
      const normalizedTables = allTables.map((t) => (typeof t === 'string' ? t : t.tableName || t));

      if (!normalizedTables.includes('reserva_referencias')) {
        await queryInterface.createTable('reserva_referencias', {
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
          tipo: {
            type: Sequelize.ENUM('terrestre', 'aereo', 'asistencia'),
            allowNull: false,
          },
          referencia: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          descripcion: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          fecha_vencimiento_hotel: {
            type: Sequelize.DATEONLY,
            allowNull: true,
          },
          requisitos_ingresos: {
            type: Sequelize.TEXT,
            allowNull: true,
          },
          condiciones_generales: {
            type: Sequelize.TEXT,
            allowNull: true,
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

        await queryInterface.addConstraint('reserva_referencias', {
          fields: ['reserva_id', 'tipo'],
          type: 'unique',
          name: 'unique_reserva_referencia_tipo',
          transaction,
        });
      }

      await queryInterface.changeColumn('cuentas_corrientes', 'cliente_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'clientes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }, { transaction });

      await queryInterface.sequelize.query(`
        INSERT INTO reserva_referencias (
          reserva_id,
          tipo,
          referencia,
          descripcion,
          fecha_vencimiento_hotel,
          requisitos_ingresos,
          condiciones_generales,
          created_at,
          updated_at
        )
        SELECT
          r.id,
          'terrestre',
          r.referencia,
          r.descripcion,
          r.fecha_vencimiento_hotel,
          r.requisitos_ingresos,
          r.condiciones_generales,
          NOW(),
          NOW()
        FROM reservas r
        WHERE r.referencia IS NOT NULL
          AND TRIM(r.referencia) <> ''
          AND NOT EXISTS (
            SELECT 1
            FROM reserva_referencias rr
            WHERE rr.reserva_id = r.id AND rr.tipo = 'terrestre'
          )
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const allTables = await queryInterface.showAllTables();
      const normalizedTables = allTables.map((t) => (typeof t === 'string' ? t : t.tableName || t));

      if (normalizedTables.includes('reserva_referencias')) {
        await queryInterface.removeConstraint('reserva_referencias', 'unique_reserva_referencia_tipo', { transaction });
        await queryInterface.dropTable('reserva_referencias', { transaction });
      }

      await queryInterface.changeColumn('cuentas_corrientes', 'cliente_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'clientes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      }, { transaction });

      const tableDescription = await queryInterface.describeTable('reservas');

      if (tableDescription.telefono_cliente) {
        await queryInterface.removeColumn('reservas', 'telefono_cliente', { transaction });
      }
      if (tableDescription.email_cliente) {
        await queryInterface.removeColumn('reservas', 'email_cliente', { transaction });
      }
      if (tableDescription.dni_cliente) {
        await queryInterface.removeColumn('reservas', 'dni_cliente', { transaction });
      }
      if (tableDescription.apellido_cliente) {
        await queryInterface.removeColumn('reservas', 'apellido_cliente', { transaction });
      }
      if (tableDescription.nombre_cliente) {
        await queryInterface.removeColumn('reservas', 'nombre_cliente', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
