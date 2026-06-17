const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const { Reserva, CuentaCorriente, Cuota, Cliente } = db.sequelize.models;
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/responseHandler');
const { withTransaction } = require('../utils/transactionWrapper');
const { NotFoundError, ValidationError } = require('../middlewares/errorHandler');
const emailService = require('../services/email.service');

// Tipos de pago permitidos
const METODOS_PAGO = ['efectivo', 'transferencia', 'tarjeta_credito', 'tarjeta_debito', 'deposito', 'otro'];

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

const buildNumeroComprobante = (correlativo) => {
  return `REC-${String(correlativo).padStart(6, '0')}`;
};

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
    nombre_entrega,
    email_entrega,
    cliente_id,
    cuotas_ids = []
  } = req.body;

  // Validar método de pago
  if (!METODOS_PAGO.includes(metodo_pago)) {
    throw new ValidationError(`Método de pago no válido. Debe ser uno de: ${METODOS_PAGO.join(', ')}`);
  }

  const resultado = await withTransaction(async (transaction) => {
    // 1. Obtener la reserva directamente
    const reserva = await Reserva.findByPk(reservaId, { transaction });

    if (!reserva) {
      throw new NotFoundError('Reserva no encontrada');
    }

    const montoTotalCalculado = Number(reserva.cantidad_personas || 1) * Number(reserva.precio_unitario || 0);
    const montoRestanteTotal = Math.max(0, montoTotalCalculado - Number(reserva.monto_abonado || 0));
    const montoAPagar = Math.min(parseFloat(monto), montoRestanteTotal);

    if (montoAPagar <= 0) {
      throw new ValidationError('Esta reserva ya está pagada por completo o el monto es inválido');
    }

    // Buscar si hay CuentaCorriente asociada a la reserva
    const cuentaCorriente = await CuentaCorriente.findOne({
      where: { reserva_id: reserva.id },
      transaction
    });

    let cuentaCorrienteId = null;
    let cuotaIdAsociada = null;

    if (cuentaCorriente) {
      cuentaCorrienteId = cuentaCorriente.id;
      const nuevoSaldoCC = Math.max(0, Number(cuentaCorriente.saldo_pendiente || 0) - montoAPagar);
      await cuentaCorriente.update({
        saldo_pendiente: nuevoSaldoCC,
        estado: nuevoSaldoCC <= 0 ? 'pagada' : 'parcial',
        fecha_actualizacion: new Date()
      }, { transaction });

      // Ahora, distribuir el pago entre las cuotas de esta cuenta corriente
      const cuotas = await Cuota.findAll({
        where: { cuenta_corriente_id: cuentaCorriente.id },
        order: [['numero_cuota', 'ASC']],
        transaction
      });

      if (cuotas && cuotas.length > 0) {
        let montoRestante = montoAPagar;
        for (const cuota of cuotas) {
          if (montoRestante <= 0) break;

          const montoCuota = Number(cuota.monto || 0);
          const yaPagado = Number(cuota.monto_pagado || 0);
          const pendiente = Math.max(0, montoCuota - yaPagado);

          if (pendiente > 0) {
            const pagoACuota = Math.min(montoRestante, pendiente);
            const nuevoMontoPagado = yaPagado + pagoACuota;
            montoRestante -= pagoACuota;

            let nuevoEstado = 'pendiente';
            if (nuevoMontoPagado >= montoCuota) {
              nuevoEstado = 'completo';
              if (!cuotaIdAsociada) {
                cuotaIdAsociada = cuota.id;
              }
            } else if (nuevoMontoPagado > 0) {
              nuevoEstado = 'parcial';
            }

            await cuota.update({
              monto_pagado: nuevoMontoPagado,
              estado: nuevoEstado,
              fecha_pago: new Date(fecha_pago),
              metodo_pago: metodo_pago,
              fecha_actualizacion: new Date()
            }, { transaction });
          }
        }
      }
    }

    // Obtener correlativo de pago máximo para autoincrementar correlativo
    const maxCorrelativo = await db.sequelize.models.Pago.max('correlativo', { transaction }) || 0;
    const correlativo = maxCorrelativo + 1;

    // Crear el registro de Pago (asociado directamente a reserva_id)
    const pago = await db.sequelize.models.Pago.create({
      correlativo,
      numero_comprobante: buildNumeroComprobante(correlativo),
      reserva_id: reserva.id,
      cuenta_corriente_id: cuentaCorrienteId,
      cuota_id: cuotaIdAsociada,
      cliente_id: cuentaCorriente?.cliente_id || null,
      usuario_id: req.usuario?.id || null,
      monto: montoAPagar,
      metodo_pago,
      fecha_pago: new Date(fecha_pago),
      observaciones: observaciones || null,
      nombre_pagador: nombre_entrega || null,
      email_pagador: email_entrega || null,
      fecha_creacion: new Date()
    }, { transaction });

    // Actualizar el monto_abonado y el estado_pago de la reserva
    const nuevoMontoAbonado = Number(reserva.monto_abonado || 0) + montoAPagar;
    let estadoPagoReserva = 'pendiente';
    if (nuevoMontoAbonado >= montoTotalCalculado) {
      estadoPagoReserva = 'completo';
    } else if (nuevoMontoAbonado > 0) {
      estadoPagoReserva = 'parcial';
    }

    await reserva.update({
      monto_abonado: nuevoMontoAbonado,
      estado_pago: estadoPagoReserva,
      metodo_pago: metodo_pago
    }, { transaction });

    const resultadosPago = [{
      reserva_id: reserva.id,
      pago_id: pago.id,
      monto_aplicado: montoAPagar,
      saldo_anterior: montoRestanteTotal,
      saldo_actual: Math.max(0, montoRestanteTotal - montoAPagar)
    }];

    // Generar PDF del comprobante para adjuntarlo al correo
    let pdfBuffer = null;
    try {
      const { createPdfFromHtml } = require('../helpers/pdfGenerator');
      const logoUri = getLogoDataUri();
      
      const pdfData = {
        comprobante: {
          numero: pago.numero_comprobante,
          fecha_emision: new Date(pago.fecha_pago).toLocaleDateString('es-AR'),
          estado: 'PAGADO',
          metodo_pago: String(pago.metodo_pago || '').toUpperCase(),
          monto: pago.monto,
          moneda: reserva.moneda_precio_unitario || 'ARS',
          referencia: reserva.referencia || 'N/A',
          observaciones: pago.observaciones || 'Sin observaciones'
        },
        cliente: {
          nombre: `${reserva.nombre_cliente || ''} ${reserva.apellido_cliente || ''}`.trim() || nombre_entrega || 'No especificado',
          documento: reserva.dni_cliente || 'No especificado',
          email: email_entrega || reserva.email_cliente || 'No especificado',
          telefono: reserva.telefono_cliente || 'No especificado'
        },
        reserva: {
          referencia: reserva.referencia || 'N/A',
          fecha_reserva: reserva.fecha_reserva
            ? new Date(reserva.fecha_reserva).toLocaleDateString('es-AR')
            : 'No especificada',
          monto_total: montoTotalCalculado,
          moneda: reserva.moneda_precio_unitario || 'ARS'
        },
        cuotas: [],
        cheque: null,
        empresa: {
          nombre: 'KAWAI TURISMO',
          direccion: 'Belgrano 990, Villa Ramallo, Buenos Aires',
          telefono: '3407415397',
          email: '',
          cuit: '',
          logo: logoUri
        }
      };

      pdfBuffer = await createPdfFromHtml('comprobante', pdfData);
    } catch (pdfErr) {
      console.error('Error al generar el comprobante PDF para el correo:', pdfErr);
    }

    return { resultadosPago, montoRestante: parseFloat(monto) - montoAPagar, reservaId, pdfBuffer, pago };
  });

  // 5. Obtener la reserva actualizada con toda su información
  const reservaActualizada = await Reserva.findByPk(resultado.reservaId, {
    include: [
      {
        model: CuentaCorriente,
        as: 'cuentas_corrientes',
        required: false,
        include: [
          {
            model: Cuota,
            as: 'cuotas',
            required: false
          },
          {
            model: Cliente,
            as: 'cliente',
            required: false,
            attributes: ['id', 'nombre', 'apellido']
          }
        ]
      }
    ]
  });

  if (email_entrega) {
    try {
      const montoFormateado = Number(monto || 0).toLocaleString('es-AR');
      const fechaFormateada = new Date(fecha_pago).toLocaleString('es-AR');
      const codigoReserva = reservaActualizada?.codigo || `#${resultado.reservaId}`;

      await emailService.sendEmail({
        to: email_entrega,
        subject: `Confirmación de pago - Reserva ${codigoReserva}`,
        text: [
          'Tu pago fue registrado correctamente.',
          `Reserva: ${codigoReserva}`,
          `Importe: ${montoFormateado}`,
          `Método: ${metodo_pago}`,
          `Fecha: ${fechaFormateada}`,
          nombre_entrega ? `Registrado por: ${nombre_entrega}` : null,
        ].filter(Boolean).join('\n'),
        html: `
          <p>Tu pago fue registrado correctamente y se adjunta el comprobante correspondiente.</p>
          <p><strong>Reserva:</strong> ${codigoReserva}</p>
          <p><strong>Importe:</strong> ${montoFormateado}</p>
          <p><strong>Método:</strong> ${metodo_pago}</p>
          <p><strong>Fecha:</strong> ${fechaFormateada}</p>
          ${nombre_entrega ? `<p><strong>Registrado por:</strong> ${nombre_entrega}</p>` : ''}
        `,
        attachments: resultado.pdfBuffer ? [
          {
            filename: `${resultado.pago.numero_comprobante}.pdf`,
            content: resultado.pdfBuffer
          }
        ] : []
      });
    } catch (emailError) {
      console.error('❌ Error detallado al enviar email de pago:', emailError);
    }
  }

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

    const wherePagos = {
      [Op.or]: [
        { reserva_id: reservaId },
        { '$cuenta_corriente.reserva_id$': reservaId }
      ]
    };
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
          required: false,
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
    const { download } = req.query;

    // Buscar el pago con la información relacionada (tanto por CuentaCorriente como directa por Reserva)
    const pago = await db.sequelize.models.Pago.findByPk(pagoId, {
      include: [
        {
          model: CuentaCorriente,
          as: 'cuenta_corriente',
          required: false,
          include: [
            {
              model: Cliente,
              as: 'cliente',
              attributes: ['id', 'nombre', 'apellido', 'dni', 'email', 'telefono']
            },
            {
              model: Reserva,
              as: 'reserva',
              attributes: ['id', 'referencia', 'fecha_reserva', 'precio_unitario', 'cantidad_personas', 'moneda_precio_unitario', 'nombre_cliente', 'apellido_cliente', 'dni_cliente', 'email_cliente', 'telefono_cliente']
            }
          ]
        },
        {
          model: Reserva,
          as: 'reserva',
          required: false
        },
        {
          model: db.sequelize.models.Cuota,
          as: 'cuota',
          required: false,
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
    const reservaIdUsuario = req.usuario?.reserva_id;
    const reservaIdPago = pago.reserva_id || pago.cuenta_corriente?.reserva_id;
    const esReservaAutorizada = reservaIdUsuario && String(reservaIdUsuario) === String(reservaIdPago);

    if (!esAdmin && !esReservaAutorizada) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para ver este comprobante'
      });
    }

    const reservaObj = pago.reserva || pago.cuenta_corriente?.reserva;
    const montoTotalCalculado = reservaObj 
      ? (parseFloat(reservaObj.precio_unitario || 0) * parseFloat(reservaObj.cantidad_personas || 0))
      : 0;

    // Formatear los datos para la plantilla
    const data = {
      comprobante: {
        numero: pago.numero_comprobante,
        fecha_emision: pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR'),
        estado: 'PAGADO',
        metodo_pago: String(pago.metodo_pago || '').toUpperCase(),
        monto: pago.monto,
        moneda: reservaObj?.moneda_precio_unitario || 'ARS',
        referencia: reservaObj?.referencia || 'N/A',
        observaciones: pago.observaciones || 'Sin observaciones'
      },
      cliente: {
        nombre: pago.nombre_pagador || `${reservaObj?.nombre_cliente || ''} ${reservaObj?.apellido_cliente || ''}`.trim() || `${pago.cuenta_corriente?.cliente?.nombre || ''} ${pago.cuenta_corriente?.cliente?.apellido || ''}`.trim() || 'No especificado',
        documento: reservaObj?.dni_cliente || pago.cuenta_corriente?.cliente?.dni || 'No especificado',
        email: pago.email_pagador || reservaObj?.email_cliente || pago.cuenta_corriente?.cliente?.email || 'No especificado',
        telefono: reservaObj?.telefono_cliente || pago.cuenta_corriente?.cliente?.telefono || 'No especificado'
      },
      reserva: {
        referencia: reservaObj?.referencia || 'N/A',
        fecha_reserva: reservaObj?.fecha_reserva
          ? new Date(reservaObj.fecha_reserva).toLocaleDateString('es-AR')
          : 'No especificada',
        monto_total: montoTotalCalculado,
        moneda: reservaObj?.moneda_precio_unitario || 'ARS'
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

    // Generar el PDF
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

/**
 * Obtiene todos los pagos registrados con paginación y filtros
 */
exports.obtenerTodosLosPagos = asyncHandler(async (req, res) => {
  const { search, metodo_pago, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  
  if (metodo_pago) {
    where.metodo_pago = metodo_pago;
  }

  // Filtrar por reserva (código o referencia) o nombre de pagador
  if (search) {
    where[Op.or] = [
      { numero_comprobante: { [Op.iLike]: `%${search}%` } },
      { nombre_pagador: { [Op.iLike]: `%${search}%` } },
      { '$reserva.codigo$': { [Op.iLike]: `%${search}%` } },
      { '$reserva.nombre_cliente$': { [Op.iLike]: `%${search}%` } },
      { '$reserva.apellido_cliente$': { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { rows: pagos, count: total } = await db.sequelize.models.Pago.findAndCountAll({
    where,
    include: [
      {
        model: Reserva,
        as: 'reserva',
        required: search ? (search.toLowerCase().includes('res') || search.match(/\d+/) !== null) : false
      }
    ],
    order: [['fecha_pago', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  return success(res, {
    pagos,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  }, 'Pagos obtenidos exitosamente');
});

exports.obtenerMisComprobantesReserva = asyncHandler(async (req, res) => {
  const reservaId = req.usuario?.reserva_id;

  if (!reservaId) {
    return res.status(403).json({
      success: false,
      message: 'No tiene permiso para acceder a estos comprobantes'
    });
  }

  const pagos = await db.sequelize.models.Pago.findAll({
    where: { reserva_id: reservaId },
    include: [
      {
        model: Reserva,
        as: 'reserva'
      }
    ],
    order: [['fecha_pago', 'DESC']]
  });

  return success(res, { pagos }, 'Comprobantes obtenidos exitosamente');
});
