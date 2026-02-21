const cuentaCorrienteService = require('../services/cuentaCorriente.service');
const asyncHandler = require('../utils/asyncHandler');
const { success, paginated } = require('../utils/responseHandler');
const { withTransaction } = require('../utils/transactionWrapper');

// Obtener todas las cuentas corrientes con paginación
exports.obtenerCuentasCorrientes = asyncHandler(async (req, res) => {
  const result = await cuentaCorrienteService.getCuentasCorrientes(req.query);

  const response = {
    cuentas: result.data,
    ...result.pagination
  };

  return paginated(res, response, 'Cuentas corrientes obtenidas exitosamente');
});

// Obtener cuentas corrientes del usuario autenticado (solo lectura)
exports.obtenerMisCuentas = asyncHandler(async (req, res) => {
  const resultado = await cuentaCorrienteService.getMisCuentas(req.usuario?.email);
  return success(res, resultado, 'Cuentas obtenidas exitosamente');
});

// Obtener una cuenta corriente por ID
exports.obtenerCuentaCorriente = asyncHandler(async (req, res) => {
  const cuenta = await cuentaCorrienteService.getCuentaCorrienteById(req.params.id);
  return success(res, { cuenta }, 'Cuenta corriente obtenida exitosamente');
});

// Actualizar el estado de una cuenta corriente
exports.actualizarEstadoCuenta = asyncHandler(async (req, res) => {
  const cuenta = await withTransaction(async (transaction) => {
    return await cuentaCorrienteService.actualizarEstado(
      req.params.id,
      req.body.estado,
      transaction
    );
  });

  return success(res, { cuenta }, 'Estado de la cuenta actualizado correctamente');
});

// Obtener cuentas corrientes por cliente
exports.obtenerCuentasPorCliente = asyncHandler(async (req, res) => {
  const cuentas = await cuentaCorrienteService.getCuentasPorCliente(req.params.clienteId);
  return success(res, { cuentas }, 'Cuentas del cliente obtenidas exitosamente');
});

// Obtener pagos (entregas) de una cuenta corriente
exports.obtenerPagosCuenta = asyncHandler(async (req, res) => {
  const db = require('../models');
  const Pago = db.sequelize.models.Pago;

  const pagos = await Pago.findAll({
    where: { cuenta_corriente_id: req.params.id },
    order: [['fecha_pago', 'DESC']]
  });

  return success(res, { pagos }, 'Pagos obtenidos exitosamente');
});

// Descargar/ver comprobante de transferencia de un pago
exports.descargarComprobante = asyncHandler(async (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const db = require('../models');
  const Pago = db.sequelize.models.Pago;

  const pago = await Pago.findByPk(req.params.pagoId);
  if (!pago || !pago.comprobante_transferencia) {
    return res.status(404).json({ success: false, message: 'Comprobante no encontrado' });
  }

  const filePath = path.join(__dirname, '../uploads', pago.comprobante_transferencia);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Archivo de comprobante no encontrado en disco' });
  }

  res.sendFile(filePath);
});