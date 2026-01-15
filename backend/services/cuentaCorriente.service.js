const BaseService = require('./BaseService');
const { CuentaCorriente, Reserva, Cliente, Cuota, Tour, Pago } = require('../models').sequelize.models;
const { NotFoundError, ValidationError } = require('../middlewares/errorHandler');

class CuentaCorrienteService extends BaseService {
  constructor() {
    super(CuentaCorriente, 'Cuenta Corriente');
  }

  /**
   * Obtener todas las cuentas corrientes con filtros
   */
  async getCuentasCorrientes(params = {}) {
    const { page, limit, estado, cliente_id } = params;

    const where = {};
    if (estado) where.estado = estado;
    if (cliente_id) where.cliente_id = cliente_id;

    return await this.getAll({
      page,
      limit,
      where,
      include: [
        {
          model: Reserva,
          as: 'reserva',
          include: [
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'nombre', 'destino']
            }
          ]
        },
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'apellido', 'email']
        }
      ],
      order: [['fecha_creacion', 'DESC']]
    });
  }

  /**
   * Obtener cuentas corrientes del usuario autenticado
   */
  async getMisCuentas(email) {
    if (!email) {
      throw new ValidationError('No se pudo determinar el email del usuario');
    }

    const cliente = await Cliente.findOne({ where: { email } });
    if (!cliente) {
      throw new NotFoundError('No se encontró un cliente asociado a este usuario');
    }

    const cuentas = await CuentaCorriente.findAll({
      where: { cliente_id: cliente.id },
      include: [
        {
          model: Reserva,
          as: 'reserva',
          attributes: [
            'id',
            'codigo',
            'fecha_reserva',
            'descripcion',
            'tour_id',
            'tour_nombre',
            'tour_destino',
            'tour_descripcion',
            'fecha_inicio',
            'fecha_fin'
          ],
          include: [
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'nombre', 'destino', 'descripcion', 'fechaInicio', 'fechaFin']
            }
          ]
        },
        {
          model: Cuota,
          as: 'cuotas',
          include: [
            {
              model: Pago,
              as: 'pago',
              attributes: ['id', 'numero_comprobante', 'metodo_pago', 'fecha_pago', 'monto']
            }
          ],
          order: [['numero_cuota', 'ASC']]
        }
      ],
      order: [['fecha_creacion', 'DESC']]
    });

    return {
      cliente: { id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido, email: cliente.email },
      cuentas
    };
  }

  /**
   * Obtener una cuenta corriente por ID con detalles completos
   */
  async getCuentaCorrienteById(id) {
    const cuenta = await CuentaCorriente.findByPk(id, {
      include: [
        {
          model: Reserva,
          as: 'reserva',
          include: [
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'nombre', 'destino', 'precio']
            }
          ]
        },
        {
          model: Cliente,
          as: 'cliente',
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono']
        },
        {
          model: Cuota,
          as: 'cuotas',
          include: [
            {
              model: Pago,
              as: 'pago',
              attributes: ['id', 'numero_comprobante', 'metodo_pago', 'fecha_pago', 'monto']
            }
          ],
          order: [['numero_cuota', 'ASC']]
        }
      ]
    });

    if (!cuenta) {
      throw new NotFoundError('Cuenta corriente no encontrada');
    }

    return cuenta;
  }

  /**
   * Actualizar el estado de una cuenta corriente
   */
  async actualizarEstado(id, estado, transaction) {
    const cuenta = await CuentaCorriente.findByPk(id, { transaction });

    if (!cuenta) {
      throw new NotFoundError('Cuenta corriente no encontrada');
    }

    // Validar que el estado sea válido
    const estadosPermitidos = ['pendiente', 'en_proceso', 'pagado', 'atrasado', 'cancelado'];
    if (!estadosPermitidos.includes(estado)) {
      throw new ValidationError(`Estado no válido. Los estados permitidos son: ${estadosPermitidos.join(', ')}`);
    }

    // Actualizar el estado de la cuenta
    await cuenta.update({ estado }, { transaction });

    // Si se marca como pagada, marcar todas las cuotas como pagadas
    if (estado === 'pagado') {
      await Cuota.update(
        { estado: 'pagada_total' },
        {
          where: { cuenta_corriente_id: id, estado: 'pendiente' },
          transaction
        }
      );
    }

    return cuenta;
  }

  /**
   * Obtener cuentas corrientes por cliente
   */
  async getCuentasPorCliente(clienteId) {
    const cuentas = await CuentaCorriente.findAll({
      where: { cliente_id: clienteId },
      include: [
        {
          model: Reserva,
          as: 'reserva',
          include: [
            {
              model: Tour,
              as: 'tour',
              attributes: ['id', 'nombre', 'destino']
            }
          ]
        },
        {
          model: Cuota,
          as: 'cuotas',
          attributes: ['id', 'numero_cuota', 'monto', 'estado', 'fecha_vencimiento', 'monto_pagado'],
          include: [
            {
              model: Pago,
              as: 'pago',
              attributes: ['id', 'numero_comprobante', 'metodo_pago', 'fecha_pago', 'monto']
            }
          ]
        }
      ],
      order: [['fecha_creacion', 'DESC']]
    });

    return cuentas;
  }

  /**
   * Calcular resumen de cuenta corriente
   */
  async getResumenCuenta(id) {
    const cuenta = await this.getCuentaCorrienteById(id);

    const cuotasPagadas = cuenta.cuotas.filter(c => c.estado === 'pagada_total').length;
    const cuotasPendientes = cuenta.cuotas.filter(c => c.estado === 'pendiente').length;
    const cuotasVencidas = cuenta.cuotas.filter(c => c.estado === 'vencida').length;

    return {
      cuenta,
      resumen: {
        total_cuotas: cuenta.cuotas.length,
        cuotas_pagadas: cuotasPagadas,
        cuotas_pendientes: cuotasPendientes,
        cuotas_vencidas: cuotasVencidas,
        monto_total: cuenta.monto_total,
        monto_abonado: cuenta.monto_abonado || 0,
        saldo_pendiente: cuenta.saldo_pendiente,
        porcentaje_pagado: ((cuenta.monto_abonado || 0) / cuenta.monto_total * 100).toFixed(2)
      }
    };
  }
}

module.exports = new CuentaCorrienteService();
