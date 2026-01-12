'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pago extends Model {
    static associate(models) {
      this.belongsTo(models.CuentaCorriente, {
        foreignKey: 'cuenta_corriente_id',
        as: 'cuenta_corriente'
      });

      this.belongsTo(models.Cuota, {
        foreignKey: 'cuota_id',
        as: 'cuota'
      });

      this.belongsTo(models.User, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });
    }
  }

  Pago.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    correlativo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        isInt: {
          msg: 'El correlativo debe ser un número entero'
        },
        min: {
          args: [1],
          msg: 'El correlativo debe ser al menos 1'
        }
      }
    },
    numero_comprobante: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'El número de comprobante es obligatorio'
        }
      }
    },
    cuenta_corriente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cuentas_corrientes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    cuota_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'cuotas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    cliente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'El monto debe ser un número decimal válido'
        },
        min: {
          args: [0.01],
          msg: 'El monto debe ser mayor a 0'
        }
      }
    },
    metodo_pago: {
      type: DataTypes.ENUM(
        'efectivo',
        'transferencia',
        'tarjeta_credito',
        'tarjeta_debito',
        'deposito',
        'cheque',
        'echq',
        'otro'
      ),
      allowNull: false
    },
    fecha_pago: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    extra: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Pago',
    tableName: 'pagos',
    timestamps: false,
    hooks: {
      beforeUpdate: (pago) => {
        pago.fecha_actualizacion = new Date();
      }
    }
  });

  return Pago;
};
