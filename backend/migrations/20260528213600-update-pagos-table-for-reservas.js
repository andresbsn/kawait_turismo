'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableDescription = await queryInterface.describeTable('pagos');

      // 1. Cambiar cuenta_corriente_id a NULLABLE
      if (tableDescription.cuenta_corriente_id && !tableDescription.cuenta_corriente_id.allowNull) {
        await queryInterface.changeColumn('pagos', 'cuenta_corriente_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
        }, { transaction });
      }

      // 2. Cambiar cliente_id a NULLABLE
      if (tableDescription.cliente_id && !tableDescription.cliente_id.allowNull) {
        await queryInterface.changeColumn('pagos', 'cliente_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
        }, { transaction });
      }

      // 3. Agregar reserva_id
      if (!tableDescription.reserva_id) {
        await queryInterface.addColumn('pagos', 'reserva_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'reservas',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }, { transaction });
      }

      // 4. Agregar nombre_pagador
      if (!tableDescription.nombre_pagador) {
        await queryInterface.addColumn('pagos', 'nombre_pagador', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }

      // 5. Agregar email_pagador
      if (!tableDescription.email_pagador) {
        await queryInterface.addColumn('pagos', 'email_pagador', {
          type: Sequelize.STRING,
          allowNull: true
        }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tableDescription = await queryInterface.describeTable('pagos');

      if (tableDescription.email_pagador) {
        await queryInterface.removeColumn('pagos', 'email_pagador', { transaction });
      }
      if (tableDescription.nombre_pagador) {
        await queryInterface.removeColumn('pagos', 'nombre_pagador', { transaction });
      }
      if (tableDescription.reserva_id) {
        await queryInterface.removeColumn('pagos', 'reserva_id', { transaction });
      }

      if (tableDescription.cliente_id && tableDescription.cliente_id.allowNull) {
        await queryInterface.changeColumn('pagos', 'cliente_id', {
          type: Sequelize.INTEGER,
          allowNull: false,
        }, { transaction });
      }

      if (tableDescription.cuenta_corriente_id && tableDescription.cuenta_corriente_id.allowNull) {
        await queryInterface.changeColumn('pagos', 'cuenta_corriente_id', {
          type: Sequelize.INTEGER,
          allowNull: false,
        }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
