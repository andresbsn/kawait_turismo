'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const allTables = await queryInterface.showAllTables();
      const normalizedTables = allTables.map((t) => (typeof t === 'string' ? t : t.tableName || t));

      if (!normalizedTables.includes('reserva_referencias')) {
        await transaction.commit();
        return;
      }

      const tableDescription = await queryInterface.describeTable('reserva_referencias');

      if (!tableDescription.titular) {
        await queryInterface.addColumn('reserva_referencias', 'titular', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      if (!tableDescription.proveedor) {
        await queryInterface.addColumn('reserva_referencias', 'proveedor', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const allTables = await queryInterface.showAllTables();
      const normalizedTables = allTables.map((t) => (typeof t === 'string' ? t : t.tableName || t));

      if (!normalizedTables.includes('reserva_referencias')) {
        await transaction.commit();
        return;
      }

      const tableDescription = await queryInterface.describeTable('reserva_referencias');

      if (tableDescription.proveedor) {
        await queryInterface.removeColumn('reserva_referencias', 'proveedor', { transaction });
      }

      if (tableDescription.titular) {
        await queryInterface.removeColumn('reserva_referencias', 'titular', { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
