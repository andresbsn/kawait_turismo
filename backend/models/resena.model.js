'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Resena extends Model {
    static associate(models) {
      // Relación con Usuario
      this.belongsTo(models.User, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });

      // Relación con Destino
      this.belongsTo(models.Destino, {
        foreignKey: 'destino_id',
        as: 'destino'
      });

      // Relación con Alojamiento
      this.belongsTo(models.Alojamiento, {
        foreignKey: 'alojamiento_id',
        as: 'alojamiento'
      });

      // Relación con Actividad
      this.belongsTo(models.Actividad, {
        foreignKey: 'actividad_id',
        as: 'actividad'
      });
    }
  }

  Resena.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      validate: {
        notNull: {
          msg: 'El ID de usuario es obligatorio'
        },
        isInt: {
          msg: 'El ID de usuario debe ser un número entero'
        }
      }
    },
    destino_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'destinos',
        key: 'id'
      }
    },
    alojamiento_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'alojamientos',
        key: 'id'
      }
    },
    actividad_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'actividades',
        key: 'id'
      }
    },
    calificacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'La calificación es obligatoria'
        },
        min: {
          args: [1],
          msg: 'La calificación mínima es 1'
        },
        max: {
          args: [5],
          msg: 'La calificación máxima es 5'
        }
      }
    },
    comentario: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'El comentario no puede exceder los 2000 caracteres'
        }
      }
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      validate: {
        isDate: {
          msg: 'La fecha debe ser una fecha válida'
        },
        isBefore: new Date().toISOString(),
        customValidator(value) {
          if (new Date(value) > new Date()) {
            throw new Error('La fecha no puede ser futura');
          }
        }
      }
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Resena',
    tableName: 'resenas',
    timestamps: true,
    validate: {
      atLeastOneEntityId() {
        if (!this.destino_id && !this.alojamiento_id && !this.actividad_id) {
          throw new Error('Debe proporcionar al menos un ID de entidad (destino, alojamiento o actividad)');
        }
      }
    }
  });

  return Resena;
};
