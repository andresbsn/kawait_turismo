'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ReservaAdjunto extends Model {
        static associate(models) {
            this.belongsTo(models.Reserva, {
                foreignKey: 'reserva_id',
                as: 'reserva'
            });
        }
    }

    ReservaAdjunto.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        reserva_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'reservas',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        },
        tipo: {
            type: DataTypes.ENUM('presupuesto', 'voucher', 'ticket_aereo', 'asistencia_viajero', 'factura', 'liquidacion_reserva', 'otro'),
            allowNull: false,
        },
        nombre_archivo: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Nombre original del archivo'
        },
        ruta_archivo: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Ruta relativa donde se guardó el archivo'
        },
        mimetype: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        size: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'ReservaAdjunto',
        tableName: 'reserva_adjuntos',
        timestamps: true,
        underscored: true,
        paranoid: true,
    });

    return ReservaAdjunto;
};
