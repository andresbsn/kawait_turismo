const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const db = require('../models');
const { v4: uuidv4 } = require('uuid');

// Obtener la instancia de sequelize y los modelos
const { sequelize } = db;
const { Reserva, Tour, Cliente, CuentaCorriente, Cuota } = db.sequelize.models;

// Función para calcular fechas de vencimiento de cuotas
const calcularFechasVencimiento = (fechaInicio, cantidadCuotas) => {
  const fechas = [];
  const fecha = new Date(fechaInicio);
  
  for (let i = 1; i <= cantidadCuotas; i++) {
    // Agregar un mes a la fecha para cada cuota
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + i);
    fechas.push(nuevaFecha.toISOString().split('T')[0]); // Formato YYYY-MM-DD
  }
  
  return fechas;
};

// Verificar que los modelos estén disponibles
if (!Reserva) {
  console.error('Error: No se pudo cargar el modelo Reserva');
  console.log('Modelos disponibles en sequelize:', Object.keys(db.sequelize.models));
  console.log('Modelos disponibles en db:', Object.keys(db).filter(key => typeof db[key] === 'object' && db[key] !== null));
}

if (!Tour) {
  console.error('Error: No se pudo cargar el modelo Tour');
  console.log('Modelos disponibles en sequelize:', Object.keys(db.sequelize.models));
}

// Obtener todas las reservas con paginación y filtros
exports.obtenerReservas = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      estado = '',
      fechaInicio,
      fechaFin
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Construir condiciones de búsqueda
    const whereClause = {
      activo: true,
    };

    // Filtrar por estado si se proporciona
    if (estado) {
      whereClause.estado = estado;
    }

    // Filtrar por rango de fechas si se proporciona
    if (fechaInicio && fechaFin) {
      whereClause.fecha_reserva = {
        [Op.between]: [fechaInicio, fechaFin],
      };
    }

    // Búsqueda por código, nombre de tour o destino
    if (search) {
      whereClause[Op.or] = [
        { codigo: { [Op.iLike]: `%${search}%` } },
        { '$tour.nombre$': { [Op.iLike]: `%${search}%` } },
        { '$tour.destino$': { [Op.iLike]: `%${search}%` } },
        { tour_nombre: { [Op.iLike]: `%${search}%` } },
        { tour_destino: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Obtener el total de registros
    const total = await Reserva.count({ 
      where: whereClause,
      include: [
        {
          model: Tour,
          as: 'tour',
          required: false,
          where: search ? {
            [Op.or]: [
              { nombre: { [Op.iLike]: `%${search}%` } },
              { destino: { [Op.iLike]: `%${search}%` } }
            ]
          } : undefined
        }
      ],
      distinct: true
    });

    // Obtener las reservas con paginación
    const reservas = await Reserva.findAll({
      attributes: [
        'id', 'codigo', 'fecha_reserva', 'cantidad_personas', 
        'precio_unitario', 'moneda_precio_unitario', 'estado', 'notas', 'activo', 
        'created_at', 'updated_at',
        // Agregar los nuevos campos
        'tour_id', 'tour_nombre', 'tour_destino', 'tour_descripcion',
        'fecha_inicio', 'fecha_fin'
      ],
      where: whereClause,
      include: [
        {
          model: Cliente,
          as: 'clientes',
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'],
          through: { attributes: [] },
          required: false
        },
        {
          model: Tour,
          as: 'tour',
          attributes: ['id', 'nombre', 'destino', 'imagenUrl'],
          required: false
        }
      ],
      order: [['fecha_reserva', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      subQuery: false
    });

    res.status(200).json({
      success: true,
      reservas,
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error al obtener las reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las reservas',
      error: error.message,
    });
  }
};

// Eliminar una reserva (borrado lógico)
exports.eliminarReserva = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    const reserva = await Reserva.findByPk(id, { transaction: t });
    if (!reserva) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada',
      });
    }

    // Realizar borrado lógico
    await reserva.update({ activo: false }, { transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Reserva eliminada exitosamente',
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al eliminar la reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la reserva',
      error: error.message,
    });
  }
};

// Obtener los estados de reserva disponibles
exports.obtenerEstadosReserva = (req, res) => {
  try {
    const estados = [
      { id: 'pendiente', nombre: 'Pendiente' },
      { id: 'confirmada', nombre: 'Confirmada' },
      { id: 'cancelada', nombre: 'Cancelada' },
      { id: 'finalizada', nombre: 'Finalizada' },
      { id: 'no_show', nombre: 'No Show' },
    ];

    res.status(200).json({
      success: true,
      estados,
    });
  } catch (error) {
    console.error('Error al obtener los estados de reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los estados de reserva',
      error: error.message,
    });
  }
};

