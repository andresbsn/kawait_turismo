const { Op } = require('sequelize');
const db = require('../models');
const { CuentaCorriente, Reserva, Cliente, Cuota, Tour, Pago } = db.sequelize.models;

// Obtener todas las cuentas corrientes con paginación
exports.obtenerCuentasCorrientes = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, cliente_id } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (estado) whereClause.estado = estado;
    if (cliente_id) whereClause.cliente_id = cliente_id;
    
    const { count, rows } = await CuentaCorriente.findAndCountAll({
      where: whereClause,
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
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fecha_creacion', 'DESC']]
    });
    
    res.json({
      success: true,
      total: count,
      paginas: Math.ceil(count / limit),
      pagina_actual: parseInt(page),
      cuentas: rows
    });
  } catch (error) {
    console.error('Error al obtener cuentas corrientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las cuentas corrientes',
      error: error.message
    });
  }
};

// Obtener cuentas corrientes del usuario autenticado (solo lectura)
exports.obtenerMisCuentas = async (req, res) => {
  try {
    const email = req.usuario?.email;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo determinar el email del usuario'
      });
    }

    const cliente = await Cliente.findOne({ where: { email } });
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró un cliente asociado a este usuario'
      });
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

    return res.json({
      success: true,
      cliente: { id: cliente.id, nombre: cliente.nombre, apellido: cliente.apellido, email: cliente.email },
      cuentas
    });
  } catch (error) {
    console.error('Error al obtener mis cuentas corrientes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las cuentas corrientes del usuario',
      error: error.message
    });
  }
};

// Obtener una cuenta corriente por ID
exports.obtenerCuentaCorriente = async (req, res) => {
  try {
    const { id } = req.params;
    
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
      return res.status(404).json({
        success: false,
        message: 'Cuenta corriente no encontrada'
      });
    }
    
    res.json({
      success: true,
      cuenta
    });
  } catch (error) {
    console.error('Error al obtener la cuenta corriente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la cuenta corriente',
      error: error.message
    });
  }
};

// Actualizar el estado de una cuenta corriente
exports.actualizarEstadoCuenta = async (req, res) => {
  const t = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const cuenta = await CuentaCorriente.findByPk(id, { transaction: t });
    
    if (!cuenta) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cuenta corriente no encontrada'
      });
    }
    
    // Validar que el estado sea válido
    const estadosPermitidos = ['pendiente', 'en_proceso', 'pagado', 'atrasado', 'cancelado'];
    if (!estadosPermitidos.includes(estado)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Estado no válido. Los estados permitidos son: ${estadosPermitidos.join(', ')}`
      });
    }
    
    // Actualizar el estado de la cuenta
    await cuenta.update({ estado }, { transaction: t });
    
    // Si se marca como pagada, marcar todas las cuotas como pagadas
    if (estado === 'pagado') {
      await Cuota.update(
        { estado: 'pagada_total' },
        { 
          where: { cuenta_corriente_id: id, estado: 'pendiente' },
          transaction: t
        }
      );
    }
    
    await t.commit();
    
    res.json({
      success: true,
      message: 'Estado de la cuenta actualizado correctamente',
      cuenta
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar el estado de la cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la cuenta',
      error: error.message
    });
  }
};

// Obtener cuentas corrientes por cliente
exports.obtenerCuentasPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    
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
    
    res.json({
      success: true,
      cuentas
    });
  } catch (error) {
    console.error('Error al obtener las cuentas del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las cuentas del cliente',
      error: error.message
    });
  }
};