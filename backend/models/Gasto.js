'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class Gasto extends Model {
        static associate(models) {
            // Relación con Reserva (opcional — un gasto puede estar vinculado a una reserva)
            this.belongsTo(models.Reserva, {
                foreignKey: 'reserva_id',
                as: 'reserva'
            });
        }
    }

    Gasto.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        descripcion: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Descripción del gasto'
        },
        categoria: {
            type: DataTypes.ENUM('alojamiento', 'transporte', 'excursion', 'seguro', 'comision', 'impuesto', 'proveedor', 'operativo', 'otro'),
            allowNull: false,
            defaultValue: 'otro',
            comment: 'Categoría del gasto'
        },
        importe: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            validate: {
                min: {
                    args: [0.01],
                    msg: 'El importe debe ser mayor a 0'
                }
            }
        },
        moneda: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'ARS',
            validate: {
                isIn: {
                    args: [['ARS', 'USD']],
                    msg: 'Moneda no válida (ARS/USD)'
                }
            }
        },
        fecha_vencimiento: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: 'Fecha de vencimiento del gasto'
        },
        fecha_pago: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: 'Fecha en que se realizó el pago (null si no se pagó)'
        },
        estado: {
            type: DataTypes.ENUM('pendiente', 'pagado', 'vencido', 'cancelado'),
            defaultValue: 'pendiente',
            allowNull: false,
        },
        metodo_pago: {
            type: DataTypes.ENUM('efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'cheque', 'otro'),
            allowNull: true,
            comment: 'Método de pago utilizado'
        },
        proveedor: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Nombre del proveedor'
        },
        numero_factura: {
            type: DataTypes.STRING,
            allowNull: true,
            comment: 'Número de factura o comprobante'
        },
        reserva_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'reservas',
                key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
            comment: 'Reserva asociada (opcional)'
        },
        observaciones: {
            type: DataTypes.TEXT,
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
        modelName: 'Gasto',
        tableName: 'gastos',
        timestamps: true,
        underscored: true,
        paranoid: true,
    });

    return Gasto;
};
