// backend/controllers/tour.controller.js
const tourService = require('../services/tour.service');
const asyncHandler = require('../utils/asyncHandler');
const { success, paginated } = require('../utils/responseHandler');

/**
 * @route   GET /api/tours
 * @desc    Obtener todos los tours con paginación y búsqueda
 * @access  Private/Admin,Staff
 */
const obtenerTours = asyncHandler(async (req, res) => {
  const result = await tourService.getTours(req.query);
  
  const response = {
    tours: result.data,
    ...result.pagination
  };
  
  return paginated(res, response, 'Tours obtenidos exitosamente');
});

/**
 * @route   GET /api/tours/:id
 * @desc    Obtener un tour por ID
 * @access  Private/Admin,Staff
 */
const obtenerTourPorId = asyncHandler(async (req, res) => {
  const tour = await tourService.getTourById(req.params.id);
  return success(res, { tour }, 'Tour obtenido correctamente');
});

/**
 * @route   POST /api/tours
 * @desc    Crear un nuevo tour
 * @access  Private/Admin
 */
const crearTour = asyncHandler(async (req, res) => {
  const nuevoTour = await tourService.createTour({
    ...req.body,
    cupos_reservados: 0,
    activo: true
  });
  
  return success(res, { tour: nuevoTour }, 'Tour creado exitosamente', 201);
});

/**
 * @route   PUT /api/tours/:id
 * @desc    Actualizar un tour existente
 * @access  Private/Admin
 */
const actualizarTour = asyncHandler(async (req, res) => {
  const tour = await tourService.updateTour(req.params.id, req.body);
  return success(res, { tour }, 'Tour actualizado exitosamente');
});

/**
 * @route   DELETE /api/tours/:id
 * @desc    Eliminar un tour (borrado lógico)
 * @access  Private/Admin
 */
const eliminarTour = asyncHandler(async (req, res) => {
  await tourService.deleteTour(req.params.id);
  return success(res, {}, 'Tour eliminado correctamente');
});

module.exports = {
  obtenerTours,
  obtenerTourPorId,
  crearTour,
  actualizarTour,
  eliminarTour
};
