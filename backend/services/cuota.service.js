const BaseService = require('./BaseService');
const { Cuota, CuentaCorriente, Pago } = require('../models').sequelize.models;
const { NotFoundError, ValidationError, ConflictError } = require('../middlewares/errorHandler');

const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'deposito', 'cheque', 'echq', 'otro'];

const buildNumeroComprobante = (correlativo) => {
  return `REC-${String(correlativo).padStart(6, '0')}`;
};

class CuotaService extends BaseService {
  constructor() {
    super(Cuota, 'Cuota');
  }

  /**
   * Registrar un pago de cuota
   */
  async registrarPago(cuotaId, data, usuarioId, transaction) {
    const { monto_pagado, metodo_pago, observaciones, extra } = data;

    // Validar método de pago
    if (!METODOS_PAGO.includes(metodo_pago)) {
      throw new ValidationError(`Método de pago no válido. Debe ser uno de: ${METODOS_PAGO.join(', ')}`);
    }

    const cuota = await Cuota.findByPk(cuotaId, {
      include: [{
        model: CuentaCorriente,
        as: 'cuenta_corriente'
      }],
      transaction
    });

    if (!cuota) {
      throw new NotFoundError('Cuota no encontrada');
    }

    // Enforce 1 pago = 1 cuota
    const pagoExistente = await Pago.findOne({
      where: { cuota_id: cuota.id },
      transaction
    });

    if (pagoExistente) {
      throw new ConflictError('Esta cuota ya tiene un pago registrado');
    }

    // Validar que el monto pagado no sea mayor al saldo pendiente
    const saldoPendiente = parseFloat(cuota.monto) - parseFloat(cuota.monto_pagado || 0);
    if (monto_pagado > saldoPendiente) {
      throw new ValidationError(`El monto pagado no puede ser mayor al saldo pendiente: ${saldoPendiente}`);
    }

    // Validación mínima de extra para cheque/echq
    if ((metodo_pago === 'cheque' || metodo_pago === 'echq') && extra && typeof extra !== 'object') {
      throw new ValidationError('El campo extra debe ser un objeto JSON');
    }

    // Actualizar la cuota
    const nuevoMontoPagado = parseFloat(cuota.monto_pagado || 0) + parseFloat(monto_pagado);
    let nuevoEstado = cuota.estado;

    if (nuevoMontoPagado >= cuota.monto) {
      nuevoEstado = 'pagada_total';
    } else if (nuevoMontoPagado > 0) {
      nuevoEstado = 'pagada_parcial';
    }

    await cuota.update({
      monto_pagado: nuevoMontoPagado,
      estado: nuevoEstado,
      metodo_pago: metodo_pago || cuota.metodo_pago,
      observaciones: observaciones || cuota.observaciones,
      fecha_pago: new Date()
    }, { transaction });

    // Actualizar el saldo pendiente en la cuenta corriente
    const cuenta = cuota.cuenta_corriente;
    const nuevoSaldo = parseFloat(cuenta.saldo_pendiente || 0) - parseFloat(monto_pagado);
    let nuevoEstadoCuenta = cuenta.estado;

    if (nuevoSaldo <= 0) {
      nuevoEstadoCuenta = 'pagado';
    } else if (nuevoSaldo < cuenta.monto_total) {
      nuevoEstadoCuenta = 'en_proceso';
    }

    await cuenta.update({
      saldo_pendiente: nuevoSaldo,
      estado: nuevoEstadoCuenta
    }, { transaction });

    // Calcular correlativo y crear Pago
    const maxCorrelativo = await Pago.max('correlativo', { transaction });
    const correlativo = (maxCorrelativo || 0) + 1;

    const pago = await Pago.create({
      correlativo,
      numero_comprobante: buildNumeroComprobante(correlativo),
      cuenta_corriente_id: cuenta.id,
      cuota_id: cuota.id,
      cliente_id: cuenta.cliente_id,
      usuario_id: usuarioId || null,
      monto: parseFloat(monto_pagado),
      metodo_pago,
      fecha_pago: new Date(),
      observaciones: observaciones || null,
      extra: extra || null,
      fecha_creacion: new Date()
    }, { transaction });

    return { pago, cuotaId };
  }

