const BaseService = require('./BaseService');
const { Reserva, Tour, Cliente, CuentaCorriente, Cuota } = require('../models').sequelize.models;
const { Op } = require('sequelize');
const { buildSearchCondition } = require('../utils/searchHelper');
const { NotFoundError, ValidationError } = require('../middlewares/errorHandler');

/**
 * Función helper para calcular fechas de vencimiento de cuotas
 */
const calcularFechasVencimiento = (fechaInicio, cantidadCuotas) => {
  const fechas = [];
  const fecha = new Date(fechaInicio);

  for (let i = 1; i <= cantidadCuotas; i++) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + i);
    fechas.push(nuevaFecha.toISOString().split('T')[0]);
  }

  return fechas;
};

class ReservaService extends BaseService {
  constructor() {
    super(Reserva, 'Reserva');
  }

  /**
   * Obtener todas las reservas con filtros y paginación
   */
  async getReservas(params = {}) {
    const { page = 1, limit = 10, search, estado, fechaInicio, fechaFin } = params;
    const offset = (page - 1) * limit;

    const where = { activo: true };

    if (estado) {
      where.estado = estado;
    }

    if (fechaInicio && fechaFin) {
      where.fecha_reserva = {
        [Op.between]: [fechaInicio, fechaFin]
      };
    }

    if (search) {
      where[Op.or] = [
        { codigo: { [Op.iLike]: `%${search}%` } },
        { '$tour.nombre$': { [Op.iLike]: `%${search}%` } },
        { '$tour.destino$': { [Op.iLike]: `%${search}%` } },
        { tour_nombre: { [Op.iLike]: `%${search}%` } },
        { tour_destino: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const tourInclude = {
      model: Tour,
      as: 'tour',
      required: false,
      attributes: ['id', 'nombre', 'destino', 'imagenUrl']
    };

    if (search) {
      tourInclude.where = {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${search}%` } },
          { destino: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }

    const total = await Reserva.count({
      where,
      include: [tourInclude],
      distinct: true
    });

    const reservas = await Reserva.findAll({
      attributes: [
        'id', 'codigo', 'fecha_reserva', 'cantidad_personas',
        'precio_unitario', 'moneda_precio_unitario', 'estado', 'notas', 'activo',
        'created_at', 'updated_at',
        'tour_id', 'tour_nombre', 'tour_destino', 'tour_descripcion',
        'fecha_inicio', 'fecha_fin'
      ],
      where,
      include: [
        {
          model: Cliente,
          as: 'clientes',
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'],
          through: { attributes: [] },
          required: false
        },
        tourInclude
      ],
      order: [['fecha_reserva', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      subQuery: false
    });

    return {
      data: reservas,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener una reserva por ID con todas sus relaciones
   */
  async getReservaById(id) {
    const reserva = await Reserva.findByPk(id, {
      include: [
        {
          model: Cliente,
          as: 'clientes',
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'],
          through: { attributes: ['tipo_cliente'] }
        },
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'nombre', 'destino', 'imagenUrl', 'precio'],
          required: false
        }
      ]
    });

    if (!reserva) {
      throw new NotFoundError('Reserva no encontrada');
    }

    return reserva;
  }

  /**
   * Crear una nueva reserva con clientes y cuenta corriente
   */
  async createReserva(data, transaction) {
    const {
      tour_id,
      clientes = [],
      fecha_reserva,
      cantidad_personas,
      precio_unitario,
      estado = 'pendiente',
      notas,
      referencia,
      descripcion,
      monto_seña,
      cantidad_cuotas = 1,
      tipo_pago,
      fecha_pago = new Date(),
      tour_nombre,
      tour_destino,
      tour_descripcion,
      fecha_inicio,
      fecha_fin,
      moneda_precio_unitario,
      modalidad_pago = 'cuotas',
      fecha_vencimiento_hotel,
      requisitos_ingresos,
      condiciones_generales
    } = data;

    // Validar que se proporcione un tour_id o datos de tour personalizado
    if (!tour_id && !(tour_nombre && tour_destino)) {
      throw new ValidationError('Se requiere un tour existente o los datos completos de un tour personalizado');
    }

    // Si se proporciona un tour_id, verificar que exista
    if (tour_id) {
      const tour = await Tour.findByPk(tour_id, { transaction });
      if (!tour) {
        throw new NotFoundError('El tour especificado no existe');
      }
    }

    // Verificar que haya al menos un cliente
    if (!clientes || clientes.length === 0) {
      throw new ValidationError('Se requiere al menos un cliente para la reserva');
    }

    // Crear el código de reserva único
    const codigo = `RES-${Date.now()}`;

    // Crear la reserva
    const reservaData = {
      codigo,
      tour_id: tour_id || null,
      referencia,
      descripcion,
      fecha_reserva,
      cantidad_personas,
      precio_unitario,
      moneda_precio_unitario: moneda_precio_unitario || 'ARS',
      estado,
      notas,
      monto_seña,
      tipo_pago,
      fecha_vencimiento_hotel: data.fecha_vencimiento_hotel || null,
      requisitos_ingresos: data.requisitos_ingresos || null,
      condiciones_generales: data.condiciones_generales || null,
      ...(!tour_id && {
        tour_nombre,
        tour_destino,
        tour_descripcion,
        fecha_inicio,
        fecha_fin
      })
    };

    const reserva = await Reserva.create(reservaData, { transaction });

    // Procesar clientes
    const titularClienteDB = await this._procesarClientes(reserva, clientes, transaction);

    if (!titularClienteDB) {
      throw new ValidationError('No se pudo determinar el cliente titular de la reserva');
    }

    // Crear cuenta corriente + cuotas
    await this._crearCuentaCorriente(reserva, titularClienteDB, monto_seña, modalidad_pago === 'sin_cuotas' ? 0 : cantidad_cuotas, fecha_pago, transaction);

    return reserva.id;
  }

  /**
   * Actualizar una reserva existente
   */
  async updateReserva(id, data, transaction) {
    const {
      tour_id,
      clientes,
      fecha_reserva,
      cantidad_personas,
      precio_unitario,
      estado,
      notas,
      referencia,
      descripcion,
      monto_seña,
      cantidad_cuotas,
      tipo_pago,
      tour_nombre,
      tour_destino,
      tour_descripcion,
      fecha_inicio,
      fecha_fin,
      moneda_precio_unitario,
      fecha_vencimiento_hotel,
      requisitos_ingresos,
      condiciones_generales
    } = data;

    const reserva = await Reserva.findByPk(id, { transaction });
    if (!reserva) {
      throw new NotFoundError('Reserva no encontrada');
    }

    // Validar que se proporcione un tour_id o datos de tour personalizado
    if (!tour_id && !(tour_nombre && tour_destino)) {
      throw new ValidationError('Se requiere un tour existente o los datos completos de un tour personalizado');
    }

    // Si se proporciona un tour_id, verificar que exista
    if (tour_id) {
      const tour = await Tour.findByPk(tour_id, { transaction });
      if (!tour) {
        throw new NotFoundError('El tour especificado no existe');
      }
    }

    // Actualizar la reserva
    const reservaData = {
      ...(tour_id !== undefined && { tour_id }),
      ...(fecha_reserva && { fecha_reserva }),
      ...(cantidad_personas && { cantidad_personas }),
      ...(precio_unitario !== undefined && { precio_unitario }),
      ...(moneda_precio_unitario && { moneda_precio_unitario }),
      ...(estado && { estado }),
      ...(notas !== undefined && { notas }),
      ...(referencia !== undefined && { referencia }),
      ...(descripcion !== undefined && { descripcion }),
      ...(monto_seña !== undefined && { monto_seña }),
      ...(tipo_pago && { tipo_pago }),
      ...(data.fecha_vencimiento_hotel !== undefined && { fecha_vencimiento_hotel: data.fecha_vencimiento_hotel }),
      ...(data.requisitos_ingresos !== undefined && { requisitos_ingresos: data.requisitos_ingresos }),
      ...(data.condiciones_generales !== undefined && { condiciones_generales: data.condiciones_generales }),
      ...(!tour_id && {
        tour_nombre,
        tour_destino,
        tour_descripcion,
        fecha_inicio,
        fecha_fin
      }),
      ...(tour_id && {
        tour_nombre: null,
        tour_destino: null,
        tour_descripcion: null,
        fecha_inicio: null,
        fecha_fin: null
      })
    };

    await reserva.update(reservaData, { transaction });

    // Actualizar clientes si se proporcionan
    if (clientes && clientes.length > 0) {
      await reserva.setClientes([], { transaction });
      await this._procesarClientes(reserva, clientes, transaction);
    }

    // Actualizar cuotas si se modifican los montos o número de cuotas
    if (monto_seña !== undefined || cantidad_cuotas !== undefined || precio_unitario !== undefined || cantidad_personas !== undefined) {
      await this._actualizarCuentaCorriente(reserva, monto_seña, cantidad_cuotas, transaction);
    }

    return reserva.id;
  }

  /**
   * Eliminar una reserva (borrado lógico)
   */
  async deleteReserva(id, transaction) {
    const reserva = await Reserva.findByPk(id, { transaction });
    if (!reserva) {
      throw new NotFoundError('Reserva no encontrada');
    }

    await reserva.update({ activo: false }, { transaction });
    return true;
  }

  /**
   * Obtener estados de reserva disponibles
   */
  getEstadosReserva() {
    return [
      { id: 'pendiente', nombre: 'Pendiente' },
      { id: 'confirmada', nombre: 'Confirmada' },
      { id: 'cancelada', nombre: 'Cancelada' },
      { id: 'finalizada', nombre: 'Finalizada' },
      { id: 'no_show', nombre: 'No Show' }
    ];
  }

  /**
   * Procesar clientes de una reserva (crear o asociar)
   * @private
   */
  async _procesarClientes(reserva, clientes, transaction) {
    let titularClienteDB = null;

    for (const [index, clienteData] of clientes.entries()) {
      const esTitular = index === 0;

      const clienteIdProvided = clienteData?.id;
      const emailProvided = (clienteData.email || '').trim();
      const dniProvided = (clienteData.dni || '').toString().trim();

      let clienteDB = null;

      // Buscar cliente existente
      if (clienteIdProvided !== undefined && clienteIdProvided !== null && String(clienteIdProvided).trim() !== '') {
        clienteDB = await Cliente.findByPk(clienteIdProvided, { transaction });
      }

      if (!clienteDB && emailProvided) {
        clienteDB = await Cliente.findOne({
          where: { email: emailProvided },
          transaction
        });
      }

      if (!clienteDB && dniProvided) {
        clienteDB = await Cliente.findOne({
          where: { dni: dniProvided },
          transaction
        });
      }

      // Si no existe, crearlo
      if (!clienteDB) {
        const safeEmail = emailProvided || `dni-${dniProvided || Date.now()}-${Math.floor(Math.random() * 100000)}@placeholder.local`;
        clienteDB = await Cliente.create({
          nombre: clienteData.nombre,
          apellido: clienteData.apellido || '',
          email: safeEmail,
          telefono: clienteData.telefono || null,
          dni: dniProvided || null,
          direccion: clienteData.direccion || null
        }, { transaction });
      }

      if (esTitular) {
        titularClienteDB = clienteDB;
      }

      // Asociar cliente a la reserva
      await reserva.addCliente(clienteDB, {
        through: {
          tipo_cliente: esTitular ? 'titular' : 'acompanante',
          created_at: new Date(),
          updated_at: new Date()
        },
        transaction
      });
    }

    return titularClienteDB;
  }

  /**
   * Crear cuenta corriente y cuotas para una reserva
   * @private
   */
  async _crearCuentaCorriente(reserva, titular, monto_seña, cantidad_cuotas, fecha_pago, transaction) {
    const montoTotalCalculado = Number(reserva.cantidad_personas) * Number(reserva.precio_unitario);
    const montoSenaNumber = monto_seña === undefined || monto_seña === null || monto_seña === '' ? 0 : Number(monto_seña);

    if (montoTotalCalculado && cantidad_cuotas > 0) {
      const cuentaCorriente = await CuentaCorriente.create({
        reserva_id: reserva.id,
        cliente_id: titular.id,
        monto_total: montoTotalCalculado,
        saldo_pendiente: Math.max(0, montoTotalCalculado - montoSenaNumber),
        cantidad_cuotas,
        estado: 'pendiente',
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      }, { transaction });

      const montoCuota = (montoTotalCalculado - montoSenaNumber) / cantidad_cuotas;
      const fechasVencimiento = calcularFechasVencimiento(fecha_pago, cantidad_cuotas);

      const cuotas = Array.from({ length: cantidad_cuotas }, (_, i) => ({
        cuenta_corriente_id: cuentaCorriente.id,
        numero_cuota: i + 1,
        monto: montoCuota,
        fecha_vencimiento: fechasVencimiento[i],
        estado: 'pendiente',
        monto_pagado: 0,
        fecha_pago: null,
        metodo_pago: null,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      }));

      await Cuota.bulkCreate(cuotas, { transaction });
    } else if (montoTotalCalculado && cantidad_cuotas === 0) {
      // Modalidad "sin cuotas" - solo cuenta corriente, sin cuotas
      await CuentaCorriente.create({
        reserva_id: reserva.id,
        cliente_id: titular.id,
        monto_total: montoTotalCalculado,
        saldo_pendiente: Math.max(0, montoTotalCalculado - montoSenaNumber),
        cantidad_cuotas: 0,
        estado: 'pendiente',
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      }, { transaction });
    }
  }

  /**
   * Actualizar cuenta corriente y cuotas existentes
   * @private
   */
  async _actualizarCuentaCorriente(reserva, monto_seña, cantidad_cuotas, transaction) {
    const montoTotalCalculado = Number(reserva.cantidad_personas) * Number(reserva.precio_unitario);
    const montoSenaNumber = monto_seña === undefined || monto_seña === null || monto_seña === '' ? 0 : Number(monto_seña);
    const cuotasCount = Number(cantidad_cuotas || 1);

    let cuentaCorriente = await CuentaCorriente.findOne({
      where: { reserva_id: reserva.id },
      transaction
    });

    if (!cuentaCorriente) {
      const clientesReserva = await reserva.getClientes({ transaction });
      const titular = Array.isArray(clientesReserva) && clientesReserva.length > 0 ? clientesReserva[0] : null;

      if (!titular) {
        throw new ValidationError('No se pudo determinar el cliente titular para generar la cuenta corriente');
      }

      cuentaCorriente = await CuentaCorriente.create({
        reserva_id: reserva.id,
        cliente_id: titular.id,
        monto_total: montoTotalCalculado,
        saldo_pendiente: Math.max(0, montoTotalCalculado - montoSenaNumber),
        cantidad_cuotas: cuotasCount,
        estado: 'pendiente',
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      }, { transaction });
    } else {
      await cuentaCorriente.update({
        monto_total: montoTotalCalculado,
        saldo_pendiente: Math.max(0, montoTotalCalculado - montoSenaNumber),
        cantidad_cuotas: cuotasCount,
        fecha_actualizacion: new Date()
      }, { transaction });
    }

    // Eliminar cuotas existentes
    await Cuota.destroy({
      where: { cuenta_corriente_id: cuentaCorriente.id },
      transaction
    });

    // Crear nuevas cuotas
    if (montoTotalCalculado && cuotasCount > 0) {
      const montoCuota = (montoTotalCalculado - montoSenaNumber) / cuotasCount;
      const fechasVencimiento = calcularFechasVencimiento(new Date(), cuotasCount);

      const cuotas = Array.from({ length: cuotasCount }, (_, i) => ({
        cuenta_corriente_id: cuentaCorriente.id,
        numero_cuota: i + 1,
        monto: montoCuota,
        fecha_vencimiento: fechasVencimiento[i],
        estado: 'pendiente',
        monto_pagado: 0,
        fecha_pago: null,
        metodo_pago: null,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      }));

      await Cuota.bulkCreate(cuotas, { transaction });
    }
  }
}

module.exports = new ReservaService();
