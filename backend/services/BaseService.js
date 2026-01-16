const { paginate, getPaginationParams } = require('../utils/paginationHelper');
const { buildSearchCondition } = require('../utils/searchHelper');
const { NotFoundError, ValidationError } = require('../middlewares/errorHandler');

/**
 * Clase base para servicios
 * Proporciona métodos comunes para operaciones CRUD
 */
class BaseService {
  constructor(model, modelName = 'Recurso') {
    this.model = model;
    this.modelName = modelName;
  }

  /**
   * Obtener todos los registros con paginación
   */
  async getAll(options = {}) {
    const {
      page,
      limit,
      where = {},
      include = [],
      order = [['id', 'DESC']],
      attributes
    } = options;

    return await paginate(this.model, {
      page,
      limit,
      where,
      include,
      order,
      attributes
    });
  }

  /**
   * Obtener un registro por ID
   */
  async getById(id, options = {}) {
    const { include = [], attributes } = options;

    const record = await this.model.findByPk(id, {
      include,
      attributes
    });

    if (!record) {
      throw new NotFoundError(`${this.modelName} no encontrado`);
    }

    return record;
  }

  /**
   * Crear un nuevo registro
   */
  async create(data, options = {}) {
    const { transaction } = options;
    return await this.model.create(data, { transaction });
  }

  /**
   * Actualizar un registro
   */
  async update(id, data, options = {}) {
    const { transaction, include = [] } = options;

    const record = await this.model.findByPk(id, { transaction });

    if (!record) {
      throw new NotFoundError(`${this.modelName} no encontrado`);
    }

    await record.update(data, { transaction });

    // Recargar con includes si se especificaron
    if (include.length > 0) {
      await record.reload({ include, transaction });
    }

    return record;
  }

  /**
   * Eliminar un registro (soft delete si el modelo lo soporta)
   */
  async delete(id, options = {}) {
    const { transaction, force = false } = options;

    const record = await this.model.findByPk(id, { transaction });

    if (!record) {
      throw new NotFoundError(`${this.modelName} no encontrado`);
    }

    await record.destroy({ transaction, force });

    return record;
  }

  /**
   * Buscar registros con condiciones
   */
  async findAll(options = {}) {
    const {
      where = {},
      include = [],
      order = [['id', 'DESC']],
      attributes,
      limit,
      offset
    } = options;

    return await this.model.findAll({
      where,
      include,
      order,
      attributes,
      limit,
      offset
    });
  }

  /**
   * Buscar un registro con condiciones
   */
  async findOne(options = {}) {
    const { where = {}, include = [], attributes } = options;

    return await this.model.findOne({
      where,
      include,
      attributes
    });
  }

  /**
   * Contar registros
   */
  async count(where = {}) {
    return await this.model.count({ where });
  }

  /**
   * Verificar si existe un registro
   */
  async exists(where = {}) {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Buscar o crear un registro
   */
  async findOrCreate(options = {}) {
    const { where, defaults, transaction } = options;
    return await this.model.findOrCreate({
      where,
      defaults,
      transaction
    });
  }
}

module.exports = BaseService;
