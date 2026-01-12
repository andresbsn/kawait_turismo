// backend/routes/tour.routes.js
const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { authenticateToken, authorize } = require('../middlewares/auth.middleware');
const {
  obtenerTours,
  obtenerTourPorId,
  crearTour,
  actualizarTour,
  eliminarTour
} = require('../controllers/tour.controller');

// Middleware de validación para crear un tour
const validarCrearTour = [
  check('nombre', 'El nombre es obligatorio').not().isEmpty().trim(),
  check('destino', 'El destino es obligatorio').not().isEmpty().trim(),
  check('fechaInicio', 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .toDate(),
  check('fechaFin', 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .toDate(),
  check('precio', 'El precio debe ser un número mayor o igual a 0')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .toFloat(),
  check('cupoMaximo', 'El cupo máximo debe ser un número entero mayor a 0')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .toInt(),
  check('descripcion')
    .optional({ nullable: true })
    .trim()
];

// Middleware de validación para actualizar un tour (más flexible)
const validarActualizarTour = [
  check('nombre', 'El nombre es obligatorio')
    .optional()
    .notEmpty()
    .trim(),
  check('destino', 'El destino es obligatorio')
    .optional()
    .notEmpty()
    .trim(),
  check('fechaInicio', 'La fecha de inicio debe ser una fecha válida (YYYY-MM-DD)')
    .optional()
    .isISO8601()
    .toDate(),
  check('fechaFin', 'La fecha de fin debe ser una fecha válida (YYYY-MM-DD)')
    .optional()
    .isISO8601()
    .toDate(),
  check('precio', 'El precio debe ser un número mayor o igual a 0')
    .optional()
    .isFloat({ min: 0 })
    .toFloat(),
  check('cupoMaximo', 'El cupo máximo debe ser un número entero mayor a 0')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  check('descripcion')
    .optional()
    .trim(),
  check('estado')
    .optional()
    .isIn(['disponible', 'completo', 'cancelado']),
  check('activo')
    .optional()
    .isBoolean()
    .toBoolean()
];

// Rutas públicas (sin autenticación)
router.get('/', obtenerTours);
router.get('/:id', obtenerTourPorId);

// Rutas protegidas que requieren autenticación y autorización
// Ruta para crear un nuevo tour
router.post(
  '/',
  [
    authenticateToken,
    authorize(['ADMIN']),
    ...validarCrearTour
  ],
  crearTour
);

// Ruta para actualizar un tour existente
router.put(
  '/:id',
  [
    authenticateToken,
    authorize(['ADMIN']),
    ...validarActualizarTour
  ],
  actualizarTour
);

router.delete(
  '/:id',
  [
    authenticateToken,
    authorize(['ADMIN'])
  ],
  eliminarTour
);

module.exports = router;
