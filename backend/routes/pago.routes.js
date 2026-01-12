const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const pagoController = require('../controllers/pago.controller');
const { checkAuth, checkRol } = require('../middleware/auth');
const { validarCampos } = require('../middleware/validar-campos');

// Validaciones para el registro de pagos
const validarPago = [
  check('monto', 'El monto es obligatorio y debe ser un número mayor a 0').isFloat({ min: 0.01 }),
  check('metodo_pago', 'El método de pago es obligatorio').isIn([
    'efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'deposito', 'cheque', 'echq', 'otro'
  ]),
  check('fecha_pago', 'La fecha de pago debe ser una fecha válida').optional().isISO8601(),
  check('observaciones', 'Las observaciones deben ser texto').optional().isString(),
  check('cliente_id', 'El ID del cliente debe ser un número entero').optional().isInt(),
  check('cuotas_ids', 'Los IDs de las cuotas deben ser un array').optional().isArray(),
  check('cuotas_ids.*', 'Cada ID de cuota debe ser un número entero').optional().isInt(),
  validarCampos
];

// Validaciones para filtros de historial
const validarFiltrosHistorial = [
  check('fechaInicio', 'La fecha de inicio debe ser una fecha válida').optional().isISO8601(),
  check('fechaFin', 'La fecha de fin debe ser una fecha válida').optional().isISO8601(),
  check('clienteId', 'El ID del cliente debe ser un número entero').optional().isInt(),
  validarCampos
];

// Middleware para verificar permisos de administrador
const esAdmin = checkRol(['ADMIN']);

/**
 * @swagger
 * /api/pagos/reserva/{reservaId}:
 *   post:
 *     summary: Registra un pago para una reserva
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - monto
 *               - metodo_pago
 *             properties:
 *               monto:
 *                 type: number
 *                 description: Monto del pago
 *               metodo_pago:
 *                 type: string
 *                 enum: [efectivo, transferencia, tarjeta_credito, tarjeta_debito, deposito, otro]
 *               fecha_pago:
 *                 type: string
 *                 format: date-time
 *               observaciones:
 *                 type: string
 *               cliente_id:
 *                 type: integer
 *                 description: ID del cliente al que se aplica el pago (opcional)
 *               cuotas_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs de las cuotas específicas a las que se aplica el pago
 */
router.post(
  '/reserva/:reservaId', 
  [checkAuth, ...validarPago], 
  pagoController.registrarPagoReserva
);

/**
 * @swagger
 * /api/pagos/reserva/{reservaId}/resumen:
 *   get:
 *     summary: Obtiene el resumen de pagos de una reserva
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 */
router.get(
  '/reserva/:reservaId/resumen', 
  checkAuth, 
  pagoController.obtenerResumenPagos
);

/**
 * @swagger
 * /api/pagos/reserva/{reservaId}/historial:
 *   get:
 *     summary: Obtiene el historial de pagos de una reserva
 *     tags: [Pagos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para filtrar (opcional)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para filtrar (opcional)
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: integer
 *         description: ID del cliente para filtrar (opcional)
 */
router.get(
  '/reserva/:reservaId/historial', 
  [checkAuth, ...validarFiltrosHistorial], 
  pagoController.obtenerHistorialPagos
);

// Ruta para generar un comprobante de pago (solo administradores)
router.get(
  '/comprobante/:pagoId', 
  [checkAuth], 
  pagoController.generarComprobantePago
);

module.exports = router;
