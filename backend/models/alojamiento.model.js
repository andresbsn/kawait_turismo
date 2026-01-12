'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Alojamiento extends Model {
    static associate(models) {
      // Relación con Destino
      this.belongsTo(models.Destino, {
        foreignKey: 'destino_id',
        as: 'destino'
      });
      
      // Relación con Reservas (comentada ya que no es necesaria)
      // this.hasMany(models.Reserva, {
      //   foreignKey: 'alojamiento_id',
      //   as: 'reservas'
      // });
    }
  }

  Alojamiento.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre del alojamiento es obligatorio'
        },
        len: {
          args: [3, 100],
          msg: 'El nombre debe tener entre 3 y 100 caracteres'
        }
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'La descripción no puede exceder los 2000 caracteres'
        }
      }
    },
    destino_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'destinos',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'El ID del destino es obligatorio'
        },
        isInt: {
          msg: 'El ID del destino debe ser un número entero'
        }
      }
    },
    tipo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: {
          args: [['HOTEL', 'HOSTAL', 'CABAÑA', 'DEPARTAMENTO', 'CAMPING', 'OTRO']],
          msg: 'Tipo de alojamiento no válido'
        }
      }
    },
    direccion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: /^[0-9+()\-\s]*$/,
          msg: 'Formato de teléfono no válido'
        }
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Por favor ingresa un correo electrónico válido'
        }
      }
    },
    precio_noche: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'El precio por noche no puede ser negativo'
        }
      }
    },
    capacidad_personas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: {
          args: [1],
          msg: 'La capacidad debe ser al menos para 1 persona'
        }
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Alojamiento',
    tableName: 'alojamientos',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      where: { activo: true }
    },
    hooks: {
      beforeCreate: (alojamiento) => {
        if (alojamiento.nombre) {
          alojamiento.nombre = alojamiento.nombre.trim();
        }
        if (alojamiento.descripcion) {
          alojamiento.descripcion = alojamiento.descripcion.trim();
        }
        if (alojamiento.direccion) {
          alojamiento.direccion = alojamiento.direccion.trim();
        }
      },
      beforeUpdate: (alojamiento) => {
        if (alojamiento.changed('nombre') && alojamiento.nombre) {
          alojamiento.nombre = alojamiento.nombre.trim();
        }
        if (alojamiento.changed('descripcion') && alojamiento.descripcion) {
          alojamiento.descripcion = alojamiento.descripcion.trim();
        }
        if (alojamiento.changed('direccion') && alojamiento.direccion) {
          alojamiento.direccion = alojamiento.direccion.trim();
        }
      }
    }
  });

  return Alojamiento;
};
