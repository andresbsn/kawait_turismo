const BaseService = require('./BaseService');
const { User } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { buildSearchCondition } = require('../utils/searchHelper');
const { ConflictError, ValidationError } = require('../middlewares/errorHandler');

class UsuarioService extends BaseService {
  constructor() {
    super(User, 'Usuario');
  }

  /**
   * Obtener todos los usuarios con paginación y búsqueda
   */
  async getUsuarios(params = {}) {
    const { page, limit, search } = params;

    const where = buildSearchCondition(search, ['username', 'email']);

    return await this.getAll({
      page,
      limit,
      where,
      attributes: {
        exclude: ['password']
      },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Obtener un usuario por ID (sin password)
   */
  async getUsuarioById(id) {
    return await this.getById(id, {
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * Crear un nuevo usuario
   */
  async createUsuario(data) {
    const { username, email, password } = data;

    // Verificar duplicados
    await this.verificarDuplicados(username, email);

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    return await this.create({
      ...data,
      password: hashedPassword
    });
  }

  /**
   * Actualizar un usuario
   */
  async updateUsuario(id, data) {
    const { username, email, password } = data;

    // Verificar duplicados (excluyendo el usuario actual)
    await this.verificarDuplicados(username, email, id);

    // Si se proporciona nueva contraseña, hashearla
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    } else {
      // No actualizar la contraseña si no se proporciona
      delete data.password;
    }

    return await this.update(id, data);
  }

  /**
   * Eliminar un usuario
   */
  async deleteUsuario(id, currentUserId) {
    // No permitir eliminar el propio usuario
    if (parseInt(id) === parseInt(currentUserId)) {
      throw new ValidationError('No puedes eliminar tu propio usuario');
    }

    return await this.delete(id);
  }

  /**
   * Verificar si username o email ya existen
   */
  async verificarDuplicados(username, email, excludeId = null) {
    const where = {
      [Op.or]: [{ username }, { email }]
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const usuarioExistente = await this.findOne({ where });

    if (usuarioExistente) {
      if (usuarioExistente.username === username) {
        throw new ConflictError('Ya existe un usuario con este nombre de usuario');
      }
      if (usuarioExistente.email === email) {
        throw new ConflictError('Ya existe un usuario con este email');
      }
    }
  }

  /**
   * Buscar usuario por username (incluye password para autenticación)
   */
  async getUsuarioByUsername(username) {
    return await this.findOne({
      where: { username }
    });
  }

  /**
   * Buscar usuario por email
   */
  async getUsuarioByEmail(email) {
    return await this.findOne({
      where: { email },
      attributes: { exclude: ['password'] }
    });
  }

  /**
   * Verificar contraseña
   */
  async verificarPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Cambiar contraseña
   */
  async cambiarPassword(id, passwordActual, passwordNuevo) {
    const usuario = await this.model.findByPk(id);

    if (!usuario) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Verificar contraseña actual
    const passwordValido = await this.verificarPassword(passwordActual, usuario.password);

    if (!passwordValido) {
      throw new ValidationError('La contraseña actual es incorrecta');
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(passwordNuevo, 10);

    await usuario.update({ password: hashedPassword });

    return usuario;
  }

  /**
   * Activar/Desactivar usuario
   */
  async toggleActive(id) {
    const usuario = await this.getById(id);
    return await this.update(id, { active: !usuario.active });
  }
}

module.exports = new UsuarioService();
