const gastoService = require('../services/gasto.service');
const asyncHandler = require('../utils/asyncHandler');
const response = require('../utils/responseHandler');

/**
 * Obtener todos los gastos con filtros opcionales
 */
const obtenerGastos = asyncHandler(async (req, res) => {
    const { page, limit, estado, categoria, desde, hasta, reserva_id } = req.query;

    const result = await gastoService.getGastos({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        estado,
        categoria,
        desde,
        hasta,
        reserva_id
    });

    return response.paginated(res, result, 'Gastos obtenidos exitosamente');
});

/**
 * Obtener un gasto por ID
 */
const obtenerGasto = asyncHandler(async (req, res) => {
    const gasto = await gastoService.getGastoById(req.params.id);
    return response.success(res, { data: gasto }, 'Gasto obtenido');
});

/**
 * Crear un nuevo gasto
 */
const crearGasto = asyncHandler(async (req, res) => {
    const gasto = await gastoService.crearGasto(req.body);
    return response.success(res, { data: gasto }, 'Gasto creado correctamente', 201);
});

/**
 * Actualizar un gasto
 */
const actualizarGasto = asyncHandler(async (req, res) => {
    const gasto = await gastoService.actualizarGasto(req.params.id, req.body);
    return response.success(res, { data: gasto }, 'Gasto actualizado correctamente');
});

/**
 * Marcar un gasto como pagado
 */
const marcarPagado = asyncHandler(async (req, res) => {
    const gasto = await gastoService.marcarPagado(req.params.id, req.body);
    return response.success(res, { data: gasto }, 'Gasto marcado como pagado');
});

/**
 * Eliminar un gasto (soft delete)
 */
const eliminarGasto = asyncHandler(async (req, res) => {
    await gastoService.eliminarGasto(req.params.id);
    return response.success(res, {}, 'Gasto eliminado correctamente');
});

/**
 * Obtener resumen de gastos
 */
const obtenerResumen = asyncHandler(async (req, res) => {
    const { desde, hasta } = req.query;
    const resumen = await gastoService.getResumen({ desde, hasta });
    return response.success(res, { data: resumen }, 'Resumen de gastos obtenido');
});

module.exports = {
    obtenerGastos,
    obtenerGasto,
    crearGasto,
    actualizarGasto,
    marcarPagado,
    eliminarGasto,
    obtenerResumen
};
