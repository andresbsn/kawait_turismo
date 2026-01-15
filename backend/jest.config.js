module.exports = {
  // Entorno de prueba
  testEnvironment: 'node',

  // Patrón de archivos de test
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Cobertura de código
  collectCoverageFrom: [
    'services/**/*.js',
    'controllers/**/*.js',
    'utils/**/*.js',
    'middlewares/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],

  // Directorio de cobertura
  coverageDirectory: 'coverage',

  // Reportes de cobertura
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Configuración de timeout
  testTimeout: 10000,

  // Limpiar mocks automáticamente
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js']
};
