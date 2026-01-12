// backend/controllers/tour.controller.js
const { Tour } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

/**
 * @route   GET /api/tours
 * @desc    Obtener todos los tours con paginación y búsqueda
 * @access  Private/Admin,Staff
 */
const obtenerTours = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', estado } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      activo: true
    };

    if (search) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${search}%` } },
        { destino: { [Op.iLike]: `%${search}%` } },
        { descripcion: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (estado) {
      where.estado = estado;
    }

    const { count, rows: tours } = await Tour.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['fecha_inicio', 'ASC']]
    });

    res.json({
      success: true,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      tours
    });
  } catch (error) {
    console.error('Error al obtener tours:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los tours',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/tours/:id
 * @desc    Obtener un tour por ID
 * @access  Private/Admin,Staff
 */
const obtenerTourPorId = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Buscando tour con ID:', id);
    
    // Buscar el tour sin especificar atributos para obtener todos los campos
    const tour = await Tour.findByPk(id);

    if (!tour) {
      console.error('❌ Tour no encontrado con ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Tour no encontrado'
      });
    }

    // Convertir a objeto plano
    const tourData = tour.get({ plain: true });
    
    // Mapear los nombres de campos si es necesario (de snake_case a camelCase)
    const tourFormateado = {
      id: tourData.id,
      nombre: tourData.nombre || '',
      descripcion: tourData.descripcion || '',
      destino: tourData.destino || '',
      fechaInicio: tourData.fechaInicio ? new Date(tourData.fechaInicio).toISOString() : null,
      fechaFin: tourData.fechaFin ? new Date(tourData.fechaFin).toISOString() : null,
      precio: tourData.precio || 0,
      cupoMaximo: tourData.cupo_maximo || tourData.cupoMaximo || 1, // Manejar ambos formatos
      estado: tourData.estado || 'disponible',
      activo: tourData.activo !== undefined ? tourData.activo : true,
      imagenUrl: tourData.imagen_url || tourData.imagenUrl || null, // Manejar ambos formatos
      createdAt: tourData.created_at || tourData.createdAt,
      updatedAt: tourData.updated_at || tourData.updatedAt
    };

    console.log('✅ Datos del tour a enviar:', JSON.stringify(tourFormateado, null, 2));

    // Enviar respuesta con formato consistente
    const response = {
      success: true,
      message: 'Tour obtenido correctamente',
      tour: tourFormateado
    };

    console.log('📤 Enviando respuesta:', JSON.stringify(response, null, 2));
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('❌ Error al obtener el tour:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el tour',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route   POST /api/tours
 * @desc    Crear un nuevo tour
 * @access  Private/Admin
 */
const crearTour = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const {
      nombre,
      descripcion = '',
      destino,
      fechaInicio = null,
      fechaFin = null,
      precio = 0,
      cupoMaximo = 10,
      imagenUrl = ''
    } = req.body;
    
    // Establecer valores por defecto
    const estado = 'disponible';
    const activo = true;

    // Validar fechas si se proporcionan
    if (fechaInicio && fechaFin && new Date(fechaInicio) >= new Date(fechaFin)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }

    // Crear el tour con valores por defecto
    const tourData = {
      nombre,
      descripcion,
      destino,
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      precio: parseFloat(precio) || 0,
      cupoMaximo: parseInt(cupoMaximo, 10) || 10,
      // Establecer cuposDisponibles explícitamente al mismo valor que cupoMaximo
      cuposDisponibles: parseInt(cupoMaximo, 10) || 10,
      imagenUrl,
      estado,
      activo
    };
    
    console.log('Datos del tour a crear:', tourData);
    
    const tour = await Tour.create(tourData);

    res.status(201).json({
      success: true,
      message: 'Tour creado exitosamente',
      tour
    });
  } catch (error) {
    console.error('Error al crear el tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el tour',
      error: error.message
    });
  }
};

/**
 * @route   PUT /api/tours/:id
 * @desc    Actualizar un tour existente
 * @access  Private/Admin
 */
const actualizarTour = async (req, res) => {
  // Validar los datos de entrada
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Errores de validación:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    console.log('Actualizando tour con ID:', id);
    console.log('Datos recibidos:', req.body);

    // Buscar el tour
    const tour = await Tour.findByPk(id);

    if (!tour) {
      console.log('Tour no encontrado con ID:', id);
      return res.status(404).json({
        success: false,
        message: 'Tour no encontrado'
      });
    }

    // Obtener los datos actuales del tour
    const tourActual = tour.get({ plain: true });
    console.log('Datos actuales del tour:', tourActual);

    // Procesar los datos recibidos
    const {
      nombre,
      descripcion,
      destino,
      fechaInicio,
      fechaFin,
      precio,
      cupoMaximo,
      imagenUrl,
      estado,
      activo
    } = req.body;

    // Calcular la diferencia de cupos si se actualiza el cupo máximo
    let diferenciaCupos = 0;
    if (cupoMaximo !== undefined && parseInt(cupoMaximo) !== parseInt(tourActual.cupoMaximo)) {
      diferenciaCupos = parseInt(cupoMaximo) - parseInt(tourActual.cupoMaximo);
      console.log('Diferencia de cupos calculada:', diferenciaCupos);
    }

    // Preparar los datos actualizados
    const datosActualizados = {
      nombre: nombre !== undefined ? nombre : tourActual.nombre,
      descripcion: descripcion !== undefined ? descripcion : tourActual.descripcion,
      destino: destino !== undefined ? destino : tourActual.destino,
      fechaInicio: fechaInicio !== undefined ? new Date(fechaInicio) : tourActual.fechaInicio,
      fechaFin: fechaFin !== undefined ? new Date(fechaFin) : tourActual.fechaFin,
      precio: precio !== undefined ? parseFloat(precio) : tourActual.precio,
      cupoMaximo: cupoMaximo !== undefined ? parseInt(cupoMaximo) : tourActual.cupoMaximo,
      cuposDisponibles: Math.max(0, (tourActual.cuposDisponibles || 0) + diferenciaCupos),
      imagenUrl: imagenUrl !== undefined ? imagenUrl : tourActual.imagenUrl,
      estado: estado !== undefined ? estado : tourActual.estado,
      activo: activo !== undefined ? Boolean(activo) : tourActual.activo
    };

    console.log('Datos a actualizar:', datosActualizados);

    // Actualizar el tour
    await tour.update(datosActualizados);

    // Obtener el tour actualizado para devolverlo
    const tourActualizado = await Tour.findByPk(id, {
      raw: true,
      nest: true
    });

    // Formatear fechas para la respuesta
    if (tourActualizado.fechaInicio) {
      tourActualizado.fechaInicio = new Date(tourActualizado.fechaInicio).toISOString().split('T')[0];
    }
    if (tourActualizado.fechaFin) {
      tourActualizado.fechaFin = new Date(tourActualizado.fechaFin).toISOString().split('T')[0];
    }

    console.log('Tour actualizado exitosamente:', tourActualizado);

    res.json({
      success: true,
      message: 'Tour actualizado exitosamente',
      tour: tourActualizado
    });
  } catch (error) {
    console.error('Error al actualizar el tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el tour',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * @route   DELETE /api/tours/:id
 * @desc    Eliminar un tour (borrado lógico)
 * @access  Private/Admin
 */
const eliminarTour = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar el tour
    const tour = await Tour.findByPk(id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour no encontrado'
      });
    }

    // Realizar borrado lógico
    await tour.update({ activo: false });

    res.json({
      success: true,
      message: 'Tour eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar el tour:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el tour',
      error: error.message
    });
  }
};

module.exports = {
  obtenerTours,
  obtenerTourPorId,
  crearTour,
  actualizarTour,
  eliminarTour
};
