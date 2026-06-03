'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReservaReferencia extends Model {
    static associate(models) {
      this.belongsTo(models.Reserva, {
        foreignKey: 'reserva_id',
        as: 'reserva',
        onDelete: 'CASCADE'
      });
    }
  }

  ReservaReferencia.init({
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
      type: DataTypes.ENUM('terrestre', 'aereo', 'asistencia'),
      allowNull: false,
    },
    referencia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    titular: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    proveedor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_vencimiento_hotel: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    requisitos_ingresos: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    condiciones_generales: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'ReservaReferencia',
    tableName: 'reserva_referencias',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['reserva_id', 'tipo'],
        name: 'unique_reserva_referencia_tipo'
      }
    ]
  });

  return ReservaReferencia;
};
