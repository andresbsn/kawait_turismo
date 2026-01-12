const jwt = require('jsonwebtoken');
const db = require('../models');
const { User } = db;

// Middleware para verificar el token JWT
exports.checkAuth = async (req, res, next) => {
  try {
    // Obtener el token del header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        message: 'No se proporcionó un token de autenticación' 
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_secreto');

    if (decoded?.tipo === 'cliente') {
      req.usuario = {
        email: decoded.email,
        role: decoded.role || 'USER',
        cliente_id: decoded.cliente_id
      };
      return next();
    }
    
    // Buscar el usuario en la base de datos
    if (!User) {
      return res.status(500).json({
        ok: false,
        message: 'Modelo de usuario no disponible (User)'
      });
    }

    const usuario = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] } // No retornar la contraseña
    });

    if (!usuario) {
      return res.status(401).json({ 
        ok: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Agregar el usuario al request para usarlo en los controladores
    req.usuario = usuario;
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        ok: false, 
        message: 'Token inválido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        ok: false, 
        message: 'Token expirado' 
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
