// controllers/usuario.controller.js
const usuarioService = require('../services/usuario.service');
const asyncHandler = require('../utils/asyncHandler');
const { success, paginated, validationError } = require('../utils/responseHandler');
const { NotFoundError, ConflictError, ValidationError } = require('../middlewares/errorHandler');

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios
 * @access  Private/Admin
 */
const obtenerUsuarios = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  
  const result = await usuarioService.getUsuarios({ page, limit, search });
  
  const response = {
    usuarios: result.data,
    ...result.pagination
  };
  
  return paginated(res, response, 'Usuarios obtenidos exitosamente');
});

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por ID
 * @access  Private/Admin
 */
const obtenerUsuarioPorId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const usuario = await usuarioService.getUsuarioById(id);
  
  if (!usuario) {
    throw new NotFoundError('Usuario no encontrado');
  }
  
  return success(res, { usuario }, 'Usuario obtenido correctamente');
});

/**
 * @route   POST /api/usuarios
 * @desc    Crear un nuevo usuario
 * @access  Private/Admin
 */
const crearUsuario = asyncHandler(async (req, res) => {
  const { username, email, password, role, active = true } = req.body;
  
  // Validar campos requeridos
  if (!username || !email || !password) {
    throw new ValidationError('Todos los campos son requeridos', {
      username: !username,
      email: !email,
      password: !password
    });
  }
  
  const nuevoUsuario = await usuarioService.createUsuario({
    username,
    email,
    password,
    role: role || 'USER',
    active: active !== undefined ? active : true
  });
  
  const usuarioSinPassword = nuevoUsuario.toJSON();
  delete usuarioSinPassword.password;
  
  return success(res, { usuario: usuarioSinPassword }, 'Usuario creado exitosamente', 201);
});

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar un usuario existente
 * @access  Private/Admin
 */
const actualizarUsuario = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, role, active, password } = req.body;
  
  // Validar que el ID sea un número entero
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    throw new ValidationError('ID de usuario no válido');
  }
  
  const usuarioActualizado = await usuarioService.updateUsuario(id, {
    username: username !== undefined ? username : null,
    email: email !== undefined ? email : null,
    role: role !== undefined ? role : null,
    active: active !== undefined ? active : null,
    password: password !== undefined ? password : null
  });
  
  return success(res, { usuario: usuarioActualizado }, 'Usuario actualizado correctamente');
});

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar un usuario
 * @access  Private/Admin
 */
const eliminarUsuario = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  await usuarioService.deleteUsuario(id, req.user?.id);
  
  return success(res, {}, 'Usuario eliminado correctamente');
});

module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};
