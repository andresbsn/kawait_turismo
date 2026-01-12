const { Op } = require('sequelize');
const db = require('../models');
const { Cuota, CuentaCorriente, Pago } = db.sequelize.models;

const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'deposito', 'cheque', 'echq', 'otro'];

const buildNumeroComprobante = (correlativo) => {
  return `REC-${String(correlativo).padStart(6, '0')}`;
};

// Registrar un pago de cuota
exports.registrarPago = async (req, res) => {
  const t = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { monto_pagado, metodo_pago, observaciones, extra } = req.body;

    if (!METODOS_PAGO.includes(metodo_pago)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Método de pago no válido. Debe ser uno de: ${METODOS_PAGO.join(', ')}`
      });
    }
    
    const cuota = await Cuota.findByPk(id, { 
      include: [{
        model: CuentaCorriente,
        as: 'cuenta_corriente'
      }],
      transaction: t
    });
    
    if (!cuota) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cuota no encontrada'
      });
    }

    // Enforce 1 pago = 1 cuota
    const pagoExistente = await Pago.findOne({
      where: { cuota_id: cuota.id },
      transaction: t
    });
    if (pagoExistente) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Esta cuota ya tiene un pago registrado'
      });
    }
    
    // Validar que el monto pagado no sea mayor al saldo pendiente
    const saldoPendiente = parseFloat(cuota.monto) - parseFloat(cuota.monto_pagado || 0);
    if (monto_pagado > saldoPendiente) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `El monto pagado no puede ser mayor al saldo pendiente: ${saldoPendiente}`
      });
    }

    // Validación mínima de extra para cheque/echq
    if ((metodo_pago === 'cheque' || metodo_pago === 'echq') && extra && typeof extra !== 'object') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'El campo extra debe ser un objeto JSON'
      });
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
    }, { transaction: t });
    
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
    }, { transaction: t });

    // Calcular correlativo y crear Pago
    const maxCorrelativo = await Pago.max('correlativo', { transaction: t });
    const correlativo = (maxCorrelativo || 0) + 1;

    const pago = await Pago.create({
      correlativo,
      numero_comprobante: buildNumeroComprobante(correlativo),
      cuenta_corriente_id: cuenta.id,
      cuota_id: cuota.id,
      cliente_id: cuenta.cliente_id,
      usuario_id: req.usuario?.id || null,
      monto: parseFloat(monto_pagado),
      metodo_pago,
      fecha_pago: new Date(),
      observaciones: observaciones || null,
      extra: extra || null,
      fecha_creacion: new Date()
    }, { transaction: t });
    
    await t.commit();
    
    res.json({
      success: true,
      message: 'Pago registrado correctamente',
      pago,
      cuota: await Cuota.findByPk(id, {
        include: [{
          model: CuentaCorriente,
          as: 'cuenta_corriente',
          include: ['reserva', 'cliente']
        }]
      })
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al registrar el pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el pago',
      error: error.message
    });
  }
};

// Actualizar una cuota
exports.actualizarCuota = async (req, res) => {
  const t = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { fecha_vencimiento, monto, estado, observaciones } = req.body;
    
    const cuota = await Cuota.findByPk(id, { 
      include: [{
        model: CuentaCorriente,
        as: 'cuenta_corriente'
      }],
      transaction: t
    });
    
    if (!cuota) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cuota no encontrada'
      });
    }
    
    // Validar que el estado sea válido
    const estadosPermitidos = ['pendiente', 'pagada_parcial', 'pagada_total', 'vencida', 'cancelada'];
    if (estado && !estadosPermitidos.includes(estado)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Estado no válido. Los estados permitidos son: ${estadosPermitidos.join(', ')}`
      });
    }
    
    // Actualizar la cuota
    await cuota.update({
      fecha_vencimiento: fecha_vencimiento || cuota.fecha_vencimiento,
      monto: monto || cuota.monto,
      estado: estado || cuota.estado,
      observaciones: observaciones || cuota.observaciones
    }, { transaction: t });
    
    // Si se actualizó el monto, recalcular el monto total en la cuenta corriente
    if (monto && monto !== cuota.monto) {
      const cuenta = cuota.cuenta_corriente;
      const cuotas = await Cuota.findAll({
        where: { cuenta_corriente_id: cuenta.id },
        transaction: t
      });
      
      const montoTotal = cuotas.reduce((sum, c) => sum + parseFloat(c.monto), 0);
      const montoPagado = cuotas.reduce((sum, c) => sum + (parseFloat(c.monto_pagado) || 0), 0);
      const saldoPendiente = montoTotal - montoPagado;
      
      await cuenta.update({
        monto_total: montoTotal,
        saldo_pendiente: saldoPendiente
      }, { transaction: t });
    }
    
    await t.commit();
    
    res.json({
      success: true,
      message: 'Cuota actualizada correctamente',
      cuota: await Cuota.findByPk(id, {
        include: [{
          model: CuentaCorriente,
          as: 'cuenta_corriente',
          include: ['reserva', 'cliente']
        }]
      })
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar la cuota:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la cuota',
      error: error.message
    });
  }
};