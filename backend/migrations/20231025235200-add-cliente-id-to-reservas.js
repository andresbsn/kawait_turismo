'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero, agregar la columna cliente_id a la tabla reservas
    await queryInterface.addColumn('reservas', 'cliente_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Temporalmente permitir nulo para migración
      references: {
        model: 'clientes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Si ya existen datos, podríamos migrarlos aquí
    // Por ahora, la columna es opcional para permitir la migración
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('reservas', 'cliente_id');
  }
};
