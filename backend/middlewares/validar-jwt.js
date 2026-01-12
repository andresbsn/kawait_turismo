const { response, request } = require('express');
const jwt = require('jsonwebtoken');

const validarJWT = (req = request, res = response, next) => {
  // Leer el token del header
  const token = req.header('x-token');

  if (!token) {
    return res.status(401).json({
      ok: false,
      msg: 'No hay token en la petición'
    });
  }

  try {
    const { uid, nombre } = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu_clave_secreta_para_desarrollo',
      { ignoreExpiration: false }
    );

    req.uid = uid;
    req.nombre = nombre;

  } catch (error) {
    console.error('Error al verificar el token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        msg: 'Token expirado'
      });
    }

    return res.status(401).json({
      ok: false,
      msg: 'Token no válido'
    });
  }

  // Si todo sale bien, continuar
  next();
};

module.exports = {
  validarJWT
};
