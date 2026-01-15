const BaseService = require('../../services/BaseService');
const { NotFoundError } = require('../../middlewares/errorHandler');

// Mock del modelo de Sequelize
const mockModel = {
  findByPk: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findAndCountAll: jest.fn(),
  create: jest.fn(),
  count: jest.fn(),
  findOrCreate: jest.fn()
};

describe('BaseService', () => {
  let service;

  beforeEach(() => {
    service = new BaseService(mockModel, 'TestModel');
    jest.clearAllMocks();
  });

  describe('getById', () => {
    it('debe retornar un registro por ID', async () => {
      const mockRecord = { id: 1, name: 'Test' };
      mockModel.findByPk.mockResolvedValue(mockRecord);

      const result = await service.getById(1);

      expect(result).toEqual(mockRecord);
      expect(mockModel.findByPk).toHaveBeenCalledWith(1, { include: [], attributes: undefined });
    });

    it('debe lanzar NotFoundError si no existe el registro', async () => {
      mockModel.findByPk.mockResolvedValue(null);

      await expect(service.getById(999)).rejects.toThrow(NotFoundError);
      await expect(service.getById(999)).rejects.toThrow('TestModel no encontrado');
    });

    it('debe aceptar opciones de include y attributes', async () => {
      const mockRecord = { id: 1, name: 'Test' };
      mockModel.findByPk.mockResolvedValue(mockRecord);

      await service.getById(1, {
        include: ['relation'],
        attributes: ['id', 'name']
      });

      expect(mockModel.findByPk).toHaveBeenCalledWith(1, {
        include: ['relation'],
        attributes: ['id', 'name']
      });
    });
  });

  describe('create', () => {
    it('debe crear un nuevo registro', async () => {
      const mockData = { name: 'New Test' };
      const mockCreated = { id: 1, ...mockData };
      mockModel.create.mockResolvedValue(mockCreated);

      const result = await service.create(mockData);

      expect(result).toEqual(mockCreated);
      expect(mockModel.create).toHaveBeenCalledWith(mockData, { transaction: undefined });
    });

    it('debe pasar la transacción si se proporciona', async () => {
      const mockData = { name: 'New Test' };
      const mockTransaction = { id: 'transaction-1' };
      mockModel.create.mockResolvedValue({ id: 1, ...mockData });

      await service.create(mockData, { transaction: mockTransaction });

      expect(mockModel.create).toHaveBeenCalledWith(mockData, { transaction: mockTransaction });
    });
  });

  describe('update', () => {
    it('debe actualizar un registro existente', async () => {
      const mockRecord = {
        id: 1,
        name: 'Old Name',
        update: jest.fn().mockResolvedValue({ id: 1, name: 'New Name' })
      };
      mockModel.findByPk.mockResolvedValue(mockRecord);

      const result = await service.update(1, { name: 'New Name' });

      expect(mockRecord.update).toHaveBeenCalledWith({ name: 'New Name' }, { transaction: undefined });
      expect(mockModel.findByPk).toHaveBeenCalledWith(1, { transaction: undefined });
    });

    it('debe lanzar NotFoundError si no existe el registro', async () => {
      mockModel.findByPk.mockResolvedValue(null);

      await expect(service.update(999, { name: 'Test' })).rejects.toThrow(NotFoundError);
    });

    it('debe recargar con includes si se especifican', async () => {
      const mockRecord = {
        id: 1,
        name: 'Test',
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue({ id: 1, name: 'Updated', relation: {} })
      };
      mockModel.findByPk.mockResolvedValue(mockRecord);

      await service.update(1, { name: 'Updated' }, { include: ['relation'] });

      expect(mockRecord.reload).toHaveBeenCalledWith({ include: ['relation'], transaction: undefined });
    });
  });

  describe('delete', () => {
    it('debe eliminar un registro', async () => {
      const mockRecord = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      mockModel.findByPk.mockResolvedValue(mockRecord);

      const result = await service.delete(1);

      expect(result).toEqual(mockRecord);
      expect(mockRecord.destroy).toHaveBeenCalledWith({ transaction: undefined, force: false });
    });

    it('debe lanzar NotFoundError si no existe el registro', async () => {
      mockModel.findByPk.mockResolvedValue(null);

      await expect(service.delete(999)).rejects.toThrow(NotFoundError);
    });

    it('debe forzar eliminación si se especifica', async () => {
      const mockRecord = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      mockModel.findByPk.mockResolvedValue(mockRecord);

      await service.delete(1, { force: true });

      expect(mockRecord.destroy).toHaveBeenCalledWith({ transaction: undefined, force: true });
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los registros con opciones', async () => {
      const mockRecords = [{ id: 1 }, { id: 2 }];
      mockModel.findAll.mockResolvedValue(mockRecords);

      const result = await service.findAll({
        where: { active: true },
        limit: 10
      });

      expect(result).toEqual(mockRecords);
      expect(mockModel.findAll).toHaveBeenCalledWith({
        where: { active: true },
        include: [],
        order: [['createdAt', 'DESC']],
        attributes: undefined,
        limit: 10,
        offset: undefined
      });
    });
  });

  describe('findOne', () => {
    it('debe retornar un registro que coincida', async () => {
      const mockRecord = { id: 1, email: 'test@example.com' };
      mockModel.findOne.mockResolvedValue(mockRecord);

      const result = await service.findOne({
        where: { email: 'test@example.com' }
      });

      expect(result).toEqual(mockRecord);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: [],
        attributes: undefined
      });
    });
  });

  describe('count', () => {
    it('debe retornar el conteo de registros', async () => {
      mockModel.count.mockResolvedValue(5);

      const result = await service.count({ active: true });

      expect(result).toBe(5);
      expect(mockModel.count).toHaveBeenCalledWith({ where: { active: true } });
    });
  });

  describe('exists', () => {
    it('debe retornar true si existen registros', async () => {
      mockModel.count.mockResolvedValue(1);

      const result = await service.exists({ email: 'test@example.com' });

      expect(result).toBe(true);
    });

    it('debe retornar false si no existen registros', async () => {
      mockModel.count.mockResolvedValue(0);

      const result = await service.exists({ email: 'nonexistent@example.com' });

      expect(result).toBe(false);
    });
  });

  describe('findOrCreate', () => {
    it('debe retornar el resultado de findOrCreate', async () => {
      const mockResult = [{ id: 1, email: 'test@example.com' }, true];
      mockModel.findOrCreate.mockResolvedValue(mockResult);

      const result = await service.findOrCreate({
        where: { email: 'test@example.com' },
        defaults: { name: 'Test' }
      });

      expect(result).toEqual(mockResult);
      expect(mockModel.findOrCreate).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        defaults: { name: 'Test' },
        transaction: undefined
      });
    });
  });
});
