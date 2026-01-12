// backend/controllers/cliente.controller.js
const { Cliente } = require('../models');
const { Op } = require('sequelize');

/**
 * @route   GET /api/clientes
 * @desc    Obtener todos los clientes
 * @access  Private/Admin
 */
const obtenerClientes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { apellido: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { dni: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: clientes } = await Cliente.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });

    res.json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      clientes
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ mensaje: 'Error al obtener clientes', error: error.message });
  }
};

/**
 * @route   GET /api/clientes/buscar
 * @desc    Buscar clientes por término de búsqueda
 * @access  Private/Admin
 */
const buscarClientes = async (req, res) => {
  try {
    const { busqueda = '' } = req.query;
    
    if (!busqueda || busqueda.length < 2) {
      return res.json({ success: true, clientes: [] });
    }

    const clientes = await Cliente.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.iLike]: `%${busqueda}%` } },
          { apellido: { [Op.iLike]: `%${busqueda}%` } },
          { email: { [Op.iLike]: `%${busqueda}%` } },
          { telefono: { [Op.iLike]: `%${busqueda}%` } }
        ]
      },
      limit: 10,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });

    res.json({ success: true, clientes });
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({ success: false, message: 'Error al buscar clientes', error: error.message });
  }
};

/**
 * @route   GET /api/clientes/:id
 * @desc    Obtener un cliente por ID
 * @access  Private/Admin
 */
const obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    res.json(cliente);
  } catch (error) {
    console.error('Error al obtener el cliente:', error);
    res.status(500).json({ mensaje: 'Error al obtener el cliente', error: error.message });
  }
};

/**
 * @route   POST /api/clientes
 * @desc    Crear un nuevo cliente
 * @access  Private/Admin
 */
const crearCliente = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, direccion, dni, fechaNacimiento } = req.body;
    
    // Verificar si el email o DNI ya existen
    const clienteExistente = await Cliente.findOne({
      where: {
        [Op.or]: [
          { email },
          { dni }
        ]
      }
    });

    if (clienteExistente) {
      return res.status(400).json({ 
        mensaje: 'Ya existe un cliente con este email o DNI',
        error: 'CLIENTE_DUPLICADO'
      });
    }

    const nuevoCliente = await Cliente.create({
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      dni,
      fechaNacimiento
    });

    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error('Error al crear el cliente:', error);
    res.status(500).json({ mensaje: 'Error al crear el cliente', error: error.message });
  }
};

/**
 * @route   PUT /api/clientes/:id
 * @desc    Actualizar un cliente existente
 * @access  Private/Admin
 */
const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, direccion, dni, fechaNacimiento } = req.body;

    const cliente = await Cliente.findByPk(id);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Verificar si el email o DNI ya existen en otros clientes
    const clienteExistente = await Cliente.findOne({
      where: {
        [Op.or]: [
          { email },
          { dni }
        ],
        id: { [Op.ne]: id } // Excluir el cliente actual
      }
    });

    if (clienteExistente) {
      return res.status(400).json({ 
        mensaje: 'Ya existe otro cliente con este email o DNI',
        error: 'CLIENTE_DUPLICADO'
      });
    }

    await cliente.update({
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      dni,
      fechaNacimiento
    });

    res.json(cliente);
  } catch (error) {
    console.error('Error al actualizar el cliente:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el cliente', error: error.message });
  }
};

/**
 * @route   DELETE /api/clientes/:id
 * @desc    Eliminar un cliente
 * @access  Private/Admin
 */
const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await Cliente.findByPk(id);
    
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    await cliente.destroy();
    res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el cliente:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el cliente', error: error.message });
  }
};

// Asegurarse de que todas las funciones estén correctamente definidas y exportadas
const clienteController = {
  obtenerClientes,
  buscarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente
};

module.exports = clienteController;
