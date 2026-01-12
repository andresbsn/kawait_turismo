'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Destino extends Model {
    static associate(models) {
      // Relación con Categoria
      this.belongsTo(models.Categoria, {
        foreignKey: 'categoria_id',
        as: 'categoria'
      });
      
      // Relación con Alojamientos
      this.hasMany(models.Alojamiento, {
        foreignKey: 'destino_id',
        as: 'alojamientos'
      });
      
      // Relación con Actividades
      this.hasMany(models.Actividad, {
        foreignKey: 'destino_id',
        as: 'actividades'
      });
    }
  }

  Destino.init({
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
          msg: 'El nombre del destino es obligatorio'
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
    ubicacion: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La ubicación es obligatoria'
        }
      }
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categorias',
        key: 'id'
      },
      validate: {
        isInt: {
          msg: 'El ID de la categoría debe ser un número entero'
        }
      }
    },
    imagen_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'La URL de la imagen no es válida'
        }
      }
    },
    precio_promedio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'El precio no puede ser negativo'
        }
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Destino',
    tableName: 'destinos',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      where: { activo: true },
      include: [
        { 
          association: 'categoria',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          association: 'alojamientos',
          where: { activo: true },
          required: false
        },
        {
          association: 'actividades',
          where: { activo: true },
          required: false
        }
      ]
    },
    hooks: {
      beforeCreate: (destino) => {
        if (destino.nombre) {
          destino.nombre = destino.nombre.trim();
        }
        if (destino.descripcion) {
          destino.descripcion = destino.descripcion.trim();
        }
        if (destino.ubicacion) {
          destino.ubicacion = destino.ubicacion.trim();
        }
      },
      beforeUpdate: (destino) => {
        if (destino.changed('nombre') && destino.nombre) {
          destino.nombre = destino.nombre.trim();
        }
        if (destino.changed('descripcion') && destino.descripcion) {
          destino.descripcion = destino.descripcion.trim();
        }
        if (destino.changed('ubicacion') && destino.ubicacion) {
          destino.ubicacion = destino.ubicacion.trim();
        }
      }
    }
  });

  return Destino;
};
