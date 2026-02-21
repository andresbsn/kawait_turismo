const cuotaService = require('../services/cuota.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/responseHandler');
const { withTransaction } = require('../utils/transactionWrapper');

// Registrar un pago de cuota
exports.registrarPago = asyncHandler(async (req, res) => {
  const resultado = await withTransaction(async (transaction) => {
    return await cuotaService.registrarPago(
      req.params.id,
      req.body,
      req.usuario?.id,
      transaction
    );
  });

  const cuotaActualizada = await cuotaService.getCuotaConDetalles(resultado.cuotaId);

  return success(res, { pago: resultado.pago, cuota: cuotaActualizada }, 'Pago registrado correctamente');
});

// Actualizar una cuota
exports.actualizarCuota = asyncHandler(async (req, res) => {
  const cuotaId = await withTransaction(async (transaction) => {
    return await cuotaService.actualizarCuota(req.params.id, req.body, transaction);
  });

  const cuotaActualizada = await cuotaService.getCuotaConDetalles(cuotaId);

  return success(res, { cuota: cuotaActualizada }, 'Cuota actualizada correctamente');
});

// Registrar una entrega libre (sin cuota) sobre una cuenta corriente
exports.registrarEntrega = asyncHandler(async (req, res) => {
  const resultado = await withTransaction(async (transaction) => {
    return await cuotaService.registrarEntrega(
      req.params.cuentaId,
      req.body,
      req.usuario?.id,
      transaction,
      req.file // archivo del comprobante de transferencia
    );
  });

  return success(res, { pago: resultado.pago }, 'Entrega registrada correctamente');
});