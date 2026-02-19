const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const { Reserva, CuentaCorriente, Cuota, Cliente } = db.sequelize.models;
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/responseHandler');
const { withTransaction } = require('../utils/transactionWrapper');
const { NotFoundError, ValidationError } = require('../middlewares/errorHandler');

// Tipos de pago permitidos
const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'deposito', 'otro'];

/**
 * Registra un pago para una reserva y actualiza las cuentas corrientes de los clientes
 */
exports.registrarPagoReserva = asyncHandler(async (req, res) => {
  const { reservaId } = req.params;
  const {
    monto,
    metodo_pago,
    fecha_pago = new Date(),
    observaciones = '',
    cliente_id,
    cuotas_ids = []
  } = req.body;

  // Validar método de pago
  if (!METODOS_PAGO.includes(metodo_pago)) {
    throw new ValidationError(`Método de pago no válido. Debe ser uno de: ${METODOS_PAGO.join(', ')}`);
  }

  const resultado = await withTransaction(async (transaction) => {
    // 1. Obtener la reserva con sus cuentas corrientes y clientes
    const reserva = await Reserva.findByPk(reservaId, {
      include: [
        {
          model: CuentaCorriente,
          as: 'cuentas_corrientes',
          include: [
            {
              model: Cuota,
              as: 'cuotas',
              where: {
                estado: { [Op.ne]: 'pagado' }
              },
              required: false
            },
            {
              model: Cliente,
              as: 'cliente',
              attributes: ['id', 'nombre', 'apellido']
            }
          ]
        }
      ],
      transaction
    });

    if (!reserva) {
      throw new NotFoundError('Reserva no encontrada');
    }

    // 2. Verificar que la reserva tenga cuentas corrientes
    if (!reserva.cuentas_corrientes || reserva.cuentas_corrientes.length === 0) {
      throw new ValidationError('La reserva no tiene cuentas corrientes asociadas');
    }

    // 3. Aplicar el pago a las cuentas corrientes
    const resultadosPago = [];
    let montoRestante = parseFloat(monto);

    // Si se especificó un cliente, aplicar el pago solo a sus cuentas
    const cuentasAAplicar = cliente_id
      ? reserva.cuentas_corrientes.filter(cc => cc.cliente_id === parseInt(cliente_id))
      : reserva.cuentas_corrientes;

    if (cuentasAAplicar.length === 0) {
      throw new ValidationError('No se encontraron cuentas corrientes para el cliente especificado');
    }

    // Aplicar el pago a cada cuenta
    for (const cuenta of cuentasAAplicar) {
      if (montoRestante <= 0) break;

      // Si hay cuotas específicas, filtrar solo las de esta cuenta
      const cuotasPendientes = cuotas_ids.length > 0
        ? cuenta.cuotas.filter(c => cuotas_ids.includes(c.id))
        : cuenta.cuotas;

      // Ordenar por fecha de vencimiento (las más antiguas primero)
      cuotasPendientes.sort((a, b) => new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento));

      // Aplicar el pago a las cuotas
      for (const cuota of cuotasPendientes) {
        if (montoRestante <= 0) break;

        const montoAPagar = Math.min(montoRestante, cuota.monto - (cuota.monto_abonado || 0));

        if (montoAPagar > 0) {
          const nuevoMontoAbonado = (cuota.monto_abonado || 0) + montoAPagar;
          const estaPagada = nuevoMontoAbonado >= cuota.monto;

          await cuota.update({
            monto_abonado: nuevoMontoAbonado,
            estado: estaPagada ? 'pagado' : 'parcial',
            fecha_pago: estaPagada ? new Date() : null,
            metodo_pago: metodo_pago,
            observaciones: observaciones
          }, { transaction });

          montoRestante -= montoAPagar;

          resultadosPago.push({
            cuenta_corriente_id: cuenta.id,
            cliente_id: cuenta.cliente_id,
            cuota_id: cuota.id,
            monto_aplicado: montoAPagar,
            saldo_anterior: cuota.monto - (cuota.monto_abonado || 0),
            saldo_actual: cuota.monto - nuevoMontoAbonado
          });
        }
      }

      // Actualizar el saldo de la cuenta corriente
      const montoAplicadoACuenta = resultadosPago
        .filter(r => r.cuenta_corriente_id === cuenta.id)
        .reduce((sum, r) => sum + r.monto_aplicado, 0);

      const nuevoSaldoCuenta = cuenta.saldo_pendiente - montoAplicadoACuenta;

      await cuenta.update({
        monto_abonado: (cuenta.monto_abonado || 0) + montoAplicadoACuenta,
        saldo_pendiente: nuevoSaldoCuenta,
        estado: nuevoSaldoCuenta <= 0 ? 'pagado' : 'pendiente',
        fecha_ultimo_pago: new Date()
      }, { transaction });
    }

    // 4. Actualizar el estado general de la reserva
    const montoTotalAbonado = reserva.cuentas_corrientes.reduce(
      (sum, cc) => sum + (cc.monto_abonado || 0), 0
    );

    const estaPagadaCompleto = reserva.cuentas_corrientes.every(
      cc => cc.estado === 'pagado'
    );

    await reserva.update({
      monto_abonado: montoTotalAbonado,
      estado_pago: estaPagadaCompleto ? 'completo' : 'parcial',
      fecha_ultimo_pago: new Date()
    }, { transaction });

    return { resultadosPago, montoRestante, reservaId };
  });

  // 5. Obtener la reserva actualizada con toda su información
  const reservaActualizada = await Reserva.findByPk(resultado.reservaId, {
    include: [
      {
        model: CuentaCorriente,
        as: 'cuentas_corrientes',
        include: [
          {
            model: Cuota,
            as: 'cuotas',
            order: [['numero_cuota', 'ASC']]
          },
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombre', 'apellido']
          }
        ]
      }
    ]
  });

  return success(res, {
    reserva: reservaActualizada,
    pagos_aplicados: resultado.resultadosPago,
    monto_restante: Math.max(0, resultado.montoRestante)
  }, 'Pago registrado exitosamente');
});

