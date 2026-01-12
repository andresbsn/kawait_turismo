'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cuota extends Model {
    static associate(models) {
      // Relación con CuentaCorriente
      this.belongsTo(models.CuentaCorriente, {
        foreignKey: 'cuenta_corriente_id',
        as: 'cuenta_corriente'
      });

      this.hasOne(models.Pago, {
        foreignKey: 'cuota_id',
        as: 'pago'
      });
    }
  }

  Cuota.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cuenta_corriente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cuentas_corrientes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    numero_cuota: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: {
          msg: 'El número de cuota debe ser un número entero'
        },
        min: {
          args: [1],
          msg: 'El número de cuota debe ser al menos 1'
        }
      }
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
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'La fecha de vencimiento debe ser una fecha válida'
        },
        isAfterToday(value) {
          if (new Date(value) < new Date()) {
            throw new Error('La fecha de vencimiento debe ser futura');
          }
        }
      }
    },
    fecha_pago: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'La fecha de pago debe ser una fecha válida',
        },
      },
    },
    monto_pagado: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      validate: {
        isDecimal: {
          msg: 'El monto pagado debe ser un número decimal válido'
        },
        min: {
          args: [0],
          msg: 'El monto pagado no puede ser negativo'
        },
        validMontoPagado(value) {
          if (value !== null && value > this.monto) {
            throw new Error('El monto pagado no puede ser mayor al monto de la cuota');
          }
        }
      }
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'pagada_parcial', 'pagada_total', 'vencida', 'cancelada'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    metodo_pago: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        notEmpty: {
          msg: 'El método de pago no puede estar vacío si se registra un pago'
        }
      }
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
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
    modelName: 'Cuota',
    tableName: 'cuotas',
    timestamps: false,
    hooks: {
      beforeUpdate: (cuota) => {
        cuota.fecha_actualizacion = new Date();
        
        // Actualizar estado basado en el monto pagado
        if (cuota.monto_pagado !== null) {
          if (cuota.monto_pagado === 0) {
            cuota.estado = 'pendiente';
          } else if (cuota.monto_pagado < cuota.monto) {
            cuota.estado = 'pagada_parcial';
          } else if (cuota.monto_pagado >= cuota.monto) {
            cuota.estado = 'pagada_total';
          }
        }
      },
      beforeSave: (cuota) => {
        // Validar que si hay monto_pagado, debe haber método de pago
        if (cuota.monto_pagado > 0 && !cuota.metodo_pago) {
          throw new Error('Se debe especificar el método de pago al registrar un pago');
        }
      }
    }
  });

  return Cuota;
};
