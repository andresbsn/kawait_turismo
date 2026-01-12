// controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Cliente } = require('../models');
const { validationResult } = require('express-validator');
const JWT_SECRET = process.env.JWT_SECRET || 'tu_super_secreto_jwt_cambiar_en_produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Genera un token JWT para el usuario
 * @param {Object} user - Objeto de usuario
 * @returns {String} Token JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const generateClienteToken = (cliente) => {
  return jwt.sign(
    {
      tipo: 'cliente',
      cliente_id: cliente.id,
      email: cliente.email,
      role: 'USER'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Formatea la respuesta del usuario para enviar al cliente
 * @param {Object} user - Objeto de usuario
 * @param {String} token - Token JWT
 * @returns {Object} Respuesta formateada
 */
const formatAuthResponse = (user, token) => {
  return {
    success: true,
    token,
    expiresIn: JWT_EXPIRES_IN,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  };
};

/**
 * @desc    Registrar un nuevo usuario
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  const transaction = await User.sequelize.transaction();
  
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array()
      });
    }
    
    const { username, email, password, firstName, lastName, phone } = req.body;
    
    // Verificar si el correo ya está registrado
    const existingUser = await User.findOne({
      where: { email },
      transaction
    });
    
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico ya está registrado',
        field: 'email'
      });
    }
    
    // Verificar si el nombre de usuario ya existe
    const existingUsername = await User.findOne({
      where: { username },
      transaction
    });
    
    if (existingUsername) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso',
        field: 'username'
      });
    }

    // Crear el nuevo usuario
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'user', // Rol por defecto
      active: true,
      emailVerified: false
    }, { transaction });
    
    // Generar token JWT
    const token = generateToken(user);
    
    // Confirmar la transacción
    await transaction.commit();
    
    // Obtener el usuario con los datos actualizados
    const userData = await User.findByPk(user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] }
    });
    
    // Enviar respuesta
    res.status(201).json(formatAuthResponse(userData, token));

  } catch (error) {
    // Revertir la transacción en caso de error
    if (transaction && typeof transaction.rollback === 'function') {
      await transaction.rollback();
    }
    
    console.error('Error en registro:', error);
    
    // Manejo de errores específicos
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: 'Error en el servidor durante el registro',
      code: 'REGISTRATION_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Iniciar sesión de usuario
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const transaction = await User.sequelize.transaction();
  
  try {
    // Validar datos de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors.array()
      });
    }
    console.log('body', req.body);
    const { username, email, password, rememberMe } = req.body;
    
    if (!username && !email) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Se requiere nombre de usuario o correo electrónico',
        field: 'username',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Buscar usuario por nombre de usuario o correo electrónico incluyendo la contraseña
    console.log('Buscando usuario en la base de datos...');
    const whereClause = username ? { username } : { email };
    const user = await User.findOne({ 
      where: whereClause,
      attributes: { include: ['password'] }, // Incluir el campo password
      transaction
    });
    
    // Verificar si el usuario existe
    if (!user) {
      await transaction.rollback();
      console.log('❌ Usuario no encontrado con el nombre de usuario:', username);
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos',
        field: username ? 'username' : 'email',
        code: 'INVALID_CREDENTIALS',
        debug: `No se encontró el usuario: ${username || email}`
      });
    }
    
    console.log('✅ Usuario encontrado en la base de datos:', {
      id: user.id,
      username: user.username,
      email: user.email,
      active: user.active,
      emailVerified: user.emailVerified,
      passwordHash: user.password ? '*** (hash presente)' : '❌ NO HAY HASH'
    });
    console.log('Contraseña almacenada (hash):', user.password);
    
    // Verificar contraseña
    console.log('🔑 Verificando contraseña...');
    console.log('   - Longitud de la contraseña recibida:', password ? password.length : 'vacía');
    console.log('   - Hash almacenado en BD:', user.password ? '*** (presente)' : '❌ NO HAY HASH');
    
    if (!user.password) {
      console.log('❌ Error: No hay hash de contraseña en la base de datos para este usuario');
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: 'Error en la autenticación',
        code: 'AUTH_ERROR',
        debug: 'No se encontró hash de contraseña para el usuario'
      });
    }
    
    console.log('🔍 Comparando contraseñas con bcrypt...');
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
      console.log('   - Resultado de la comparación:', isMatch ? '✅ CONTRASEÑA VÁLIDA' : '❌ CONTRASEÑA INVÁLIDA');
    } catch (bcryptError) {
      console.error('❌ Error al comparar contraseñas:', bcryptError);
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        message: 'Error en la autenticación',
        code: 'AUTH_ERROR',
        debug: 'Error al comparar contraseñas'
      });
    }
    
    if (!isMatch) {
      await transaction.rollback();
      return res.status(401).json({
        success: false,
        message: 'La contraseña es incorrecta',
        field: 'password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar si la cuenta está activa
    if (user.active === false) {
      console.log('❌ La cuenta del usuario está desactivada:', user.username);
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta ha sido desactivada. Por favor, contacta al administrador.',
        code: 'ACCOUNT_DISABLED',
        debug: `La cuenta del usuario ${user.username} está desactivada`
      });
    } else {
      console.log('✅ La cuenta del usuario está activa');
    }
    
    // Verificar si el correo está verificado (opcional)
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    console.log('📧 Verificación de correo electrónico requerida:', requireEmailVerification);
    
    if (requireEmailVerification && !user.emailVerified) {
      console.log('❌ El correo electrónico no está verificado para el usuario:', user.username);
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Por favor verifica tu correo electrónico antes de iniciar sesión.',
        code: 'EMAIL_NOT_VERIFIED',
        debug: `El correo ${user.email} no ha sido verificado`
      });
    } else if (requireEmailVerification) {
      console.log('✅ El correo electrónico está verificado');
    }

    // Generar token JWT
    const token = generateToken(user);
    
    // Configurar opciones de la cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 días o 1 día
    };
    
    // Actualizar lastLogin
    await user.update({ lastLogin: new Date() }, { transaction });
    
    // Confirmar la transacción
    await transaction.commit();
    
    // Enviar cookie (opcional)
    if (process.env.USE_HTTP_ONLY_COOKIES === 'true') {
      res.cookie('jwt', token, cookieOptions);
    }
    
    // Obtener los datos del usuario sin información sensible
    const userData = await User.findByPk(user.id, {
      attributes: { 
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] 
      }
    });
    
    // Enviar respuesta exitosa con los datos del usuario
    const response = formatAuthResponse(user, token);
    response.user = userData; // Agregar los datos del usuario a la respuesta
    
    res.status(200).json(response);

  } catch (error) {
    // Revertir la transacción en caso de error
    if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }
    
    console.error('Error en el inicio de sesión:', error);
    
    // Manejo de errores específicos
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({
        success: false,
        message: 'Error en la base de datos',
        code: 'DB_ERROR'
      });
    }
    
    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: 'Error en el servidor durante el inicio de sesión',
      code: 'LOGIN_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.loginCliente = async (req, res) => {
  try {
    const { email, dni } = req.body;

    if (!email || !dni) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere email y dni',
        code: 'MISSING_CREDENTIALS'
      });
    }

    if (!Cliente) {
      return res.status(500).json({
        success: false,
        message: 'Modelo de cliente no disponible (Cliente)'
      });
    }

    const emailInput = String(email).trim();
    const dniInput = String(dni).trim();

    const cliente = await Cliente.findOne({
      where: {
        email: { [Op.iLike]: emailInput },
        dni: dniInput
      }
    });

    if (!cliente) {
      return res.status(401).json({
        success: false,
        message: 'Email o DNI incorrectos',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const token = generateClienteToken(cliente);

    return res.status(200).json({
      success: true,
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: {
        id: cliente.id,
        username: cliente.email,
        email: cliente.email,
        role: 'USER',
        cliente_id: cliente.id
      }
    });
  } catch (error) {
    console.error('Error en loginCliente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor durante el inicio de sesión',
      code: 'LOGIN_CLIENTE_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Obtener información del usuario actual
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    if (req.user?.tipo === 'cliente') {
      const cliente = await Cliente.findByPk(req.user.id);

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado',
          code: 'CLIENT_NOT_FOUND'
        });
      }

      return res.json({
        success: true,
        user: {
          id: cliente.id,
          email: cliente.email,
          role: 'USER',
          cliente_id: cliente.id
        }
      });
    }

    // El usuario ya está disponible en req.user gracias al middleware de autenticación
    const user = await User.findByPk(req.user.id, {
      attributes: { 
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire'] 
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener el usuario actual:', error);
    
    // Manejo de errores específicos
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({
        success: false,
        message: 'Error en la base de datos',
        code: 'DB_ERROR'
      });
    }
    
    // Error genérico del servidor
    res.status(500).json({
      success: false,
      message: 'Error al obtener la información del usuario',
      code: 'USER_FETCH_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Cerrar sesión de usuario
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = async (req, res) => {
  try {
    // En una implementación con JWT, el logout se maneja principalmente en el cliente
    // eliminando el token del almacenamiento local.
    // Si necesitas invalidar tokens en el servidor, aquí es donde lo harías.
    
    res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente',
      data: {}
    });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
};