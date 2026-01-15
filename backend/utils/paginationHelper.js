/**
 * Utilidad para manejar paginación de forma consistente
 * Elimina código duplicado en todos los controladores
 */

/**
 * Pagina resultados de un modelo Sequelize
 * @param {Object} model - Modelo de Sequelize
 * @param {Object} options - Opciones de paginación
 * @param {Number} options.page - Número de página (default: 1)
 * @param {Number} options.limit - Cantidad de registros por página (default: 10)
 * @param {Object} options.where - Condiciones WHERE de Sequelize
 * @param {Array} options.include - Includes de Sequelize
 * @param {Array} options.order - Orden de resultados
 * @param {Array} options.attributes - Atributos a seleccionar
 * @returns {Object} - Objeto con datos paginados y metadata
 * 
 * @example
 * const result = await paginate(Tour, {
 *   page: 1,
 *   limit: 10,
 *   where: { activo: true },
 *   order: [['nombre', 'ASC']]
 * });
 * 
 * // Retorna:
 * // {
 * //   data: [...],
 * //   pagination: {
 * //     total: 100,
 * //     page: 1,
 * //     limit: 10,
 * //     totalPages: 10
 * //   }
 * // }
 */
const paginate = async (model, options = {}) => {
  const { 
    page = 1, 
    limit = 10, 
    where = {}, 
    include = [], 
    order = [],
    attributes,
    distinct = false
  } = options;

  // Validar y parsear parámetros
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  // Construir opciones de consulta
  const queryOptions = {
    where,
    limit: parsedLimit,
    offset,
    distinct
  };

  if (include.length > 0) {
    queryOptions.include = include;
  }

  if (order.length > 0) {
    queryOptions.order = order;
  }

  if (attributes) {
    queryOptions.attributes = attributes;
  }

  // Ejecutar consulta
  const { count, rows } = await model.findAndCountAll(queryOptions);

  // Calcular metadata de paginación
  const totalPages = Math.ceil(count / parsedLimit);

  return {
    data: rows,
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1
    }
  };
};

/**
 * Extrae parámetros de paginación de req.query
 * @param {Object} query - req.query de Express
 * @returns {Object} - Objeto con page y limit parseados
 */
const getPaginationParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));

  return { page, limit };
};

module.exports = {
  paginate,
  getPaginationParams
};
