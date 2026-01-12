'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ReservaCliente extends Model {
    static associate(models) {
      // Relación con Reserva
      this.belongsTo(models.Reserva, {
        foreignKey: 'reserva_id',
        as: 'reserva',
        onDelete: 'CASCADE'
      });
      
      // Relación con Cliente
      this.belongsTo(models.Cliente, {
        foreignKey: 'cliente_id',
        as: 'cliente',
        onDelete: 'CASCADE'
      });
    }
  }

  ReservaCliente.init({
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
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    // Puedes agregar campos adicionales específicos de la relación aquí si es necesario
    // Por ejemplo, tipo de cliente (titular, acompañante, etc.)
    tipo_cliente: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'titular',
      comment: 'Tipo de cliente en la reserva (ej: titular, acompañante)'
    },
    // Otros campos específicos de la relación si son necesarios
  }, {
    sequelize,
    modelName: 'ReservaCliente',
    tableName: 'reserva_clientes',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      {
        unique: true,
        fields: ['reserva_id', 'cliente_id'],
        name: 'unique_reserva_cliente'
      }
    ]
  });

  return ReservaCliente;
};
