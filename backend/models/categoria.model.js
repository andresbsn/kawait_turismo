'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Categoria extends Model {
    static associate(models) {
      // Relación con Destinos
      this.hasMany(models.Destino, {
        foreignKey: 'categoria_id',
        as: 'destinos'
      });
    }
  }

  Categoria.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'Ya existe una categoría con este nombre'
      },
      validate: {
        notEmpty: {
          msg: 'El nombre de la categoría es obligatorio'
        },
        len: {
          args: [2, 50],
          msg: 'El nombre debe tener entre 2 y 50 caracteres'
        }
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'La descripción no puede exceder los 1000 caracteres'
        }
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Categoria',
    tableName: 'categorias',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      where: { activo: true },
      include: [
        {
          association: 'destinos',
          where: { activo: true },
          required: false,
          attributes: ['id', 'nombre', 'ubicacion', 'imagen_url']
        }
      ]
    },
    hooks: {
      beforeCreate: (categoria) => {
        if (categoria.nombre) {
          categoria.nombre = categoria.nombre.trim();
        }
        if (categoria.descripcion) {
          categoria.descripcion = categoria.descripcion.trim();
        }
      },
      beforeUpdate: (categoria) => {
        if (categoria.changed('nombre') && categoria.nombre) {
          categoria.nombre = categoria.nombre.trim();
        }
        if (categoria.changed('descripcion') && categoria.descripcion) {
          categoria.descripcion = categoria.descripcion.trim();
        }
      },
      beforeDestroy: async (categoria) => {
        // Antes de eliminar una categoría, verificar que no tenga destinos asociados
        const count = await categoria.countDestinos();
        if (count > 0) {
          throw new Error('No se puede eliminar la categoría porque tiene destinos asociados');
        }
      }
    }
  });

  return Categoria;
};
