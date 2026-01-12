require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./models');
const sequelize = db.sequelize;

const app = express();

// Configuración de CORS
const allowedOrigins = String(process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Middleware de CORS personalizado
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, x-token');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, x-token, Authorization');
    
    // Manejar solicitudes de preflight
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Max-Age', '86400'); // 24 horas
      return res.status(200).end();
    }
  }
  
  next();
});

// Configuración de CORS para rutas específicas
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With', 'Pragma'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'x-token', 'Authorization'],
  maxAge: 86400 // 24 horas
};

// Aplicar CORS con las opciones configuradas
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a la API de Kawait Turismo' });
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

// Manejador de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

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
