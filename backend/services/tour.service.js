const BaseService = require('./BaseService');
const { Tour } = require('../models');
const { buildSearchCondition } = require('../utils/searchHelper');
const { NotFoundError, ValidationError } = require('../middlewares/errorHandler');

class TourService extends BaseService {
  constructor() {
    super(Tour, 'Tour');
  }

  /**
   * Obtener todos los tours con filtros
   */
  async getTours(params = {}) {
    const { page, limit, search, estado } = params;

    const where = {
      activo: true,
      ...buildSearchCondition(search, ['nombre', 'destino', 'descripcion'])
    };

    if (estado) {
      where.estado = estado;
    }

    return await this.getAll({
      page,
      limit,
      where,
      order: [['fecha_inicio', 'ASC']]
    });
  }

  /**
   * Obtener un tour por ID
   */
  async getTourById(id) {
    const tour = await this.getById(id);

    if (!tour.activo) {
      throw new NotFoundError('Tour no encontrado');
    }

    return tour;
  }

  /**
   * Crear un nuevo tour
   */
  async createTour(data) {
    return await this.create(data);
  }

  /**
   * Actualizar un tour
   */
  async updateTour(id, data) {
    const tour = await this.getById(id);

    if (!tour.activo) {
      throw new NotFoundError('Tour no encontrado');
    }

    return await this.update(id, data);
  }

  /**
   * Eliminar un tour (soft delete)
   */
  async deleteTour(id) {
    const tour = await this.getById(id);

    if (!tour.activo) {
      throw new NotFoundError('Tour no encontrado');
    }

    return await this.update(id, { activo: false });
  }

  /**
   * Obtener tours disponibles (estado: disponible)
   */
  async getToursDisponibles(params = {}) {
    const { page, limit, search } = params;

    const where = {
      activo: true,
      estado: 'disponible',
      ...buildSearchCondition(search, ['nombre', 'destino', 'descripcion'])
    };

    return await this.getAll({
      page,
      limit,
      where,
      order: [['fecha_inicio', 'ASC']]
    });
  }

  /**
   * Verificar disponibilidad de cupos
   */
  async verificarDisponibilidad(tourId, cantidadPersonas) {
    const tour = await this.getTourById(tourId);

    const cuposDisponibles = tour.cupos_totales - (tour.cupos_reservados || 0);

    return {
      disponible: cuposDisponibles >= cantidadPersonas,
      cuposDisponibles,
      cuposSolicitados: cantidadPersonas
    };
  }

  /**
   * Actualizar cupos reservados
   */
  async actualizarCupos(tourId, cantidad, options = {}) {
    const { transaction } = options;
    const tour = await this.model.findByPk(tourId, { transaction });

    if (!tour) {
      throw new NotFoundError('Tour no encontrado');
    }

    const nuevosCuposReservados = (tour.cupos_reservados || 0) + cantidad;

    if (nuevosCuposReservados > tour.cupos_totales) {
      throw new ValidationError('No hay suficientes cupos disponibles');
    }

    await tour.update(
      { cupos_reservados: nuevosCuposReservados },
      { transaction }
    );

    return tour;
  }
}

module.exports = new TourService();
