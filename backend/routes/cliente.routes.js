// backend/routes/cliente.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate, authorize } = require('../middlewares/auth.middleware');
const clienteController = require('../controllers/cliente.controller');

// Middleware de autenticación para todas las rutas
router.use(authenticate);

/**
 * @route   GET /api/clientes
 * @desc    Obtener todos los clientes (con paginación y búsqueda)
 * @access  Private/Admin,Staff
 */
router.get('/', authorize(['ADMIN', 'STAFF']), clienteController.obtenerClientes);

/**
 * @route   GET /api/clientes/buscar
 * @desc    Buscar clientes por término de búsqueda (para autocompletado)
 * @access  Private/Admin,Staff
 */
router.get('/buscar', authorize(['ADMIN', 'STAFF']), clienteController.buscarClientes);

/**
 * @route   GET /api/clientes/:id
 * @desc    Obtener un cliente por ID
 * @access  Private/Admin,Staff
 */
router.get('/:id', authorize(['ADMIN', 'STAFF']), clienteController.obtenerClientePorId);

/**
 * @route   POST /api/clientes
 * @desc    Crear un nuevo cliente
 * @access  Private/Admin,Staff
 */
router.post('/', authorize(['ADMIN', 'STAFF']), clienteController.crearCliente);

/**
 * @route   PUT /api/clientes/:id
 * @desc    Actualizar un cliente existente
 * @access  Private/Admin,Staff
 */
router.put('/:id', authorize(['ADMIN', 'STAFF']), clienteController.actualizarCliente);

/**
 * @route   DELETE /api/clientes/:id
 * @desc    Eliminar un cliente
 * @access  Private/Admin
 */
router.delete('/:id', authorize(['ADMIN']), clienteController.eliminarCliente);

module.exports = router;
