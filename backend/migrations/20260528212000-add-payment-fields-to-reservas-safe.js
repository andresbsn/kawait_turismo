'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('reservas');
    
    // 1. Agregar metodo_pago si no existe
    if (!tableInfo.metodo_pago) {
      await queryInterface.addColumn('reservas', 'metodo_pago', {
        type: Sequelize.ENUM('efectivo', 'transferencia', 'tarjeta_credito', 'otro'),
        allowNull: true
      });
    }

    // 2. Agregar monto_abonado si no existe
    if (!tableInfo.monto_abonado) {
      await queryInterface.addColumn('reservas', 'monto_abonado', {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      });
    }

    // 3. Agregar estado_pago si no existe
    if (!tableInfo.estado_pago) {
      await queryInterface.addColumn('reservas', 'estado_pago', {
        type: Sequelize.ENUM('pendiente', 'parcial', 'completo'),
        defaultValue: 'pendiente'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('reservas');
    
    if (tableInfo.metodo_pago) {
      await queryInterface.removeColumn('reservas', 'metodo_pago');
    }
    if (tableInfo.monto_abonado) {
      await queryInterface.removeColumn('reservas', 'monto_abonado');
    }
    if (tableInfo.estado_pago) {
      await queryInterface.removeColumn('reservas', 'estado_pago');
    }
  }
};
