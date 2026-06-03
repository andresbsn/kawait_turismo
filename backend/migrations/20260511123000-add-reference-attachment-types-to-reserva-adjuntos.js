'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query("ALTER TYPE enum_reserva_adjuntos_tipo ADD VALUE IF NOT EXISTS 'referencia_terrestre';");
    await queryInterface.sequelize.query("ALTER TYPE enum_reserva_adjuntos_tipo ADD VALUE IF NOT EXISTS 'referencia_aerea';");
    await queryInterface.sequelize.query("ALTER TYPE enum_reserva_adjuntos_tipo ADD VALUE IF NOT EXISTS 'referencia_asistencia';");
  },

  async down() {
  },
};
