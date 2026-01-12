'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tour extends Model {
    static associate(models) {
      // Definir asociaciones aquí
      this.hasMany(models.Reserva, {
        foreignKey: 'tour_id',
        as: 'reservas'
      });
    }
  }

  Tour.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre del tour es obligatorio'
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
      defaultValue: ''
    },
    destino: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El destino es obligatorio'
        }
      }
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'La fecha de inicio debe ser una fecha válida'
        },
        isAfter: {
          args: new Date().toISOString(),
          msg: 'La fecha de inicio debe ser posterior a la fecha actual'
        }
      }
    },
    fechaFin: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'La fecha de fin debe ser una fecha válida'
        },
        isAfterStartDate(value) {
          if (value && this.fechaInicio && new Date(value) <= new Date(this.fechaInicio)) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
          }
        }
      }
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        isDecimal: {
          msg: 'El precio debe ser un número decimal válido'
        },
        min: {
          args: [0],
          msg: 'El precio no puede ser negativo'
        }
      }
    },
    cupoMaximo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10,
      validate: {
        isInt: {
          msg: 'El cupo máximo debe ser un número entero'
        },
        min: {
          args: [1],
          msg: 'El cupo máximo debe ser al menos 1'
        }
      }
    },
    cuposDisponibles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'cupos_disponibles',  // Mapear a snake_case en la base de datos
      defaultValue: 10,  // Valor por defecto inicial
      validate: {
        isInt: {
          msg: 'Los cupos disponibles deben ser un número entero'
        },
        min: {
          args: [0],
          msg: 'Los cupos disponibles no pueden ser negativos'
        },
        isValid() {
          // Obtener los valores directamente de los datos del modelo
          const cuposDisponibles = this.getDataValue('cuposDisponibles');
          const cupoMaximo = this.getDataValue('cupoMaximo');
          
          if (cuposDisponibles > cupoMaximo) {
            throw new Error('Los cupos disponibles no pueden ser mayores al cupo máximo');
          }
        }
      }
    },
    estado: {
      type: DataTypes.ENUM('disponible', 'completo', 'cancelado', 'finalizado'),
      defaultValue: 'disponible',
      validate: {
        isIn: {
          args: [['disponible', 'completo', 'cancelado', 'finalizado']],
          msg: 'Estado no válido'
        }
      }
    },
    imagenUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'imagen_url',  // Mapear a snake_case en la base de datos
      validate: {
        // Validación personalizada que permite cadenas vacías
        isValidUrl(value) {
          if (value && value.trim() !== '') {
            try {
              // Solo validar si hay un valor
              new URL(value);
              // Verificar que sea HTTP o HTTPS
              if (!value.startsWith('http://') && !value.startsWith('https://')) {
                throw new Error('La URL debe comenzar con http:// o https://');
              }
            } catch (e) {
              throw new Error('La URL de la imagen no es válida');
            }
          }
        }
      },
      // Convertir cadenas vacías a null
      set(value) {
        this.setDataValue('imagenUrl', value || null);
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Tour',
    tableName: 'tours',
    timestamps: true,
    paranoid: true,
    hooks: {
      beforeValidate: (tour) => {
        // Asegurar que los nombres de los destinos tengan la primera letra en mayúscula
        if (tour.destino) {
          tour.destino = tour.destino.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
        
        // Asegurar que el nombre del tour tenga la primera letra en mayúscula
        if (tour.nombre) {
          tour.nombre = tour.nombre.charAt(0).toUpperCase() + tour.nombre.slice(1).toLowerCase();
        }
      },
      beforeSave: async (tour) => {
        // Actualizar el estado según los cupos disponibles
        if (tour.cuposDisponibles <= 0) {
          tour.estado = 'completo';
        } else if (tour.estado === 'completo' && tour.cuposDisponibles > 0) {
          tour.estado = 'disponible';
        }
      }
    },
    scopes: {
      activos: {
        where: { activo: true }
      },
      disponibles: {
        where: { 
          estado: 'disponible',
          activo: true
        }
      },
      porDestino: (destino) => ({
        where: { 
          destino,
          activo: true
        }
      })
    }
  });

  return Tour;
};
