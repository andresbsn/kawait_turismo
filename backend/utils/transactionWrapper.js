const db = require('../models');

/**
 * Utilidad para manejar transacciones de Sequelize de forma consistente
 * Elimina código duplicado de transaction/commit/rollback
 */

/**
 * Wrapper para ejecutar una función dentro de una transacción
 * Maneja automáticamente commit y rollback
 * 
 * @param {Function} callback - Función async que recibe la transacción
 * @returns {Promise} - Resultado de la función callback
 * 
 * @example
 * const resultado = await withTransaction(async (transaction) => {
 *   const reserva = await Reserva.create(data, { transaction });
 *   const cuenta = await CuentaCorriente.create(cuentaData, { transaction });
 *   return { reserva, cuenta };
 * });
 */
const withTransaction = async (callback) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Middleware para agregar transacción al request
 * Útil cuando múltiples operaciones en el controlador necesitan la misma transacción
 * 
 * @example
 * // En las rutas
 * router.post('/reservas', withTransactionMiddleware, crearReserva);
 * 
 * // En el controlador
 * exports.crearReserva = async (req, res) => {
 *   const { transaction } = req;
 *   await Reserva.create(data, { transaction });
 *   await CuentaCorriente.create(cuentaData, { transaction });
 * };
 */
const withTransactionMiddleware = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  req.transaction = transaction;

  // Interceptar la respuesta para hacer commit o rollback
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);

  let statusCode = 200;

  res.status = function(code) {
    statusCode = code;
    return originalStatus(code);
  };

  res.json = async function(data) {
    try {
      if (statusCode >= 200 && statusCode < 300) {
        await transaction.commit();
      } else {
        await transaction.rollback();
      }
    } catch (error) {
      console.error('Error en transacción middleware:', error);
      await transaction.rollback();
    }
    return originalJson(data);
  };

  next();
};

/**
 * Ejecuta múltiples operaciones en una transacción
 * Útil para operaciones batch
 * 
 * @param {Array} operations - Array de funciones async que reciben la transacción
 * @returns {Promise<Array>} - Array con los resultados de cada operación
 * 
 * @example
 * const [reserva, cuenta, cuotas] = await executeInTransaction([
 *   (t) => Reserva.create(data, { transaction: t }),
 *   (t) => CuentaCorriente.create(cuentaData, { transaction: t }),
 *   (t) => Cuota.bulkCreate(cuotasData, { transaction: t })
 * ]);
 */
const executeInTransaction = async (operations = []) => {
  return withTransaction(async (transaction) => {
    const results = [];
    for (const operation of operations) {
      const result = await operation(transaction);
      results.push(result);
    }
    return results;
  });
};

module.exports = {
  withTransaction,
  withTransactionMiddleware,
  executeInTransaction
};
