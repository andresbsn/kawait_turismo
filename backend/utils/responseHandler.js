/**
 * Utilidad para estandarizar las respuestas HTTP
 * Elimina inconsistencias en el formato de respuestas entre controladores
 */

/**
 * Respuesta exitosa
 * @param {Object} res - Objeto response de Express
 * @param {Object} data - Datos a enviar
 * @param {String} message - Mensaje descriptivo
 * @param {Number} statusCode - Código HTTP (default: 200)
 */
const success = (res, data = {}, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

/**
 * Respuesta de error
 * @param {Object} res - Objeto response de Express
 * @param {String} message - Mensaje de error
 * @param {Number} statusCode - Código HTTP (default: 500)
 * @param {Object} details - Detalles adicionales del error
 */
const error = (res, message = 'Error en la operación', statusCode = 500, details = null) => {
  const response = {
    success: false,
    message
  };

  if (details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Respuesta de recurso no encontrado
 * @param {Object} res - Objeto response de Express
 * @param {String} entity - Nombre de la entidad no encontrada
 */
const notFound = (res, entity = 'Recurso') => {
  return res.status(404).json({
    success: false,
    message: `${entity} no encontrado`
  });
};

/**
 * Respuesta de error de validación
 * @param {Object} res - Objeto response de Express
 * @param {Array} errors - Array de errores de validación
 */
const validationError = (res, errors = []) => {
  return res.status(400).json({
    success: false,
    message: 'Error de validación',
    errors
  });
};

/**
 * Respuesta de no autorizado
 * @param {Object} res - Objeto response de Express
 * @param {String} message - Mensaje personalizado
 */
const unauthorized = (res, message = 'No autorizado') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * Respuesta de prohibido
 * @param {Object} res - Objeto response de Express
 * @param {String} message - Mensaje personalizado
 */
const forbidden = (res, message = 'Acceso prohibido') => {
  return res.status(403).json({
    success: false,
    message
  });
};

/**
 * Respuesta de conflicto (ej: recurso duplicado)
 * @param {Object} res - Objeto response de Express
 * @param {String} message - Mensaje del conflicto
 */
const conflict = (res, message = 'El recurso ya existe') => {
  return res.status(409).json({
    success: false,
    message
  });
};

/**
 * Respuesta con datos paginados
 * @param {Object} res - Objeto response de Express
 * @param {Object} paginationData - Datos de paginación del helper
 * @param {String} message - Mensaje descriptivo
 */
const paginated = (res, paginationData, message = 'Datos obtenidos exitosamente') => {
  return res.status(200).json({
    success: true,
    message,
    ...paginationData
  });
};

module.exports = {
  success,
  error,
  notFound,
  validationError,
  unauthorized,
  forbidden,
  conflict,
  paginated
};
