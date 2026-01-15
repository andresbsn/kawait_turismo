const tourService = require('../../services/tour.service');
const { Tour } = require('../../models');
const { NotFoundError, ValidationError } = require('../../middlewares/errorHandler');

// Mock del modelo Tour
jest.mock('../../models', () => ({
  Tour: {
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn()
  }
}));

// Mock de helpers
jest.mock('../../utils/paginationHelper', () => ({
  paginate: jest.fn()
}));

jest.mock('../../utils/searchHelper', () => ({
  buildSearchCondition: jest.fn((search, fields) => {
    if (!search) return {};
    return { searchCondition: true };
  })
}));

const { paginate } = require('../../utils/paginationHelper');

describe('TourService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTours', () => {
    it('debe retornar tours con paginación', async () => {
      const mockResult = {
        data: [
          { id: 1, nombre: 'Tour 1', activo: true },
          { id: 2, nombre: 'Tour 2', activo: true }
        ],
        pagination: {
          total: 2,
          page: 1,
          totalPages: 1
        }
      };

      paginate.mockResolvedValue(mockResult);

      const result = await tourService.getTours({
        page: 1,
        limit: 10,
        search: 'Paris'
      });

      expect(result).toEqual(mockResult);
      expect(paginate).toHaveBeenCalledWith(Tour, expect.objectContaining({
        page: 1,
        limit: 10,
        order: [['fecha_inicio', 'ASC']]
      }));
    });

    it('debe filtrar por estado si se proporciona', async () => {
      paginate.mockResolvedValue({ data: [], pagination: {} });

      await tourService.getTours({
        estado: 'disponible'
      });

      expect(paginate).toHaveBeenCalledWith(Tour, expect.objectContaining({
        where: expect.objectContaining({
          estado: 'disponible'
        })
      }));
    });
  });

  describe('getTourById', () => {
    it('debe retornar un tour por ID', async () => {
      const mockTour = {
        id: 1,
        nombre: 'Tour Test',
        activo: true
      };

      Tour.findByPk.mockResolvedValue(mockTour);

      const result = await tourService.getTourById(1);

      expect(result).toEqual(mockTour);
      expect(Tour.findByPk).toHaveBeenCalledWith(1, expect.objectContaining({ include: [] }));
    });

    it('debe lanzar NotFoundError si el tour no existe', async () => {
      Tour.findByPk.mockResolvedValue(null);

      await expect(tourService.getTourById(999)).rejects.toThrow(NotFoundError);
    });

    it('debe lanzar NotFoundError si el tour no está activo', async () => {
      Tour.findByPk.mockResolvedValue({ id: 1, activo: false });

      await expect(tourService.getTourById(1)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createTour', () => {
    it('debe crear un nuevo tour', async () => {
      const mockData = {
        nombre: 'Nuevo Tour',
        destino: 'Paris',
        precio: 1500
      };

      const mockCreated = { id: 1, ...mockData };
      Tour.create.mockResolvedValue(mockCreated);

      const result = await tourService.createTour(mockData);

      expect(result).toEqual(mockCreated);
      expect(Tour.create).toHaveBeenCalledWith(mockData, expect.objectContaining({ transaction: undefined }));
    });
  });

  describe('updateTour', () => {
    it('debe actualizar un tour existente', async () => {
      const mockTour = {
        id: 1,
        nombre: 'Tour Original',
        activo: true,
        update: jest.fn().mockResolvedValue({ id: 1, nombre: 'Tour Actualizado' })
      };

      Tour.findByPk.mockResolvedValue(mockTour);

      const result = await tourService.updateTour(1, { nombre: 'Tour Actualizado' });

      expect(mockTour.update).toHaveBeenCalledWith({ nombre: 'Tour Actualizado' }, { transaction: undefined });
    });

    it('debe lanzar NotFoundError si el tour no existe', async () => {
      Tour.findByPk.mockResolvedValue(null);

      await expect(tourService.updateTour(999, { nombre: 'Test' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteTour', () => {
    it('debe hacer soft delete de un tour', async () => {
      const mockTour = {
        id: 1,
        activo: true,
        update: jest.fn().mockResolvedValue({ id: 1, activo: false })
      };

      Tour.findByPk.mockResolvedValue(mockTour);

      await tourService.deleteTour(1);

      expect(mockTour.update).toHaveBeenCalledWith({ activo: false }, { transaction: undefined });
    });

    it('debe lanzar NotFoundError si el tour no existe', async () => {
      Tour.findByPk.mockResolvedValue(null);

      await expect(tourService.deleteTour(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('verificarDisponibilidad', () => {
    it('debe retornar disponibilidad correcta', async () => {
      const mockTour = {
        id: 1,
        cupos_totales: 20,
        cupos_reservados: 10,
        activo: true
      };

      Tour.findByPk.mockResolvedValue(mockTour);

      const result = await tourService.verificarDisponibilidad(1, 5);

      expect(result).toEqual({
        disponible: true,
        cuposDisponibles: 10,
        cuposSolicitados: 5
      });
    });

    it('debe retornar no disponible si no hay cupos suficientes', async () => {
      const mockTour = {
        id: 1,
        cupos_totales: 20,
        cupos_reservados: 18,
        activo: true
      };

      Tour.findByPk.mockResolvedValue(mockTour);

      const result = await tourService.verificarDisponibilidad(1, 5);

      expect(result).toEqual({
        disponible: false,
        cuposDisponibles: 2,
        cuposSolicitados: 5
      });
    });
  });

  describe('actualizarCupos', () => {
    it('debe actualizar los cupos reservados', async () => {
      const mockTour = {
        id: 1,
        cupos_totales: 20,
        cupos_reservados: 10,
        update: jest.fn().mockResolvedValue(true)
      };

      Tour.findByPk.mockResolvedValue(mockTour);

      await tourService.actualizarCupos(1, 5);

      expect(mockTour.update).toHaveBeenCalledWith(
        { cupos_reservados: 15 },
        { transaction: undefined }
      );
    });

    it('debe lanzar ValidationError si no hay cupos suficientes', async () => {
      const mockTour = {
        id: 1,
        cupos_totales: 20,
        cupos_reservados: 18
      };

      Tour.findByPk.mockResolvedValue(mockTour);

      await expect(tourService.actualizarCupos(1, 5)).rejects.toThrow('No hay suficientes cupos disponibles');
    });

    it('debe lanzar NotFoundError si el tour no existe', async () => {
      Tour.findByPk.mockResolvedValue(null);

      await expect(tourService.actualizarCupos(999, 5)).rejects.toThrow(NotFoundError);
    });
  });
});