  /**
   * Registrar una entrega libre (sin cuota) sobre una cuenta corriente sin cuotas
   */
  async registrarEntrega(cuentaCorrienteId, data, usuarioId, transaction, file) {
    const { monto, metodo_pago, observaciones } = data;
    let { extra } = data;

    // Si extra viene como string (desde FormData), parsearlo
    if (typeof extra === 'string') {
      try { extra = JSON.parse(extra); } catch (e) { extra = null; }
    }

    // Validar método de pago
    if (!METODOS_PAGO.includes(metodo_pago)) {
      throw new ValidationError(`Método de pago no válido. Debe ser uno de: ${METODOS_PAGO.join(', ')}`);
    }

    const cuenta = await CuentaCorriente.findByPk(cuentaCorrienteId, { transaction });

    if (!cuenta) {
      throw new NotFoundError('Cuenta corriente no encontrada');
    }

    // Validar que la cuenta sea modalidad sin cuotas
    if (cuenta.cantidad_cuotas > 0) {
      throw new ValidationError('Esta cuenta corriente tiene cuotas. Use el registro de pago por cuota.');
    }

    const saldoPendiente = parseFloat(cuenta.saldo_pendiente || 0);
    if (parseFloat(monto) > saldoPendiente) {
      throw new ValidationError(`El monto de la entrega ($${monto}) no puede ser mayor al saldo pendiente ($${saldoPendiente})`);
    }

    if (parseFloat(monto) <= 0) {
      throw new ValidationError('El monto debe ser mayor a 0');
    }

    // Validación de extra para cheque/echq
    if ((metodo_pago === 'cheque' || metodo_pago === 'echq') && extra && typeof extra !== 'object') {
      throw new ValidationError('El campo extra debe ser un objeto JSON');
    }

    // Actualizar saldo de la cuenta corriente
    const nuevoSaldo = saldoPendiente - parseFloat(monto);
    let nuevoEstado = cuenta.estado;

    if (nuevoSaldo <= 0) {
      nuevoEstado = 'pagado';
    } else if (nuevoSaldo < parseFloat(cuenta.monto_total)) {
      nuevoEstado = 'en_proceso';
    }

    await cuenta.update({
      saldo_pendiente: nuevoSaldo,
      estado: nuevoEstado
    }, { transaction });

    // Calcular correlativo y crear Pago (sin cuota_id)
    const maxCorrelativo = await Pago.max('correlativo', { transaction });
    const correlativo = (maxCorrelativo || 0) + 1;

    // Ruta del comprobante de transferencia (si se adjuntó archivo)
    let comprobanteTransferencia = null;
    if (file && metodo_pago === 'transferencia') {
      comprobanteTransferencia = `comprobantes/${file.filename}`;
    }

    const pago = await Pago.create({
      correlativo,
      numero_comprobante: buildNumeroComprobante(correlativo),
      cuenta_corriente_id: cuenta.id,
      cuota_id: null,
      cliente_id: cuenta.cliente_id,
      usuario_id: usuarioId || null,
      monto: parseFloat(monto),
      metodo_pago,
      fecha_pago: new Date(),
      observaciones: observaciones || null,
      extra: extra || null,
      comprobante_transferencia: comprobanteTransferencia,
      fecha_creacion: new Date()
    }, { transaction });

    return { pago, cuentaCorrienteId };
  }

  /**
   * Actualizar una cuota
   */
  async actualizarCuota(cuotaId, data, transaction) {
    const { fecha_vencimiento, monto, estado, observaciones } = data;

    const cuota = await Cuota.findByPk(cuotaId, {
      include: [{
        model: CuentaCorriente,
        as: 'cuenta_corriente'
      }],
      transaction
    });

    if (!cuota) {
      throw new NotFoundError('Cuota no encontrada');
    }

    // Validar que el estado sea válido
    const estadosPermitidos = ['pendiente', 'pagada_parcial', 'pagada_total', 'vencida', 'cancelada'];
    if (estado && !estadosPermitidos.includes(estado)) {
      throw new ValidationError(`Estado no válido. Los estados permitidos son: ${estadosPermitidos.join(', ')}`);
    }

    // Actualizar la cuota
    await cuota.update({
      fecha_vencimiento: fecha_vencimiento || cuota.fecha_vencimiento,
      monto: monto || cuota.monto,
      estado: estado || cuota.estado,
      observaciones: observaciones || cuota.observaciones
    }, { transaction });

    // Si se actualizó el monto, recalcular el monto total en la cuenta corriente
    if (monto && monto !== cuota.monto) {
      const cuenta = cuota.cuenta_corriente;
      const cuotas = await Cuota.findAll({
        where: { cuenta_corriente_id: cuenta.id },
        transaction
      });

      const montoTotal = cuotas.reduce((sum, c) => sum + parseFloat(c.monto), 0);
      const montoPagado = cuotas.reduce((sum, c) => sum + (parseFloat(c.monto_pagado) || 0), 0);
      const saldoPendiente = montoTotal - montoPagado;

      await cuenta.update({
        monto_total: montoTotal,
        saldo_pendiente: saldoPendiente
      }, { transaction });
    }

    return cuotaId;
  }

  /**
   * Obtener cuota con detalles completos
   */
  async getCuotaConDetalles(cuotaId) {
    return await Cuota.findByPk(cuotaId, {
      include: [{
        model: CuentaCorriente,
        as: 'cuenta_corriente',
        include: ['reserva', 'cliente']
      }]
    });
  }
}

module.exports = new CuotaService();
