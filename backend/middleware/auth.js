const jwt = require('jsonwebtoken');
const db = require('../models');
const { User } = db;

// Middleware para verificar el token JWT
exports.checkAuth = async (req, res, next) => {
  try {
    // Log para debugging en producción
    console.log('🔐 [AUTH] Verificando autenticación para:', req.method, req.originalUrl);
    console.log('🔐 [AUTH] Headers recibidos:', {
      authorization: req.headers.authorization ? 'Presente' : 'Ausente',
      origin: req.headers.origin,
      referer: req.headers.referer
    });
    
    // Obtener el token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ [AUTH] No se encontró token en el header Authorization');
      return res.status(401).json({ 
        ok: false, 
        message: 'No se proporcionó un token de autenticación',
        debug: process.env.NODE_ENV === 'production' ? undefined : {
          headers: req.headers
        }
      });
    }
    
    console.log('✅ [AUTH] Token encontrado, verificando...');

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_super_secreto_jwt_cambiar_en_produccion');
    console.log('✅ [AUTH] Token verificado correctamente. Datos decodificados:', {
      id: decoded.id,
      tipo: decoded.tipo,
      email: decoded.email,
      role: decoded.role
    });

    if (decoded?.tipo === 'cliente') {
      console.log('✅ [AUTH] Usuario tipo cliente autenticado');
      req.usuario = {
        email: decoded.email,
        role: decoded.role || 'USER',
        cliente_id: decoded.cliente_id
      };
      return next();
    }
    
    // Buscar el usuario en la base de datos
    if (!User) {
      console.log('❌ [AUTH] Modelo de usuario no disponible');
      return res.status(500).json({
        ok: false,
        message: 'Modelo de usuario no disponible (User)'
      });
    }

    console.log('🔍 [AUTH] Buscando usuario en BD con ID:', decoded.id);
    const usuario = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] } // No retornar la contraseña
    });

    if (!usuario) {
      console.log('❌ [AUTH] Usuario no encontrado en la base de datos');
      return res.status(401).json({ 
        ok: false, 
        message: 'Usuario no encontrado' 
      });
    }

    console.log('✅ [AUTH] Usuario autenticado correctamente:', {
      id: usuario.id,
      username: usuario.username,
      role: usuario.role
    });

    // Agregar el usuario al request para usarlo en los controladores
    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('❌ [AUTH] Error en autenticación:', {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        ok: false, 
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        ok: false, 
        message: 'Token expirado. Por favor, inicia sesión nuevamente.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(500).json({ 
      ok: false, 
      message: 'Error en la autenticación',
      error: error.message 
    });
  }
};

// Middleware para verificar roles
exports.checkRol = (roles = []) => {
  return (req, res, next) => {
    try {
      // Si no se especifican roles, cualquier usuario autenticado puede acceder
      if (roles.length === 0) {
        return next();
      }

      // Verificar si el usuario tiene el rol necesario
      if (!req.usuario) {
        return res.status(401).json({ 
          ok: false, 
          message: 'No se pudo verificar el rol del usuario' 
        });
      }

      // Si el usuario tiene el rol 'admin', puede acceder a todo
      const rolUsuario = req.usuario?.role || req.usuario?.rol;
      const rolNormalizado = rolUsuario ? String(rolUsuario).toUpperCase().trim() : '';

      if (rolNormalizado === 'ADMIN') {
        return next();
      }

      // Verificar si el rol del usuario está en los roles permitidos
      const rolesNormalizados = roles.map(r => String(r).toUpperCase().trim());
      if (rolesNormalizados.includes(rolNormalizado)) {
        return next();
      }

      // Si no tiene permiso
      res.status(403).json({ 
        ok: false, 
        message: 'No tienes permiso para realizar esta acción' 
      });
    } catch (error) {
      console.error('Error al verificar el rol:', error);
      res.status(500).json({ 
        ok: false, 
        message: 'Error al verificar los permisos',
        error: error.message 
      });
    }
  };
};