// Obtener una reserva por ID
exports.obtenerReservaPorId = async (req, res) => {
  try {
    const { id } = req.params;

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
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada',
      });
    }

    res.status(200).json({
      success: true,
      reserva,
    });
  } catch (error) {
    console.error('Error al obtener la reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la reserva',
      error: error.message,
    });
  }
};

// Crear una nueva reserva
exports.crearReserva = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  const t = await sequelize.transaction();

  try {
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
      // Nuevos campos para tour personalizado
      tour_nombre,
      tour_destino,
      tour_descripcion,
      fecha_inicio,
      fecha_fin,
      moneda_precio_unitario
    } = req.body;

    // Validar que se proporcione un tour_id o datos de tour personalizado
    if (!tour_id && !(tour_nombre && tour_destino)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Se requiere un tour existente o los datos completos de un tour personalizado',
      });
    }

    // Si se proporciona un tour_id, verificar que exista
    if (tour_id) {
      const tour = await Tour.findByPk(tour_id, { transaction: t });
      if (!tour) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'El tour especificado no existe',
        });
      }
    }

    // Verificar que haya al menos un cliente
    if (!clientes || clientes.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un cliente para la reserva',
      });
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
      // Agregar datos de tour personalizado si no hay tour_id
      ...(!tour_id && {
        tour_nombre,
        tour_destino,
        tour_descripcion,
        fecha_inicio,
        fecha_fin
      })
    };

    const reserva = await Reserva.create(reservaData, { transaction: t });

    // Procesar clientes
    let titularClienteDB = null;
    for (const [index, clienteData] of clientes.entries()) {
      const esTitular = index === 0; // El primer cliente es el titular

      // Verificar si el cliente ya existe
      const clienteIdProvided = clienteData?.id;
      const emailProvided = (clienteData.email || '').trim();
      const dniProvided = (clienteData.dni || '').toString().trim();

      let clienteDB = null;
      if (clienteIdProvided !== undefined && clienteIdProvided !== null && String(clienteIdProvided).trim() !== '') {
        clienteDB = await Cliente.findByPk(clienteIdProvided, { transaction: t });
      }
      if (emailProvided) {
        clienteDB = await Cliente.findOne({
          where: { email: emailProvided },
          transaction: t
        });
      } else if (dniProvided) {
        clienteDB = await Cliente.findOne({
          where: { dni: dniProvided },
          transaction: t
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
        }, { transaction: t });
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
        transaction: t
      });
    }

    if (!titularClienteDB) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se pudo determinar el cliente titular de la reserva',
      });
    }

    // Crear cuenta corriente + cuotas
    const montoTotalCalculado = Number(reserva.cantidad_personas) * Number(reserva.precio_unitario);
    const montoSenaNumber = monto_seña === undefined || monto_seña === null || monto_seña === '' ? 0 : Number(monto_seña);
    if (montoTotalCalculado && cantidad_cuotas > 0) {
      const cuentaCorriente = await CuentaCorriente.create({
        reserva_id: reserva.id,
        cliente_id: titularClienteDB.id,
        monto_total: montoTotalCalculado,
        saldo_pendiente: Math.max(0, montoTotalCalculado - montoSenaNumber),
        cantidad_cuotas,
        estado: 'pendiente',
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
      }, { transaction: t });

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

      await Cuota.bulkCreate(cuotas, { transaction: t });
    }

    await t.commit();

    // Obtener la reserva con sus relaciones para la respuesta
    const reservaCompleta = await Reserva.findByPk(reserva.id, {
      include: [
        {
          model: Cliente,
          as: 'clientes',
          through: { attributes: ['tipo_cliente'] }
        },
        {
          model: Tour,
          as: 'tour'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      reserva: reservaCompleta
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al crear la reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la reserva',
      error: error.message,
    });
  }
};

