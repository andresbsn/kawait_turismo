const { Op } = require('sequelize');

/**
 * Utilidad para construir condiciones de búsqueda de forma consistente
 * Elimina código duplicado en búsquedas con operador OR
 */

/**
 * Construye una condición de búsqueda con operador OR
 * @param {String} searchTerm - Término de búsqueda
 * @param {Array} fields - Array de campos en los que buscar
 * @param {Boolean} caseSensitive - Si la búsqueda es case-sensitive (default: false)
 * @returns {Object} - Objeto con condición WHERE de Sequelize
 * 
 * @example
 * const searchCondition = buildSearchCondition('juan', ['nombre', 'apellido', 'email']);
 * // Retorna: { [Op.or]: [{ nombre: { [Op.iLike]: '%juan%' } }, ...] }
 */
const buildSearchCondition = (searchTerm, fields = [], caseSensitive = false) => {
  if (!searchTerm || !searchTerm.trim() || fields.length === 0) {
    return {};
  }

  const operator = caseSensitive ? Op.like : Op.iLike;
  const searchValue = `%${searchTerm.trim()}%`;

  return {
    [Op.or]: fields.map(field => ({
      [field]: { [operator]: searchValue }
    }))
  };
};

/**
 * Construye condiciones de búsqueda para relaciones (includes)
 * @param {String} searchTerm - Término de búsqueda
 * @param {Array} fields - Array de campos en los que buscar
 * @param {Boolean} caseSensitive - Si la búsqueda es case-sensitive (default: false)
 * @returns {Object} - Objeto con condición WHERE para includes
 * 
 * @example
 * const includeSearch = buildIncludeSearchCondition('tour', ['nombre', 'destino']);
 * // Usar en: include: [{ model: Tour, where: includeSearch }]
 */
const buildIncludeSearchCondition = (searchTerm, fields = [], caseSensitive = false) => {
  if (!searchTerm || !searchTerm.trim() || fields.length === 0) {
    return undefined;
  }

  return buildSearchCondition(searchTerm, fields, caseSensitive);
};

/**
 * Construye una condición de búsqueda exacta
 * @param {String} value - Valor a buscar
 * @param {Array} fields - Array de campos en los que buscar
 * @returns {Object} - Objeto con condición WHERE de Sequelize
 * 
 * @example
 * const exactSearch = buildExactSearchCondition('activo', ['estado', 'tipo']);
 * // Retorna: { [Op.or]: [{ estado: 'activo' }, { tipo: 'activo' }] }
 */
const buildExactSearchCondition = (value, fields = []) => {
  if (value === undefined || value === null || fields.length === 0) {
    return {};
  }

  return {
    [Op.or]: fields.map(field => ({
      [field]: value
    }))
  };
};

/**
 * Construye condiciones de rango de fechas
 * @param {String} startDate - Fecha de inicio
 * @param {String} endDate - Fecha de fin
 * @param {String} field - Campo de fecha (default: 'createdAt')
 * @returns {Object} - Objeto con condición WHERE de Sequelize
 * 
 * @example
 * const dateRange = buildDateRangeCondition('2024-01-01', '2024-12-31', 'fecha_reserva');
 * // Retorna: { fecha_reserva: { [Op.between]: ['2024-01-01', '2024-12-31'] } }
 */
const buildDateRangeCondition = (startDate, endDate, field = 'createdAt') => {
  if (!startDate || !endDate) {
    return {};
  }

  return {
    [field]: {
      [Op.between]: [startDate, endDate]
    }
  };
};

/**
 * Combina múltiples condiciones de búsqueda
 * @param {Array} conditions - Array de condiciones
 * @returns {Object} - Objeto con todas las condiciones combinadas
 * 
 * @example
 * const combined = combineConditions([
 *   buildSearchCondition('juan', ['nombre']),
 *   { activo: true },
 *   buildDateRangeCondition('2024-01-01', '2024-12-31')
 * ]);
 */
const combineConditions = (conditions = []) => {
  return conditions.reduce((acc, condition) => {
    return { ...acc, ...condition };
  }, {});
};

module.exports = {
  buildSearchCondition,
  buildIncludeSearchCondition,
  buildExactSearchCondition,
  buildDateRangeCondition,
  combineConditions
};
