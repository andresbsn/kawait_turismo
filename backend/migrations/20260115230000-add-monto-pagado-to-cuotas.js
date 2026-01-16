'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('cuotas');
    
    // Solo agregar la columna si no existe
    if (!tableInfo.monto_pagado) {
      await queryInterface.addColumn('cuotas', 'monto_pagado', {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('cuotas');
    
    if (tableInfo.monto_pagado) {
      await queryInterface.removeColumn('cuotas', 'monto_pagado');
    }
  }
};
