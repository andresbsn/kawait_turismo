'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Primero, creamos el tipo ENUM si no existe
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_reservas_metodo_pago AS ENUM ('efectivo', 'transferencia', 'tarjeta_credito', 'otro')"
    );
    
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_reservas_estado_pago AS ENUM ('pendiente', 'parcial', 'completo')"
    );

    // Luego agregamos las columnas
    await queryInterface.addColumn('reservas', 'metodo_pago', {
      type: 'enum_reservas_metodo_pago',
      allowNull: true
    });
    
    await queryInterface.addColumn('reservas', 'monto_abonado', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });
    
    await queryInterface.addColumn('reservas', 'estado_pago', {
      type: 'enum_reservas_estado_pago',
      defaultValue: 'pendiente'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('reservas', 'metodo_pago');
    await queryInterface.removeColumn('reservas', 'monto_abonado');
    await queryInterface.removeColumn('reservas', 'estado_pago');
    
    // Eliminar los tipos ENUM
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_reservas_metodo_pago');
    await queryInterface.sequence.query('DROP TYPE IF EXISTS enum_reservas_estado_pago');
  }
};
