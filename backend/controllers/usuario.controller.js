// controllers/usuario.controller.js
const { User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// Alias para mantener la consistencia en el controlador
const Usuario = User;

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios
 * @access  Private/Admin
 */
const obtenerUsuarios = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: usuarios } = await Usuario.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: { 
        exclude: ['password'],
        include: [
          'id',
          'username',
          'email',
          'role',
          'active',
          'created_at',
          'updated_at'
        ]
      },
      order: [['created_at', 'DESC']]
    });

    res.json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      usuarios
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ mensaje: 'Error al obtener los usuarios', error: error.message });
  }
};

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por ID
 * @access  Private/Admin
 */
const obtenerUsuarioPorId = async (req, res) => {
  try {
    console.log('params', req.params);
    
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ mensaje: 'Error al obtener el usuario', error: error.message });
  }
};

/**
 * @route   POST /api/usuarios
 * @desc    Crear un nuevo usuario
 * @access  Private/Admin
 */
const crearUsuario = async (req, res) => {
  try {
    const { username, email, password, role, active = true } = req.body;

    // Validar campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Todos los campos son requeridos',
        fields: { username: !username, email: !email, password: !password }
      });
    }

    // Verificar si el correo ya está registrado
    const usuarioExistente = await Usuario.findOne({ 
      where: { 
        [Op.or]: [
          { email },
          { username }
        ]
      } 
    });

    if (usuarioExistente) {
      if (usuarioExistente.email === email) {
        return res.status(400).json({ 
          success: false,
          message: 'El correo electrónico ya está registrado',
          field: 'email'
        });
      }
      if (usuarioExistente.username === username) {
        return res.status(400).json({ 
          success: false,
          message: 'El nombre de usuario ya está en uso',
          field: 'username'
        });
      }
    }

    // Crear el usuario
    const usuario = await Usuario.create({
      username,
      email,
      password,
      role: role || 'USER',
      active: active !== undefined ? active : true
    });

    // No enviar la contraseña en la respuesta
    const usuarioCreado = usuario.get({ plain: true });
    delete usuarioCreado.password;

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: usuarioCreado
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ mensaje: 'Error al crear el usuario', error: error.message });
  }
};

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar un usuario existente
 * @access  Private/Admin
 */
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, active, password } = req.body;

    console.log('Solicitud de actualización recibida. ID:', id, 'Datos:', req.body);

    // Validar que el ID sea un número entero
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      console.error('ID de usuario no válido:', id);
      return res.status(400).json({ 
        success: false, 
        message: 'ID de usuario no válido' 
      });
    }

    // Buscar el usuario
    console.log('Buscando usuario con ID:', userId);
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    // Verificar si el correo o username ya están en uso por otro usuario
    if (email && email !== usuario.email) {
      const usuarioExistente = await Usuario.findOne({ 
        where: { 
          [Op.or]: [
            { email },
            { username: username || usuario.username }
          ],
          id: { [Op.ne]: id } // Excluir el usuario actual
        } 
      });

      if (usuarioExistente) {
        if (usuarioExistente.email === email) {
          return res.status(400).json({ 
            success: false,
            message: 'El correo electrónico ya está registrado',
            field: 'email'
          });
        }
        if (usuarioExistente.username === (username || usuario.username)) {
          return res.status(400).json({ 
            success: false,
            message: 'El nombre de usuario ya está en uso',
            field: 'username'
          });
        }
      }
    }

    // Preparar datos para actualizar
    const datosActualizacion = {
      username: username !== undefined ? username : usuario.username,
      email: email !== undefined ? email : usuario.email,
      role: role !== undefined ? role : usuario.role,
      active: active !== undefined ? active : usuario.active
    };

    // Si se proporcionó una nueva contraseña, hashearla
    if (password) {
      const salt = await bcrypt.genSalt(10);
      datosActualizacion.password = await bcrypt.hash(password, salt);
    }

    // Actualizar el usuario
    await usuario.update(datosActualizacion);

    // Obtener el usuario actualizado sin la contraseña
    console.log('Obteniendo usuario actualizado con ID:', userId);
    const usuarioActualizado = await Usuario.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      user: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el usuario', error: error.message });
  }
};

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar un usuario
 * @access  Private/Admin
 */
const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // No permitir eliminar el propio usuario
    if (usuario.id === req.user.id) {
      return res.status(400).json({ mensaje: 'No puedes eliminar tu propio usuario' });
    }

    await usuario.destroy();
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el usuario', error: error.message });
  }
};

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};
