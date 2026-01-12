'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Agregar nuevos campos para tour personalizado
    await queryInterface.addColumn('reservas', 'tour_nombre', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Nombre del tour personalizado'
    });

    await queryInterface.addColumn('reservas', 'tour_destino', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Destino del tour personalizado'
    });

    await queryInterface.addColumn('reservas', 'tour_descripcion', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Descripción detallada del tour personalizado'
    });

    await queryInterface.addColumn('reservas', 'fecha_inicio', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Fecha de inicio del tour personalizado'
    });

    await queryInterface.addColumn('reservas', 'fecha_fin', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Fecha de finalización del tour personalizado'
    });

    // Hacer que el campo tour_id sea opcional
    await queryInterface.changeColumn('reservas', 'tour_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'tours',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revertir los cambios
    await queryInterface.removeColumn('reservas', 'tour_nombre');
    await queryInterface.removeColumn('reservas', 'tour_destino');
    await queryInterface.removeColumn('reservas', 'tour_descripcion');
    await queryInterface.removeColumn('reservas', 'fecha_inicio');
    await queryInterface.removeColumn('reservas', 'fecha_fin');
    
    // Volver a hacer que tour_id sea obligatorio
    await queryInterface.changeColumn('reservas', 'tour_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'tours',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  }
};
