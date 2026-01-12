'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('reservas', 'moneda_precio_unitario', {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: 'ARS'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('reservas', 'moneda_precio_unitario');
  }
};
