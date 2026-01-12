// routes/usuario.routes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const { authenticateToken, authorize } = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Middleware para verificar si el usuario es admin o está accediendo a su propia información
const isAdminOrSelf = (req, res, next) => {
  // Si es administrador, permitir acceso
  if (req.user.role?.toUpperCase() === 'ADMIN') {
    return next();
  }
  
  // Si está intentando acceder a su propia información, permitir acceso
  if (req.params.id && req.params.id === req.user.id.toString()) {
    return next();
  }
  
  // Si no cumple ninguna condición, denegar acceso
  res.status(403).json({
    success: false,
    message: 'No tienes permiso para acceder a este recurso',
    code: 'UNAUTHORIZED',
    requiredRole: 'ADMIN',
    userRole: req.user.role
  });
};

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios (con paginación y búsqueda)
 * @query   page - Número de página (opcional, default: 1)
 * @query   limit - Cantidad de resultados por página (opcional, default: 10)
 * @query   search - Término de búsqueda (opcional)
 * @access  Private/Admin
 */
// Solo administradores pueden listar todos los usuarios
router.get('/', authorize('admin'), usuarioController.obtenerUsuarios);

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por ID
 * @access  Private/Admin
 */
// Usuarios pueden ver su propia información, administradores pueden ver cualquier usuario
router.get('/:id', isAdminOrSelf, usuarioController.obtenerUsuarioPorId);

/**
 * @route   POST /api/usuarios
 * @desc    Crear un nuevo usuario
 * @access  Private/Admin
 * @body    {string} nombre - Nombre completo del usuario
 * @body    {string} email - Correo electrónico
 * @body    {string} password - Contraseña
 * @body    {string} [rol=USER] - Rol del usuario (ADMIN, USER, etc.)
 */
// Solo administradores pueden crear usuarios
router.post('/', authorize('admin'), usuarioController.crearUsuario);

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualizar un usuario existente
 * @access  Private/Admin
 * @body    {string} [nombre] - Nuevo nombre
 * @body    {string} [email] - Nuevo correo electrónico
 * @body    {string} [rol] - Nuevo rol
 * @body    {string} [estado] - Nuevo estado (activo/inactivo)
 */
// Usuarios pueden actualizar su propia información, administradores pueden actualizar cualquier usuario
router.put('/:id', isAdminOrSelf, usuarioController.actualizarUsuario);

/**
 * @route   DELETE /api/usuarios/:id
 * @desc    Eliminar un usuario
 * @access  Private/Admin
 */
// Solo administradores pueden eliminar usuarios
router.delete('/:id', authorize('admin'), usuarioController.eliminarUsuario);

module.exports = router;