// Actualizar una reserva existente
exports.actualizarReserva = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      tour_id,
      clientes = [],
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
      // Nuevos campos para tour personalizado
      tour_nombre,
      tour_destino,
      tour_descripcion,
      fecha_inicio,
      fecha_fin,
      moneda_precio_unitario
    } = req.body;

    // Buscar la reserva existente
    const reserva = await Reserva.findByPk(id, { transaction: t });
    if (!reserva) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada',
      });
    }

    // Validar que se proporcione un tour_id o datos de tour personalizado
    if (!tour_id && !(tour_nombre && tour_destino)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Se requiere un tour existente o los datos completos de un tour personalizado',
      });
    }

    // Si se proporciona un tour_id, verificar que exista
    if (tour_id) {
      const tour = await Tour.findByPk(tour_id, { transaction: t });
      if (!tour) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'El tour especificado no existe',
        });
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
      // Agregar datos de tour personalizado si no hay tour_id
      ...(!tour_id && {
        tour_nombre,
        tour_destino,
        tour_descripcion,
        fecha_inicio,
        fecha_fin
      }),
      // Limpiar datos de tour personalizado si se está cambiando a un tour existente
      ...(tour_id && {
        tour_nombre: null,
        tour_destino: null,
        tour_descripcion: null,
        fecha_inicio: null,
        fecha_fin: null
      })
    };

    await reserva.update(reservaData, { transaction: t });

    // Actualizar clientes si se proporcionan
    if (clientes && clientes.length > 0) {
      // Eliminar relaciones existentes
      await reserva.setClientes([], { transaction: t });

      // Agregar los nuevos clientes
      for (const [index, clienteData] of clientes.entries()) {
        const esTitular = index === 0; // El primer cliente es el titular
        
        // Verificar si el cliente ya existe
        const clienteIdProvided = clienteData?.id;
        const emailProvided = (clienteData.email || '').trim();
        const dniProvided = (clienteData.dni || '').toString().trim();

        let clienteDB = null;
        if (clienteIdProvided !== undefined && clienteIdProvided !== null && String(clienteIdProvided).trim() !== '') {
          clienteDB = await Cliente.findByPk(clienteIdProvided, { transaction: t });
        }
        if (emailProvided) {
          clienteDB = await Cliente.findOne({
            where: { email: emailProvided },
            transaction: t
          });
        } else if (dniProvided) {
          clienteDB = await Cliente.findOne({
            where: { dni: dniProvided },
            transaction: t
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
          }, { transaction: t });
        }

        // Asociar cliente a la reserva
        await reserva.addCliente(clienteDB, { 
          through: { 
            tipo_cliente: esTitular ? 'titular' : 'acompanante',
            created_at: new Date(),
            updated_at: new Date()
          },
          transaction: t 
        });
      }
    }

    // Actualizar cuotas si se modifican los montos o número de cuotas
    if (monto_seña !== undefined || cantidad_cuotas !== undefined || precio_unitario !== undefined || cantidad_personas !== undefined) {
      const montoTotalCalculado = Number(reserva.cantidad_personas) * Number(reserva.precio_unitario);
      const montoSenaNumber = monto_seña === undefined || monto_seña === null || monto_seña === '' ? 0 : Number(monto_seña);
      const cuotasCount = Number(cantidad_cuotas || 1);

      // Buscar o crear la cuenta corriente de la reserva
      let cuentaCorriente = await CuentaCorriente.findOne({
        where: { reserva_id: reserva.id },
        transaction: t
      });

      if (!cuentaCorriente) {
        // Determinar cliente titular (primer cliente asociado)
        const clientesReserva = await reserva.getClientes({ transaction: t });
        const titular = Array.isArray(clientesReserva) && clientesReserva.length > 0 ? clientesReserva[0] : null;
        if (!titular) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: 'No se pudo determinar el cliente titular para generar la cuenta corriente',
          });
        }

        cuentaCorriente = await CuentaCorriente.create({
          reserva_id: reserva.id,
          cliente_id: titular.id,
          monto_total: montoTotalCalculado,
          saldo_pendiente: Math.max(0, montoTotalCalculado - montoSenaNumber),
          cantidad_cuotas: cuotasCount,
          estado: 'pendiente',
          fecha_creacion: new Date(),
          fecha_actualizacion: new Date(),
        }, { transaction: t });
      } else {
        await cuentaCorriente.update({
          monto_total: montoTotalCalculado,
          saldo_pendiente: Math.max(0, montoTotalCalculado - montoSenaNumber),
          cantidad_cuotas: cuotasCount,
          fecha_actualizacion: new Date(),
        }, { transaction: t });
      }

      // Eliminar cuotas existentes
      await Cuota.destroy({
        where: { cuenta_corriente_id: cuentaCorriente.id },
        transaction: t
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

        await Cuota.bulkCreate(cuotas, { transaction: t });
      }
    }

    await t.commit();

    // Obtener la reserva actualizada con sus relaciones
    const reservaActualizada = await Reserva.findByPk(reserva.id, {
      include: [
        {
          model: Cliente,
          as: 'clientes',
          through: { attributes: ['tipo_cliente'] }
        },
        {
          model: Tour,
          as: 'tour'
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Reserva actualizada exitosamente',
      reserva: reservaActualizada
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar la reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la reserva',
      error: error.message,
    });
  }
};