/**
 * Genera las cuotas iniciales para una cuenta corriente
 */
exports.generarCuotasIniciales = async (cuentaCorriente, montoTotal, cantidadCuotas = 1, montoInicial = 0, transaction) => {
  const montoSenia = Math.min(montoTotal * 0.3, montoInicial); // 30% o el monto inicial si es menor
  const montoRestante = montoTotal - montoInicial;
  const fechaActual = new Date();
  const cuotas = [];

  // 1. Crear cuota de seña si aplica
  if (montoSenia > 0) {
    cuotas.push({
      cuenta_corriente_id: cuentaCorriente.id,
      numero_cuota: 1,
      monto: montoSenia,
      monto_abonado: montoSenia,
      fecha_vencimiento: new Date(fechaActual),
      fecha_pago: new Date(fechaActual),
      estado: 'pagado',
      es_senia: true,
      metodo_pago: 'efectivo', // Por defecto, se puede actualizar después
      observaciones: 'Pago inicial de seña'
    });
  }

  // 2. Crear cuotas restantes si hay saldo pendiente
  if (montoRestante > 0 && cantidadCuotas > 0) {
    const montoCuota = montoRestante / cantidadCuotas;
    const fechaBase = montoSenia > 0 ? new Date() : new Date(cuentaCorriente.fecha_creacion || fechaActual);

    for (let i = 0; i < cantidadCuotas; i++) {
      const fechaVencimiento = new Date(fechaBase);
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i + 1);

      // Si es la primera cuota y hay un monto inicial que cubre parte de ella
      const esPrimeraCuota = i === 0 && montoInicial > montoSenia;
      const montoAbonado = esPrimeraCuota ? montoInicial - montoSenia : 0;
      const estado = esPrimeraCuota && montoAbonado > 0 ? 'parcial' : 'pendiente';

      cuotas.push({
        cuenta_corriente_id: cuentaCorriente.id,
        numero_cuota: cuotas.length + 1,
        monto: montoCuota,
        monto_abonado: montoAbonado,
        fecha_vencimiento: fechaVencimiento,
        estado: estado,
        es_senia: false,
        ...(esPrimeraCuota && montoAbonado > 0 ? {
          fecha_pago: new Date(),
          metodo_pago: 'efectivo',
          observaciones: 'Pago inicial parcial'
        } : {})
      });
    }
  }

  // 3. Crear las cuotas en la base de datos
  if (cuotas.length > 0) {
    return await Cuota.bulkCreate(cuotas, { transaction });
  }

  return [];
};

/**
 * Obtiene el resumen de pagos de una reserva
 */
