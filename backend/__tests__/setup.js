// Setup global para tests
require('dotenv').config({ path: '.env.test' });

// Configurar timeout global
jest.setTimeout(10000);

// Mock de console para tests más limpios (opcional)
global.console = {
  ...console,
  // Descomentar para silenciar logs en tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(),
};

// Helpers globales para tests
global.testHelpers = {
  // Helper para crear datos de prueba
  createMockUser: () => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    active: true
  }),

  createMockTour: () => ({
    id: 1,
    nombre: 'Tour Test',
    destino: 'Test Destination',
    descripcion: 'Test description',
    precio: 1000,
    cupos_totales: 20,
    cupos_reservados: 0,
    estado: 'disponible',
    activo: true
  }),

  createMockCliente: () => ({
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@example.com',
    dni: '12345678',
    telefono: '123456789'
  })
};

// Cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
