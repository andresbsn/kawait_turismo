const clienteService = require('../../services/cliente.service');
const { Cliente } = require('../../models');
const { ConflictError, NotFoundError } = require('../../middlewares/errorHandler');

jest.mock('../../models', () => ({
  Cliente: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn()
  }
}));

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

describe('ClienteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getClientes', () => {
    it('debe retornar clientes con paginación', async () => {
      const mockResult = {
        data: [
          { id: 1, nombre: 'Juan', apellido: 'Pérez' },
          { id: 2, nombre: 'María', apellido: 'García' }
        ],
        pagination: { total: 2, page: 1, totalPages: 1 }
      };

      paginate.mockResolvedValue(mockResult);

      const result = await clienteService.getClientes({ page: 1, limit: 10 });

      expect(result).toEqual(mockResult);
      expect(paginate).toHaveBeenCalled();
    });
  });

  describe('buscarClientes', () => {
    it('debe retornar array vacío si búsqueda es muy corta', async () => {
      const result = await clienteService.buscarClientes('J');

      expect(result).toEqual([]);
      expect(Cliente.findAll).not.toHaveBeenCalled();
    });

    it('debe buscar clientes con término válido', async () => {
      const mockClientes = [
        { id: 1, nombre: 'Juan', apellido: 'Pérez' }
      ];

      Cliente.findAll.mockResolvedValue(mockClientes);

      const result = await clienteService.buscarClientes('Juan');

      expect(result).toEqual(mockClientes);
      expect(Cliente.findAll).toHaveBeenCalled();
    });
  });

  describe('createCliente', () => {
    it('debe crear un cliente nuevo', async () => {
      const mockData = {
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@example.com',
        dni: '12345678'
      };

      Cliente.findOne.mockResolvedValue(null);
      Cliente.create.mockResolvedValue({ id: 1, ...mockData });

      const result = await clienteService.createCliente(mockData);

      expect(result.id).toBe(1);
      expect(Cliente.create).toHaveBeenCalledWith(mockData, expect.objectContaining({ transaction: undefined }));
    });

    it('debe lanzar ConflictError si email ya existe', async () => {
      const mockData = {
        email: 'existing@example.com',
        dni: '12345678'
      };

      Cliente.findOne.mockResolvedValue({ id: 1, email: 'existing@example.com' });

      await expect(clienteService.createCliente(mockData)).rejects.toThrow(ConflictError);
      await expect(clienteService.createCliente(mockData)).rejects.toThrow('Ya existe un cliente con este email');
    });

    it('debe lanzar ConflictError si DNI ya existe', async () => {
      const mockData = {
        email: 'new@example.com',
        dni: '12345678'
      };

      Cliente.findOne.mockResolvedValue({ id: 1, dni: '12345678' });

      await expect(clienteService.createCliente(mockData)).rejects.toThrow(ConflictError);
      await expect(clienteService.createCliente(mockData)).rejects.toThrow('Ya existe un cliente con este DNI');
    });
  });

  describe('updateCliente', () => {
    it('debe actualizar un cliente existente', async () => {
      const mockCliente = {
        id: 1,
        nombre: 'Juan',
        update: jest.fn().mockResolvedValue({ id: 1, nombre: 'Juan Actualizado' })
      };

      Cliente.findByPk.mockResolvedValue(mockCliente);
      Cliente.findOne.mockResolvedValue(null);

      await clienteService.updateCliente(1, { nombre: 'Juan Actualizado', email: 'juan@example.com', dni: '12345678' });

      expect(mockCliente.update).toHaveBeenCalled();
    });

    it('debe lanzar ConflictError si email ya existe en otro cliente', async () => {
      Cliente.findByPk.mockResolvedValue({ id: 1 });
      Cliente.findOne.mockResolvedValue({ id: 2, email: 'existing@example.com' });

      await expect(
        clienteService.updateCliente(1, { email: 'existing@example.com', dni: '12345678' })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteCliente', () => {
    it('debe eliminar un cliente', async () => {
      const mockCliente = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };

      Cliente.findByPk.mockResolvedValue(mockCliente);

      await clienteService.deleteCliente(1);

      expect(mockCliente.destroy).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundError si cliente no existe', async () => {
      Cliente.findByPk.mockResolvedValue(null);

      await expect(clienteService.deleteCliente(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getClienteByEmail', () => {
    it('debe buscar cliente por email', async () => {
      const mockCliente = { id: 1, email: 'test@example.com' };
      Cliente.findOne.mockResolvedValue(mockCliente);

      const result = await clienteService.getClienteByEmail('test@example.com');

      expect(result).toEqual(mockCliente);
      expect(Cliente.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'test@example.com' }
        })
      );
    });
  });

  describe('getClienteByDNI', () => {
    it('debe buscar cliente por DNI', async () => {
      const mockCliente = { id: 1, dni: '12345678' };
      Cliente.findOne.mockResolvedValue(mockCliente);

      const result = await clienteService.getClienteByDNI('12345678');

      expect(result).toEqual(mockCliente);
      expect(Cliente.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { dni: '12345678' }
        })
      );
    });
  });
});
