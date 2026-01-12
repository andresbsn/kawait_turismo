'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reserva extends Model {
    static associate(models) {
      // Relación con Tour
      this.belongsTo(models.Tour, {
        foreignKey: 'tourId',
        as: 'tour'
      });
    }
  }

  Reserva.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    tourId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tours',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
      field: 'tour_id'
    },
    nombreCliente: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'nombre_cliente'
    },
    emailCliente: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'El email debe ser una dirección de correo válida'
        }
      },
      field: 'email_cliente'
    },
    telefonoCliente: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'telefono_cliente'
    },
    fechaReserva: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'fecha_reserva',
      validate: {
        isDate: {
          msg: 'La fecha de reserva no es válida'
        }
      }
    },
    cantidadPersonas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: [1],
          msg: 'La cantidad de personas debe ser al menos 1'
        }
      },
      field: 'cantidad_personas'
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'precio_unitario'
    },
    montoTotal: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.cantidadPersonas * this.precioUnitario;
      },
      set(value) {
        throw new Error('No se puede establecer el monto total directamente');
      },
      field: 'monto_total'
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'completada'),
      defaultValue: 'pendiente',
      allowNull: false,
      validate: {
        isIn: {
          args: [['pendiente', 'confirmada', 'cancelada', 'completada']],
          msg: 'Estado de reserva no válido'
        }
      }
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Reserva',
    tableName: 'reservas',
    timestamps: true,
    underscored: true,
    paranoid: true,
    defaultScope: {
      where: { activo: true }
    },
    scopes: {
      todas: {
        where: {}
      },
      activas: {
        where: { activo: true }
      },
      inactivas: {
        where: { activo: false }
      },
      porEstado: (estado) => ({
        where: { estado }
      })
    },
    hooks: {
      beforeCreate: async (reserva) => {
        // Generar código único para la reserva
        if (!reserva.codigo) {
          const date = new Date();
          const year = date.getFullYear().toString().slice(-2);
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const random = Math.floor(1000 + Math.random() * 9000);
          reserva.codigo = `RES-${year}${month}${random}`;
        }
        
        // Obtener el precio del tour si no se proporciona
        if (!reserva.precioUnitario && reserva.tourId) {
          const tour = await sequelize.models.Tour.findByPk(reserva.tourId);
          if (tour) {
            reserva.precioUnitario = tour.precio;
          }
        }
      }
    }
  });

  return Reserva;
};
