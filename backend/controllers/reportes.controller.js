const { Op, fn, col, literal } = require('sequelize');
const db = require('../models');

const { CuentaCorriente, Cuota, Pago, Cliente } = db.sequelize.models;

const parseBoolean = (v) => {
  if (v === true || v === false) return v;
  if (v === undefined || v === null) return false;
  const s = String(v).toLowerCase().trim();
  return s === '1' || s === 'true' || s === 'yes' || s === 'si';
};

exports.finanzas = async (req, res) => {
  try {
    const rolUsuario = req.usuario?.role || req.usuario?.rol;
    const esAdmin = String(rolUsuario || '').toUpperCase().trim() === 'ADMIN';
    if (!esAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para acceder a reportes'
      });
    }

    const {
      desde,
      hasta,
      clienteId,
      estadoCuenta,
      estadoCuota,
      soloDeudas
    } = req.query;

    const filtrosCuenta = {};
    if (clienteId) filtrosCuenta.cliente_id = clienteId;
    if (estadoCuenta) filtrosCuenta.estado = estadoCuenta;
    if (parseBoolean(soloDeudas)) {
      filtrosCuenta.saldo_pendiente = { [Op.gt]: 0 };
    }

    const filtrosCuota = {};
    if (estadoCuota) filtrosCuota.estado = estadoCuota;
    if (desde || hasta) {
      filtrosCuota.fecha_vencimiento = {};
      if (desde) filtrosCuota.fecha_vencimiento[Op.gte] = desde;
      if (hasta) filtrosCuota.fecha_vencimiento[Op.lte] = hasta;
    }

    const filtrosPago = {};
    if (desde || hasta) {
      filtrosPago.fecha_pago = {};
      if (desde) filtrosPago.fecha_pago[Op.gte] = new Date(desde);
      if (hasta) {
        // incluir todo el día
        const end = new Date(hasta);
        end.setHours(23, 59, 59, 999);
        filtrosPago.fecha_pago[Op.lte] = end;
      }
    }

    // 1) Totales de cuentas corrientes
    const cuentasAgg = await CuentaCorriente.findAll({
      where: filtrosCuenta,
      attributes: [
        [fn('COUNT', col('id')), 'cantidad'],
        [fn('COALESCE', fn('SUM', col('monto_total')), 0), 'monto_total'],
        [fn('COALESCE', fn('SUM', col('saldo_pendiente')), 0), 'saldo_pendiente']
      ],
      raw: true
    });

    const cuentasEstado = await CuentaCorriente.findAll({
      where: filtrosCuenta,
      attributes: [
        'estado',
        [fn('COUNT', col('id')), 'cantidad'],
        [fn('COALESCE', fn('SUM', col('saldo_pendiente')), 0), 'saldo_pendiente']
      ],
      group: ['estado'],
      raw: true
    });

    // 2) Cuotas por estado (filtrando por CuentaCorriente)
    const cuotasAgg = await Cuota.findAll({
      where: filtrosCuota,
      include: [
        {
          model: CuentaCorriente,
          as: 'cuenta_corriente',
          required: true,
          where: filtrosCuenta,
          attributes: []
        }
      ],
      attributes: [
        [col('Cuota.estado'), 'estado'],
        [fn('COUNT', col('Cuota.id')), 'cantidad'],
        [fn('COALESCE', fn('SUM', col('Cuota.monto')), 0), 'monto'],
        [fn('COALESCE', fn('SUM', col('Cuota.monto_pagado')), 0), 'monto_pagado']
      ],
      group: [col('Cuota.estado')],
      raw: true
    });

    // 3) Pagos (filtrando por cliente vía CuentaCorriente)
    const pagosAgg = await Pago.findAll({
      where: filtrosPago,
      include: [
        {
          model: CuentaCorriente,
          as: 'cuenta_corriente',
          required: true,
          where: filtrosCuenta,
          attributes: []
        }
      ],
      attributes: [
        [fn('COUNT', col('Pago.id')), 'cantidad'],
        [fn('COALESCE', fn('SUM', col('Pago.monto')), 0), 'monto']
      ],
      raw: true
    });

    const cuentasRow = cuentasAgg?.[0] || { cantidad: 0, monto_total: 0, saldo_pendiente: 0 };
    const pagosRow = pagosAgg?.[0] || { cantidad: 0, monto: 0 };

    const totalPendiente = Number(cuentasRow.saldo_pendiente || 0);
    const totalPagado = Number(pagosRow.monto || 0);
    const totalMovimientos = totalPendiente + totalPagado;
    const porcentajePagado = totalMovimientos > 0 ? (totalPagado / totalMovimientos) * 100 : 0;

    // 4) Top clientes por deuda (si no se filtra por cliente)
    let topDeudores = [];
    if (!clienteId) {
      topDeudores = await CuentaCorriente.findAll({
        where: {
          ...filtrosCuenta,
          saldo_pendiente: { [Op.gt]: 0 }
        },
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['id', 'nombre', 'apellido', 'email'],
            required: true
          }
        ],
        attributes: [
          'cliente_id',
          [fn('COALESCE', fn('SUM', col('saldo_pendiente')), 0), 'saldo_pendiente'],
          [fn('COUNT', col('CuentaCorriente.id')), 'cantidad_cuentas']
        ],
        group: ['cliente.id', 'cliente_id'],
        order: [[literal('saldo_pendiente'), 'DESC']],
        limit: 5,
        raw: true,
        nest: true
      });
    }

    return res.json({
      success: true,
      filtros: { desde, hasta, clienteId, estadoCuenta, estadoCuota, soloDeudas: parseBoolean(soloDeudas) },
      kpis: {
        cuentas: Number(cuentasRow.cantidad || 0),
        monto_total: Number(cuentasRow.monto_total || 0),
        saldo_pendiente: totalPendiente,
        pagos_cantidad: Number(pagosRow.cantidad || 0),
        pagos_monto: totalPagado,
        porcentaje_pagado: porcentajePagado
      },
      cuentas_por_estado: cuentasEstado.map((r) => ({
        estado: r.estado,
        cantidad: Number(r.cantidad || 0),
        saldo_pendiente: Number(r.saldo_pendiente || 0)
      })),
      cuotas_por_estado: cuotasAgg.map((r) => ({
        estado: r.estado,
        cantidad: Number(r.cantidad || 0),
        monto: Number(r.monto || 0),
        monto_pagado: Number(r.monto_pagado || 0)
      })),
      top_deudores: topDeudores.map((r) => ({
        cliente_id: r.cliente_id,
        nombre: r.cliente?.nombre,
        apellido: r.cliente?.apellido,
        email: r.cliente?.email,
        saldo_pendiente: Number(r.saldo_pendiente || 0),
        cantidad_cuentas: Number(r.cantidad_cuentas || 0)
      }))
    });
  } catch (error) {
    console.error('Error en reportes.finanzas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar reporte de finanzas',
      error: error.message
    });
  }
};
