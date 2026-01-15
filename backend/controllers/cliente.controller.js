// backend/controllers/cliente.controller.js
const clienteService = require('../services/cliente.service');
const asyncHandler = require('../utils/asyncHandler');
const { success, paginated } = require('../utils/responseHandler');

/**
 * @route   GET /api/clientes
 * @desc    Obtener todos los clientes
 * @access  Private/Admin
 */
const obtenerClientes = asyncHandler(async (req, res) => {
  const result = await clienteService.getClientes(req.query);
  
  const response = {
    clientes: result.data,
    ...result.pagination
  };
  
  return paginated(res, response, 'Clientes obtenidos exitosamente');
});

/**
 * @route   GET /api/clientes/buscar
 * @desc    Buscar clientes por término de búsqueda
 * @access  Private/Admin
 */
const buscarClientes = asyncHandler(async (req, res) => {
  const clientes = await clienteService.buscarClientes(req.query.busqueda);
  return success(res, { clientes }, 'Clientes encontrados');
});

/**
 * @route   GET /api/clientes/:id
 * @desc    Obtener un cliente por ID
 * @access  Private/Admin
 */
const obtenerClientePorId = asyncHandler(async (req, res) => {
  const cliente = await clienteService.getClienteById(req.params.id);
  return success(res, { cliente }, 'Cliente obtenido correctamente');
});

/**
 * @route   POST /api/clientes
 * @desc    Crear un nuevo cliente
 * @access  Private/Admin
 */
const crearCliente = asyncHandler(async (req, res) => {
  const nuevoCliente = await clienteService.createCliente(req.body);
  return success(res, { cliente: nuevoCliente }, 'Cliente creado exitosamente', 201);
});

/**
 * @route   PUT /api/clientes/:id
 * @desc    Actualizar un cliente existente
 * @access  Private/Admin
 */
const actualizarCliente = asyncHandler(async (req, res) => {
  const cliente = await clienteService.updateCliente(req.params.id, req.body);
  return success(res, { cliente }, 'Cliente actualizado exitosamente');
});

/**
 * @route   DELETE /api/clientes/:id
 * @desc    Eliminar un cliente
 * @access  Private/Admin
 */
const eliminarCliente = asyncHandler(async (req, res) => {
  await clienteService.deleteCliente(req.params.id);
  return success(res, {}, 'Cliente eliminado correctamente');
});

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
