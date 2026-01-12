const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const reservaController = require('../controllers/reserva.controller');
const { validarCampos } = require('../middlewares/validar-campos');
const { authenticateToken, authorize } = require('../middlewares/auth.middleware');

const ensureHandler = (handlerName) => {
  const handler = reservaController?.[handlerName];
  if (typeof handler !== 'function') {
    return (req, res) => {
      return res.status(500).json({
        success: false,
        message: `Handler no implementado: reservaController.${handlerName}`,
      });
    };
  }

  return handler;
};

// Middleware para validar el token JWT
router.use(authenticateToken);

// Validaciones para clientes
const validarCliente = [
  check('clientes', 'Debe proporcionar al menos un cliente').isArray({ min: 1 }),
  check('clientes.*.id', 'El ID del cliente no es válido').optional({ nullable: true, checkFalsy: true }).isInt(),
  check('clientes.*.nombre', 'El nombre del cliente es obligatorio').not().isEmpty(),
  check('clientes.*.apellido', 'El apellido del cliente es obligatorio').not().isEmpty(),
  check('clientes.*.dni', 'El DNI del cliente debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('clientes.*.email', 'El email del cliente debe ser válido').optional({ nullable: true, checkFalsy: true }).isEmail(),
  check('clientes.*.telefono', 'El teléfono del cliente debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('clientes.*.fecha_nacimiento', 'La fecha de nacimiento debe ser válida').optional().isISO8601(),
  (req, res, next) => {
    const { clientes } = req.body;
    if (Array.isArray(clientes)) {
      for (let i = 0; i < clientes.length; i++) {
        const c = clientes[i] || {};
        const hasId = c.id !== undefined && c.id !== null && String(c.id).trim() !== '';
        const hasDni = c.dni !== undefined && c.dni !== null && String(c.dni).trim() !== '';
        if (!hasId && !hasDni) {
          return res.status(400).json({
            success: false,
            message: `El DNI del cliente es obligatorio cuando no se proporciona el ID (clientes[${i}])`
          });
        }
      }
    }
    next();
  },
];

// Validaciones para crear/actualizar reservas
const validarReserva = [
  check('tour_id', 'El ID del tour debe ser un número válido').optional({ nullable: true, checkFalsy: true }).isInt(),
  check('referencia', 'La referencia es obligatoria').optional().isString(),
  check('descripcion', 'La descripción debe ser texto').optional().isString(),
  check('fecha_reserva', 'La fecha de reserva es obligatoria').not().isEmpty().isISO8601(),
  check('cantidad_personas', 'La cantidad de personas es obligatoria').isInt({ min: 1 }),
  check('estado', 'El estado no es válido').optional().isIn(['pendiente', 'confirmada', 'cancelada', 'completada']),
  check('monto_seña', 'La seña debe ser un número mayor o igual a 0').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),
  check('cantidad_cuotas', 'La cantidad de cuotas debe ser un número entero').optional().isInt({ min: 1 }),
  check('tipo_pago', 'El tipo de pago no es válido').optional({ nullable: true, checkFalsy: true }).isIn(['efectivo', 'transferencia', 'tarjeta']),
  check('fecha_pago', 'La fecha de pago debe ser válida').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  // Validar que la cantidad de clientes coincida con cantidad_personas
  (req, res, next) => {
    const { clientes, cantidad_personas } = req.body;
    if (clientes && clientes.length !== cantidad_personas) {
      return res.status(400).json({
        success: false,
        message: `La cantidad de clientes (${clientes.length}) no coincide con la cantidad de personas (${cantidad_personas})`
      });
    }
    next();
  },
  validarCampos,
];

// Obtener todas las reservas (con paginación y filtros)
router.get('/', [
  check('page', 'La página debe ser un número entero mayor a 0').optional().isInt({ min: 1 }),
  check('limit', 'El límite debe ser un número entero mayor a 0').optional().isInt({ min: 1 }),
  validarCampos,
], ensureHandler('obtenerReservas'));

// Obtener los estados de reserva disponibles
router.get('/estados/lista', ensureHandler('obtenerEstadosReserva'));

// Obtener una reserva por ID
router.get('/:id', [
  check('id', 'El ID de la reserva no es válido').isInt(),
  validarCampos,
], ensureHandler('obtenerReservaPorId'));

// Crear una nueva reserva
router.post('/', [
  ...validarCliente,
  ...validarReserva,
  // Solo administradores pueden crear reservas con estado diferente a 'pendiente'
  (req, res, next) => {
    if (req.body.estado && req.body.estado !== 'pendiente' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para crear reservas con este estado',
      });
    }
    next();
  },
], ensureHandler('crearReserva'));

// Actualizar una reserva existente
router.put('/:id', [
  check('id', 'El ID de la reserva no es válido').isInt(),
  ...validarCliente,
  ...validarReserva,
  // Solo administradores pueden cambiar el estado de las reservas
  (req, res, next) => {
    if (req.body.estado && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para cambiar el estado de la reserva',
      });
    }
    next();
  },
], ensureHandler('actualizarReserva'));

// Eliminar una reserva (borrado lógico)
router.delete('/:id', [
  check('id', 'El ID de la reserva no es válido').isInt(),
  validarCampos,
  (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar reservas',
      });
    }
    next();
  }
], ensureHandler('eliminarReserva'));

module.exports = router;
