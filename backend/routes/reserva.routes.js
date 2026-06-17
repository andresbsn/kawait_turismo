const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const reservaController = require('../controllers/reserva.controller');
const { validarCampos } = require('../middlewares/validar-campos');
const { authenticateToken, authorize } = require('../middlewares/auth.middleware');
const reservaAdjuntoController = require('../controllers/reservaAdjunto.controller');
const { upload } = require('../middlewares/upload.middleware');

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
  check('clientes', 'Los clientes deben enviarse como lista').optional().isArray(),
  check('clientes.*.id', 'El ID del cliente no es válido').optional({ nullable: true, checkFalsy: true }).isInt(),
  check('clientes.*.nombre', 'El nombre del cliente debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('clientes.*.apellido', 'El apellido del cliente debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('clientes.*.dni', 'El DNI del cliente debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('clientes.*.email', 'El email del cliente debe ser válido').optional({ nullable: true, checkFalsy: true }).isEmail(),
  check('clientes.*.telefono', 'El teléfono del cliente debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('clientes.*.fecha_nacimiento', 'La fecha de nacimiento debe ser válida').optional().isISO8601(),
];

// Validaciones para crear/actualizar reservas
const validarReserva = [
  check('tour_id', 'El ID del tour debe ser un número válido').optional({ nullable: true, checkFalsy: true }).isInt(),
  check('referencia', 'La referencia es obligatoria').optional().isString(),
  check('descripcion', 'La descripción debe ser texto').optional().isString(),
  check('nombre_cliente', 'El nombre del titular debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('apellido_cliente', 'El apellido del titular debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('dni_cliente', 'El DNI del titular debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('email_cliente', 'El email del titular debe ser válido').optional({ nullable: true, checkFalsy: true }).isEmail(),
  check('telefono_cliente', 'El teléfono del titular debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('referencias', 'Las referencias deben ser una lista o un objeto').optional().custom((value) => {
    if (Array.isArray(value) || (value && typeof value === 'object')) {
      return true;
    }
    throw new Error('Formato de referencias inválido');
  }),
  check('referencias.*.tipo', 'El tipo de referencia no es válido').optional().isIn(['terrestre', 'aereo', 'asistencia']),
  check('referencias.*.referencia', 'La referencia debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('referencias.*.titular', 'El titular de la referencia debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('referencias.*.proveedor', 'El proveedor de la referencia debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('referencias.*.descripcion', 'La descripción debe ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('referencias.*.fecha_vencimiento_hotel', 'La fecha de vencimiento debe ser válida').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  check('referencias.*.requisitos_ingresos', 'Los requisitos de ingresos deben ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('referencias.*.condiciones_generales', 'Las condiciones generales deben ser texto').optional({ nullable: true, checkFalsy: true }).isString(),
  check('fecha_reserva', 'La fecha de reserva es obligatoria').not().isEmpty().isISO8601(),
  check('precio_unitario', 'El importe (precio unitario) es obligatorio y debe ser un número mayor o igual a 0').not().isEmpty().isFloat({ min: 0 }),
  check('cantidad_personas', 'La cantidad de personas es obligatoria').isInt({ min: 1 }),
  check('estado', 'El estado no es válido').optional().isIn(['pendiente', 'confirmada', 'cancelada', 'completada']),
  check('monto_seña', 'La seña debe ser un número mayor o igual a 0').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }),
  check('cantidad_cuotas', 'La cantidad de cuotas debe ser un número entero').optional().isInt({ min: 1 }),
  check('tipo_pago', 'El tipo de pago no es válido').optional({ nullable: true, checkFalsy: true }).isIn(['efectivo', 'transferencia', 'tarjeta']),
  check('fecha_pago', 'La fecha de pago debe ser válida').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  // Validar tipos únicos de referencia
  (req, res, next) => {
    const { referencias } = req.body;
    if (Array.isArray(referencias)) {
      const tipos = referencias
        .map((r) => r?.tipo)
        .filter(Boolean);

      const tiposUnicos = new Set(tipos);

      if (referencias.length > 3) {
        return res.status(400).json({
          success: false,
          message: 'Una reserva puede tener como máximo 3 referencias',
        });
      }

      if (tipos.length !== tiposUnicos.size) {
        return res.status(400).json({
          success: false,
          message: 'No se permiten tipos de referencia repetidos',
        });
      }
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

// Rutas para adjuntos
router.post('/:id/adjuntos', upload.single('archivo'), reservaAdjuntoController.uploadAttachment);
router.get('/:id/adjuntos', reservaAdjuntoController.getAttachments);
router.delete('/:id/adjuntos/:adjuntoId', reservaAdjuntoController.deleteAttachment);
router.get('/:id/adjuntos/:adjuntoId/download', reservaAdjuntoController.downloadAttachment);

module.exports = router;
