const express = require('express');
const router = express.Router();
const gastoController = require('../controllers/gasto.controller');
const { authenticateToken: authenticate, authorize } = require('../middlewares/auth.middleware');

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate);

// GET /api/gastos — Listar gastos con filtros
router.get('/', authorize(['ADMIN']), gastoController.obtenerGastos);

// GET /api/gastos/resumen — Resumen de gastos
router.get('/resumen', authorize(['ADMIN']), gastoController.obtenerResumen);

// GET /api/gastos/:id — Obtener gasto por ID
router.get('/:id', authorize(['ADMIN']), gastoController.obtenerGasto);

// POST /api/gastos — Crear gasto
router.post('/', authorize(['ADMIN']), gastoController.crearGasto);

// PUT /api/gastos/:id — Actualizar gasto
router.put('/:id', authorize(['ADMIN']), gastoController.actualizarGasto);

// PATCH /api/gastos/:id/pagar — Marcar como pagado
router.patch('/:id/pagar', authorize(['ADMIN']), gastoController.marcarPagado);

// DELETE /api/gastos/:id — Eliminar gasto
router.delete('/:id', authorize(['ADMIN']), gastoController.eliminarGasto);

module.exports = router;
