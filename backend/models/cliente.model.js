'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cliente extends Model {
    static associate(models) {
      // Relación muchos a muchos con Reserva a través de la tabla intermedia
      this.belongsToMany(models.Reserva, {
        through: 'reserva_clientes',
        foreignKey: 'cliente_id',
        otherKey: 'reserva_id',
        as: 'reservas'
      });
    }
  }

  Cliente.init({
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
          msg: 'El nombre es obligatorio'
        },
        len: {
          args: [2, 50],
          msg: 'El nombre debe tener entre 2 y 50 caracteres'
        }
      }
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El apellido es obligatorio'
        },
        len: {
          args: [2, 50],
          msg: 'El apellido debe tener entre 2 y 50 caracteres'
        }
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'Este correo electrónico ya está registrado'
      },
      validate: {
        isEmail: {
          msg: 'Por favor ingresa un correo electrónico válido'
        },
        notEmpty: {
          msg: 'El correo electrónico es requerido'
        }
      }
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
    direccion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: {
        msg: 'Este DNI ya está registrado'
      },
      validate: {
        notEmpty: {
          msg: 'El DNI es obligatorio'
        },
        len: {
          args: [7, 20],
          msg: 'El DNI debe tener entre 7 y 20 caracteres'
        }
      }
    },
    fecha_nacimiento: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Formato de fecha no válido (YYYY-MM-DD)'
        },
        isBefore: new Date().toISOString().split('T')[0],
        customValidator(value) {
          if (value) {
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            
            if (age < 18) {
              throw new Error('El cliente debe ser mayor de 18 años');
            }
          }
        }
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Cliente',
    tableName: 'clientes',
    timestamps: true,
    paranoid: true,
    defaultScope: {
      where: { activo: true }
    },
    hooks: {
      beforeCreate: (cliente) => {
        // Convertir a mayúsculas
        if (cliente.nombre) cliente.nombre = cliente.nombre.trim().toUpperCase();
        if (cliente.apellido) cliente.apellido = cliente.apellido.trim().toUpperCase();
        if (cliente.direccion) cliente.direccion = cliente.direccion.trim();
      },
      beforeUpdate: (cliente) => {
        if (cliente.changed('nombre')) cliente.nombre = cliente.nombre.trim().toUpperCase();
        if (cliente.changed('apellido')) cliente.apellido = cliente.apellido.trim().toUpperCase();
        if (cliente.changed('direccion')) cliente.direccion = cliente.direccion.trim();
      }
    }
  });

  return Cliente;
};
