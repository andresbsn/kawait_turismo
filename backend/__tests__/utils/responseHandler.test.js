const {
  success,
  error,
  notFound,
  validationError,
  unauthorized,
  forbidden,
  conflict,
  paginated
} = require('../../utils/responseHandler');

describe('ResponseHandler', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('success', () => {
    it('debe retornar respuesta exitosa con código 200', () => {
      const data = { user: { id: 1, name: 'Test' } };
      
      success(mockRes, data, 'Operación exitosa');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operación exitosa',
        ...data
      });
    });

    it('debe aceptar código de estado personalizado', () => {
      success(mockRes, { id: 1 }, 'Creado', 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('debe usar mensaje por defecto si no se proporciona', () => {
      success(mockRes, { id: 1 });

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Operación exitosa'
        })
      );
    });
  });

  describe('error', () => {
    it('debe retornar respuesta de error con código 500', () => {
      error(mockRes, 'Error interno');

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno'
      });
    });

    it('debe aceptar código de estado personalizado', () => {
      error(mockRes, 'Error personalizado', 400);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('notFound', () => {
    it('debe retornar respuesta 404', () => {
      notFound(mockRes, 'Recurso');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Recurso no encontrado'
      });
    });

    it('debe usar mensaje por defecto', () => {
      notFound(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Recurso no encontrado'
        })
      );
    });
  });

  describe('validationError', () => {
    it('debe retornar error de validación con código 400', () => {
      const errors = [{ field: 'email', message: 'Email inválido' }];
      
      validationError(mockRes, errors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        errors
      });
    });
  });

  describe('unauthorized', () => {
    it('debe retornar respuesta 401', () => {
      unauthorized(mockRes, 'No autorizado');

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'No autorizado'
      });
    });
  });

  describe('forbidden', () => {
    it('debe retornar respuesta 403', () => {
      forbidden(mockRes, 'Acceso denegado');

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Acceso denegado'
      });
    });
  });

  describe('conflict', () => {
    it('debe retornar respuesta 409', () => {
      conflict(mockRes, 'Recurso ya existe');

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Recurso ya existe'
      });
    });
  });

  describe('paginated', () => {
    it('debe retornar respuesta paginada', () => {
      const data = {
        items: [{ id: 1 }, { id: 2 }],
        total: 100,
        page: 1,
        totalPages: 10
      };

      paginated(mockRes, data, 'Datos obtenidos');

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Datos obtenidos',
        ...data
      });
    });
  });
});
