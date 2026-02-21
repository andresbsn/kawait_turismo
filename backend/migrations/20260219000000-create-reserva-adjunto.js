'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('reserva_adjuntos', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            reserva_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'reservas',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            tipo: {
                type: Sequelize.ENUM('presupuesto', 'voucher', 'ticket_aereo', 'asistencia_viajero', 'factura', 'otro'),
                allowNull: false
            },
            nombre_archivo: {
                type: Sequelize.STRING,
                allowNull: false
            },
            ruta_archivo: {
                type: Sequelize.STRING,
                allowNull: false
            },
            mimetype: {
                type: Sequelize.STRING,
                allowNull: true
            },
            size: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true
            }
        });

        // Añadir índice para búsqueda rápida por reserva
        await queryInterface.addIndex('reserva_adjuntos', ['reserva_id']);
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('reserva_adjuntos');
    }
};
