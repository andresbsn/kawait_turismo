require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./models');
const sequelize = db.sequelize;

const app = express();

// Configuración de CORS
const allowedOrigins = String(process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://localhost')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman, curl, o peticiones del mismo servidor)
    if (!origin) {
      return callback(null, true);
    }

    // En desarrollo, permitir todos los orígenes localhost
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // Verificar si el origin está en la lista de permitidos
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS bloqueado para origen:', origin);
      console.log('Orígenes permitidos:', allowedOrigins);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With', 'Pragma', 'x-token'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'x-token', 'Authorization'],
  maxAge: 86400 // 24 horas
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Kawai Turismo' });
});

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const clienteRoutes = require('./routes/cliente.routes');
const tourRoutes = require('./routes/tour.routes');
const reservaRoutes = require('./routes/reserva.routes');
const cuentaCorrienteRoutes = require('./routes/cuentaCorriente.routes');
const cuotaRoutes = require('./routes/cuota.routes');
const pagoRoutes = require('./routes/pago.routes');
const reportesRoutes = require('./routes/reportes.routes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/cuentas-corrientes', cuentaCorrienteRoutes);
app.use('/api/cuotas', cuotaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/reportes', reportesRoutes);

// Middleware de manejo de errores centralizado
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

// Ruta no encontrada (debe ir antes del errorHandler)
app.use(notFoundHandler);

// Manejador de errores (debe ser el último middleware)
app.use(errorHandler);

// Sincronizar base de datos y arrancar servidor
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Sincronizar la base de datos (solo verifica la conexión por defecto)
    await db.syncDatabase();

    // Iniciar el servidor
    const server = app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
      console.log('✅ Conexión a la base de datos establecida correctamente.');
    });

    // Manejar cierre del servidor
    process.on('SIGTERM', () => {
      console.log('Recibido SIGTERM. Cerrando servidor...');
      server.close(() => {
        console.log('Servidor cerrado.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
