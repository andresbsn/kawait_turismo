'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Definir asociaciones aquí
      // Relación con Reserva eliminada ya que no existe usuario_id en la tabla reservas
    }

    // Método para comparar contraseñas
    validPassword(password) {
      return bcrypt.compareSync(password, this.password);
    }
  }

  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: 'El nombre de usuario es requerido'
        },
        len: {
          args: [3, 30],
          msg: 'El nombre de usuario debe tener entre 3 y 30 caracteres'
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
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La contraseña es requerida'
        },
        len: {
          args: [6, 100],
          msg: 'La contraseña debe tener al menos 6 caracteres'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'USER', 'GUIDE'),
      defaultValue: 'USER',
      allowNull: false,
      validate: {
        isIn: {
          args: [['ADMIN', 'USER', 'GUIDE']],
          msg: 'Rol no válido. Debe ser ADMIN, USER o GUIDE'
        }
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'usuarios',
    timestamps: true,
    underscored: true,
    paranoid: true,
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  return User;
};
