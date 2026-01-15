const { validationResult } = require('express-validator');
const reservaService = require('../services/reserva.service');
const asyncHandler = require('../utils/asyncHandler');
const { success, paginated } = require('../utils/responseHandler');
const { withTransaction } = require('../utils/transactionWrapper');

/**
 * Obtener todas las reservas con paginación y filtros
 */
exports.obtenerReservas = asyncHandler(async (req, res) => {
  const result = await reservaService.getReservas(req.query);
  
  const response = {
    reservas: result.data,
    ...result.pagination
  };
  
  return paginated(res, response, 'Reservas obtenidas exitosamente');
});

/**
 * Obtener una reserva por ID
 */
exports.obtenerReservaPorId = asyncHandler(async (req, res) => {
  const reserva = await reservaService.getReservaById(req.params.id);
  return success(res, { reserva }, 'Reserva obtenida correctamente');
});

/**
 * Crear una nueva reserva
 */
exports.crearReserva = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const reservaId = await withTransaction(async (transaction) => {
    return await reservaService.createReserva(req.body, transaction);
  });

  const reservaCompleta = await reservaService.getReservaById(reservaId);

  return success(res, { reserva: reservaCompleta }, 'Reserva creada exitosamente', 201);
});

/**
 * Actualizar una reserva existente
 */
exports.actualizarReserva = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const reservaId = await withTransaction(async (transaction) => {
    return await reservaService.updateReserva(req.params.id, req.body, transaction);
  });

  const reservaActualizada = await reservaService.getReservaById(reservaId);

  return success(res, { reserva: reservaActualizada }, 'Reserva actualizada exitosamente');
});

/**
 * Eliminar una reserva (borrado lógico)
 */
exports.eliminarReserva = asyncHandler(async (req, res) => {
  await withTransaction(async (transaction) => {
    return await reservaService.deleteReserva(req.params.id, transaction);
  });

  return success(res, {}, 'Reserva eliminada exitosamente');
});

/**
 * Obtener los estados de reserva disponibles
 */
exports.obtenerEstadosReserva = asyncHandler(async (req, res) => {
  const estados = reservaService.getEstadosReserva();
  return success(res, { estados }, 'Estados obtenidos correctamente');
});
