'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Reserva extends Model {
    static associate(models) {
      // Relación con Tour (opcional)
      this.belongsTo(models.Tour, {
        foreignKey: 'tour_id',
        as: 'tour'
      });

      // Relación muchos a muchos con Cliente a través de la tabla intermedia
      this.belongsToMany(models.Cliente, {
        through: 'reserva_clientes',
        foreignKey: 'reserva_id',
        otherKey: 'cliente_id',
        as: 'clientes'
      });

      // Relación con ReservaAdjunto
      this.hasMany(models.ReservaAdjunto, {
        foreignKey: 'reserva_id',
        as: 'adjuntos'
      });

      // Relación con CuentaCorriente
      this.hasMany(models.CuentaCorriente, {
        foreignKey: 'reserva_id',
        as: 'cuentas_corrientes'
      });
    }
  }

  Reserva.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    tour_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'tours',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Opcional: ID del tour asociado a la reserva'
    },
    // Campos para tour personalizado (cuando no se asocia a un tour existente)
    tour_nombre: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Nombre del tour personalizado'
    },
    tour_destino: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Destino del tour personalizado'
    },
    tour_descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción detallada del tour personalizado'
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Fecha de inicio del tour personalizado'
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Fecha de finalización del tour personalizado',
      validate: {
        isAfterStartDate(value) {
          if (this.fecha_inicio && value && new Date(value) < new Date(this.fecha_inicio)) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
          }
        }
      }
    },
    referencia: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Código o referencia de la reserva'
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Detalles adicionales del viaje'
    },
    fecha_reserva: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'La fecha de reserva no es válida',
        },
      },
    },
    cantidad_personas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: [1],
          msg: 'La cantidad de personas debe ser al menos 1',
        },
      },
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    moneda_precio_unitario: {
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
    monto_total: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.cantidad_personas * this.precio_unitario;
      },
      set() {
        throw new Error('No se puede establecer el monto total directamente');
      },
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'completada'),
      defaultValue: 'pendiente',
      allowNull: false,
      validate: {
        isIn: {
          args: [['pendiente', 'confirmada', 'cancelada', 'completada']],
          msg: 'Estado de reserva no válido',
        },
      },
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fecha_vencimiento_hotel: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Fecha de vencimiento del hotel'
    },
    requisitos_ingresos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Requisitos de ingreso al destino'
    },
    condiciones_generales: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Condiciones generales de la reserva'
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    modelName: 'Reserva',
    tableName: 'reservas',
    timestamps: true,
    underscored: true,
    paranoid: true,
    defaultScope: {
      where: { activo: true },
    },
    scopes: {
      todas: {
        where: {},
      },
      activas: {
        where: { activo: true },
      },
      inactivas: {
        where: { activo: false },
      },
      porEstado: (estado) => ({
        where: { estado },
      }),
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
        if (!reserva.precio_unitario && reserva.tour_id) {
          const tour = await sequelize.models.Tour.findByPk(reserva.tour_id);
          if (tour) {
            reserva.precio_unitario = tour.precio;
          }
        }
      },
    },
  });

  return Reserva;
};
