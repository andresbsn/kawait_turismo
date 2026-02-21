'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CuentaCorriente extends Model {
    static associate(models) {
      // Relación con Cliente
      this.belongsTo(models.Cliente, {
        foreignKey: 'cliente_id',
        as: 'cliente'
      });

      // Relación con Reserva
      this.belongsTo(models.Reserva, {
        foreignKey: 'reserva_id',
        as: 'reserva'
      });

      // Relación con Cuotas
      this.hasMany(models.Cuota, {
        foreignKey: 'cuenta_corriente_id',
        as: 'cuotas'
      });

      // Relación con Pagos
      this.hasMany(models.Pago, {
        foreignKey: 'cuenta_corriente_id',
        as: 'pagos'
      });
    }
  }

  CuentaCorriente.init({
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
      onDelete: 'RESTRICT',
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    monto_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'El monto total debe ser un número decimal válido'
        },
        min: {
          args: [0.01],
          msg: 'El monto total debe ser mayor a 0'
        }
      }
    },
    saldo_pendiente: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        isDecimal: {
          msg: 'El saldo pendiente debe ser un número decimal válido'
        },
        min: {
          args: [0],
          msg: 'El saldo pendiente no puede ser negativo'
        }
      }
    },
    cantidad_cuotas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'La cantidad de cuotas debe ser un número entero'
        },
        min: {
          args: [0],
          msg: 'La cantidad de cuotas no puede ser negativa'
        }
      }
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_proceso', 'pagado', 'atrasado', 'cancelado'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'CuentaCorriente',
    tableName: 'cuentas_corrientes',
    timestamps: false,
    hooks: {
      beforeUpdate: (cuenta) => {
        cuenta.fecha_actualizacion = new Date();
      }
    }
  });

  return CuentaCorriente;
};