exports.obtenerResumenPagos = async (req, res) => {
  try {
    const { reservaId } = req.params;

    const reserva = await Reserva.findByPk(reservaId, {
      include: [
        {
          model: CuentaCorriente,
          as: 'cuentas_corrientes',
          include: [
            {
              model: Cuota,
              as: 'cuotas',
              order: [['fecha_vencimiento', 'ASC']]
            },
            {
              model: Cliente,
              as: 'cliente',
              attributes: ['id', 'nombre', 'apellido', 'email']
            }
          ]
        }
      ]
    });

    if (!reserva) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Calcular totales
    const totalReserva = parseFloat(reserva.monto_total || 0);
    const totalAbonado = parseFloat(reserva.monto_abonado || 0);
    const saldoPendiente = Math.max(0, totalReserva - totalAbonado);

    // Resumen por cliente
    const resumenClientes = reserva.cuentas_corrientes.map(cc => {
      const totalCliente = parseFloat(cc.monto_total || 0);
      const abonadoCliente = parseFloat(cc.monto_abonado || 0);
      const pendienteCliente = Math.max(0, totalCliente - abonadoCliente);

      return {
        cliente_id: cc.cliente_id,
        cliente_nombre: cc.cliente ? `${cc.cliente.nombre} ${cc.cliente.apellido}` : 'Cliente no encontrado',
        total: totalCliente,
        abonado: abonadoCliente,
        pendiente: pendienteCliente,
        cuotas: cc.cuotas ? cc.cuotas.map(c => ({
          id: c.id,
          numero: c.numero_cuota,
          monto: c.monto,
          abonado: c.monto_pagado || 0,
          pendiente: parseFloat(c.monto) - parseFloat(c.monto_pagado || 0),
          vencimiento: c.fecha_vencimiento,
          estado: c.estado === 'pagada_total' ? 'pagado' : c.estado === 'pagada_parcial' ? 'parcial' : 'pendiente',
          es_senia: c.es_senia || false
        })) : []
      };
    });

    res.status(200).json({
      success: true,
      data: {
        reserva_id: reserva.id,
        codigo_reserva: reserva.codigo,
        fecha_reserva: reserva.fecha_reserva,
        total_reserva: totalReserva,
        total_abonado: totalAbonado,
        saldo_pendiente: saldoPendiente,
        estado_pago: reserva.estado_pago,
        clientes: resumenClientes
      }
    });

  } catch (error) {
    console.error('Error al obtener el resumen de pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el resumen de pagos',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Obtiene el historial de pagos de una reserva
 */
exports.obtenerHistorialPagos = async (req, res) => {
  try {
    const { reservaId } = req.params;
    const { fechaInicio, fechaFin, clienteId } = req.query;

    const PagoModel = db.sequelize.models.Pago;
    if (!PagoModel) {
      return res.status(500).json({
        success: false,
        message: 'Modelo Pago no disponible'
      });
    }

    const wherePagos = {};
    if (fechaInicio || fechaFin) {
      wherePagos.fecha_pago = {};
      if (fechaInicio) wherePagos.fecha_pago[Op.gte] = new Date(fechaInicio);
      if (fechaFin) wherePagos.fecha_pago[Op.lte] = new Date(fechaFin);
    }
    if (clienteId) {
      wherePagos.cliente_id = clienteId;
    }

    const pagos = await PagoModel.findAll({
      where: wherePagos,
      include: [
        {
          model: CuentaCorriente,
          as: 'cuenta_corriente',
          where: { reserva_id: reservaId },
          include: [
            {
              model: Cliente,
              as: 'cliente',
              attributes: ['id', 'nombre', 'apellido']
            }
          ]
        },
        {
          model: Cuota,
          as: 'cuota',
          attributes: ['id', 'numero_cuota', 'monto']
        }
      ],
      order: [['fecha_pago', 'DESC']]
    });

    const historial = pagos.map((p) => ({
      id: p.id,
      fecha_pago: p.fecha_pago,
      monto: p.monto,
      metodo_pago: p.metodo_pago,
      observaciones: p.observaciones,
      numero_cuota: p.cuota?.numero_cuota,
      cliente: p.cuenta_corriente?.cliente ? {
        id: p.cuenta_corriente.cliente.id,
        nombre: `${p.cuenta_corriente.cliente.nombre} ${p.cuenta_corriente.cliente.apellido}`
      } : null,
      numero_comprobante: p.numero_comprobante
    }));

    res.status(200).json({
      success: true,
      data: historial
    });

  } catch (error) {
    console.error('Error al obtener el historial de pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de pagos',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Genera un compprobante de pago en formato PDF
 */
exports.generarComprobantePago = async (req, res) => {
  try {
    const { pagoId } = req.params;
    const usuarioId = req.usuario.id;
    const { download } = req.query;

    const fs = require('fs');
    const path = require('path');

    const getLogoDataUri = () => {
      try {
        const logoPath = path.resolve(__dirname, '../assets/logo.jpeg');
        if (!fs.existsSync(logoPath)) return null;
        const buf = fs.readFileSync(logoPath);
        return `data:image/jpeg;base64,${buf.toString('base64')}`;
      } catch (e) {
        return null;
      }
    };

    // Buscar el pago con la información relacionada
    const pago = await db.sequelize.models.Pago.findByPk(pagoId, {
      include: [
        {
          model: CuentaCorriente,
          as: 'cuenta_corriente',
          include: [
            {
              model: Cliente,
              as: 'cliente',
              attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono']
            },
            {
              model: Reserva,
              as: 'reserva',
              attributes: ['id', 'referencia', 'fecha_reserva', 'precio_unitario', 'cantidad_personas', 'moneda_precio_unitario']
            }
          ]
        },
        {
          model: db.sequelize.models.Cuota,
          as: 'cuota',
          attributes: ['id', 'numero_cuota', 'monto', 'fecha_vencimiento', 'estado']
        }
      ]
    });

    if (!pago) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    // Verificar que el usuario tenga permiso para ver este comprobante
    const rolUsuario = req.usuario?.role || req.usuario?.rol;
    const esAdmin = String(rolUsuario || '').toUpperCase().trim() === 'ADMIN';
    const esCliente = pago.cuenta_corriente?.cliente_id === req.usuario.cliente_id;

    if (!esAdmin && !esCliente) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para ver este comprobante'
      });
    }

    // Formatear los datos para la plantilla
    const data = {
      comprobante: {
        numero: pago.numero_comprobante,
        fecha_emision: pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR'),
        estado: 'PAGADO',
        metodo_pago: String(pago.metodo_pago || '').toUpperCase(),
        monto: pago.monto,
        moneda: pago.cuenta_corriente?.reserva?.moneda_precio_unitario || 'ARS',
        referencia: pago.cuenta_corriente?.reserva?.referencia || 'N/A',
        observaciones: pago.observaciones || 'Sin observaciones'
      },
      cliente: {
        nombre: `${pago.cuenta_corriente?.cliente?.nombre || ''} ${pago.cuenta_corriente?.cliente?.apellido || ''}`.trim() || 'No especificado',
        documento: pago.cuenta_corriente?.cliente?.dni || 'No especificado',
        email: pago.cuenta_corriente?.cliente?.email || 'No especificado',
        telefono: pago.cuenta_corriente?.cliente?.telefono || 'No especificado'
      },
      reserva: {
        referencia: pago.cuenta_corriente?.reserva?.referencia || 'N/A',
        fecha_reserva: pago.cuenta_corriente?.reserva?.fecha_reserva
          ? new Date(pago.cuenta_corriente.reserva.fecha_reserva).toLocaleDateString('es-AR')
          : 'No especificada',
        monto_total: (parseFloat(pago.cuenta_corriente?.reserva?.precio_unitario || 0) * parseFloat(pago.cuenta_corriente?.reserva?.cantidad_personas || 0)) || 0,
        moneda: pago.cuenta_corriente?.reserva?.moneda_precio_unitario || 'ARS'
      },
      cuotas: pago.cuota ? [{
        numero: pago.cuota.numero_cuota,
        monto: pago.cuota.monto,
        vencimiento: pago.cuota.fecha_vencimiento ? new Date(pago.cuota.fecha_vencimiento).toLocaleDateString('es-AR') : 'N/A',
        estado: String(pago.cuota.estado || '').toUpperCase()
      }] : [],
      cheque: (pago.metodo_pago === 'cheque' || pago.metodo_pago === 'echq') ? (pago.extra || null) : null,
      empresa: {
        nombre: 'KAWAI TURISMO',
        direccion: 'Belgrano 990, Villa Ramallo, Buenos Aires',
        telefono: '3407415397',
        email: '',
        cuit: '',
        inicio_actividades: '',
        logo: getLogoDataUri()
      }
    };

    // Generar el PDF (esta función se implementará en el helper)
    const { createPdfFromHtml } = require('../helpers/pdfGenerator');
    const pdfBuffer = await createPdfFromHtml('comprobante', data);

    // Configurar los headers de la respuesta
    res.setHeader('Content-Type', 'application/pdf');
    const disposition = download === '1' || download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename=${pago.numero_comprobante}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Enviar el PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error al generar el comprobante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el comprobante de pago',
      error: error.message
    });
  }
};
