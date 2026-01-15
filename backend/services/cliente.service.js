const BaseService = require('./BaseService');
const { Cliente } = require('../models');
const { Op } = require('sequelize');
const { buildSearchCondition } = require('../utils/searchHelper');
const { ConflictError } = require('../middlewares/errorHandler');

class ClienteService extends BaseService {
  constructor() {
    super(Cliente, 'Cliente');
  }

  /**
   * Obtener todos los clientes con paginación y búsqueda
   */
  async getClientes(params = {}) {
    const { page, limit, search } = params;

    const where = buildSearchCondition(search, ['nombre', 'apellido', 'email', 'dni']);

    return await this.getAll({
      page,
      limit,
      where,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });
  }

  /**
   * Buscar clientes (para autocomplete)
   */
  async buscarClientes(busqueda) {
    if (!busqueda || busqueda.length < 2) {
      return [];
    }

    const where = buildSearchCondition(busqueda, ['nombre', 'apellido', 'email', 'telefono']);

    return await this.findAll({
      where,
      limit: 10,
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });
  }

  /**
   * Obtener un cliente por ID
   */
  async getClienteById(id) {
    return await this.getById(id);
  }

  /**
   * Crear un nuevo cliente
   */
  async createCliente(data) {
    const { email, dni } = data;

    // Verificar si el email o DNI ya existen
    await this.verificarDuplicados(email, dni);

    return await this.create(data);
  }

  /**
   * Actualizar un cliente
   */
  async updateCliente(id, data) {
    const { email, dni } = data;

    // Verificar si el email o DNI ya existen en otros clientes
    await this.verificarDuplicados(email, dni, id);

    return await this.update(id, data);
  }

  /**
   * Eliminar un cliente
   */
  async deleteCliente(id) {
    return await this.delete(id);
  }

  /**
   * Verificar si email o DNI ya existen
   */
  async verificarDuplicados(email, dni, excludeId = null) {
    const where = {
      [Op.or]: [{ email }, { dni }]
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const clienteExistente = await this.findOne({ where });

    if (clienteExistente) {
      if (clienteExistente.email === email) {
        throw new ConflictError('Ya existe un cliente con este email');
      }
      if (clienteExistente.dni === dni) {
        throw new ConflictError('Ya existe un cliente con este DNI');
      }
    }
  }

  /**
   * Buscar cliente por email
   */
  async getClienteByEmail(email) {
    return await this.findOne({
      where: { email }
    });
  }

  /**
   * Buscar cliente por DNI
   */
  async getClienteByDNI(dni) {
    return await this.findOne({
      where: { dni }
    });
  }

  /**
   * Obtener clientes con reservas
   */
  async getClientesConReservas(params = {}) {
    const { page, limit } = params;

    return await this.getAll({
      page,
      limit,
      include: [
        {
          association: 'reservas',
          required: true
        }
      ],
      order: [['apellido', 'ASC'], ['nombre', 'ASC']]
    });
  }
}

module.exports = new ClienteService();
