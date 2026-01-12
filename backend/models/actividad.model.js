'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Actividad extends Model {
    static associate(models) {
      // Relación con Destino
      this.belongsTo(models.Destino, {
        foreignKey: 'destino_id',
        as: 'destino'
      });
    }
  }

  Actividad.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    destino_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'destinos',
        key: 'id'
      }
    },
    duracion_horas: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    capacidad_maxima: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    fecha_hora_inicio: {
      type: DataTypes.DATE,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Actividad',
    tableName: 'actividades',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      where: { activo: true }
    },
    hooks: {
      beforeCreate: (actividad) => {
        if (actividad.nombre) {
          actividad.nombre = actividad.nombre.trim();
        }
        if (actividad.descripcion) {
          actividad.descripcion = actividad.descripcion.trim();
        }
      },
      beforeUpdate: (actividad) => {
        if (actividad.changed('nombre') && actividad.nombre) {
          actividad.nombre = actividad.nombre.trim();
        }
        if (actividad.changed('descripcion') && actividad.descripcion) {
          actividad.descripcion = actividad.descripcion.trim();
        }
      }
    }
  });

  return Actividad;
};
