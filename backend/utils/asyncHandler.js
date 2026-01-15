/**
 * Wrapper para funciones async que elimina la necesidad de try-catch en cada controlador
 * Los errores son automáticamente pasados al middleware de manejo de errores
 * 
 * @param {Function} fn - Función async del controlador
 * @returns {Function} - Función wrapper que maneja errores
 * 
 * @example
 * // Antes
 * exports.obtenerTours = async (req, res) => {
 *   try {
 *     // lógica
 *   } catch (error) {
 *     res.status(500).json({ error: error.message });
 *   }
 * };
 * 
 * // Después
 * exports.obtenerTours = asyncHandler(async (req, res) => {
 *   // lógica (sin try-catch)
 * });
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
