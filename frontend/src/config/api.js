// URL base de la API (debería estar en variables de entorno en producción)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Configuración por defecto para las peticiones
export const defaultConfig = {
  credentials: 'include', // Incluir credenciales en todas las peticiones
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
};

// Función para manejar las respuestas de la API
export const handleResponse = async (response) => {
  // Verificar si la respuesta es un JSON válido
  const contentType = response.headers.get('content-type');
  let data;

  try {
    data = contentType?.includes('application/json') ? await response.json() : {};
  } catch (error) {
    data = {};
  }

  if (!response.ok) {
    // Si la respuesta es 401 (No autorizado), limpiar la autenticación
    if (response.status === 401) {
      // Importar dinámicamente para evitar dependencias circulares
      import('../services/auth.service').then(({ default: authService }) => {
        authService.logout();
        // Redirigir al login solo si no estamos ya en la página de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      });
    }

    // Lanzar error con el mensaje del servidor
    const error = new Error(data.message || `Error en la petición (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Función para crear headers con el token de autenticación
const getAuthHeaders = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      // Si no hay token, intentar obtenerlo de las cookies
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (cookieToken) {
        localStorage.setItem('token', cookieToken);
        return { 'Authorization': `Bearer ${cookieToken}` };
      }
      return {};
    }
    return { 'Authorization': `Bearer ${token}` };
  } catch (error) {
    console.error('Error al obtener el token de autenticación:', error);
    return {};
  }
};

// Cliente HTTP genérico
export const apiClient = {
  get: async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      ...defaultConfig,
      ...options,
      method: 'GET',
      headers: {
        ...defaultConfig.headers,
        ...getAuthHeaders(),
        ...options.headers,
      },
    };

    // Construir URL con parámetros de consulta
    const queryParams = new URLSearchParams();
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
    }

    const fullUrl = queryParams.toString() ? `${url}?${queryParams}` : url;

    console.log('🌐 Realizando petición GET a:', fullUrl, { config });

    try {
      const response = await fetch(fullUrl, config);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: await response.text() };
        }

        console.error(`❌ Error en la respuesta del servidor (${response.status}):`, {
          status: response.status,
          statusText: response.statusText,
          url: fullUrl,
          error: errorData,
          headers: Object.fromEntries(response.headers.entries())
        });

        const error = new Error(errorData.message || `Error en la petición: ${response.statusText}`);
        error.status = response.status;
        error.data = errorData;
        error.response = response;
        throw error;
      }

      return await handleResponse(response);
    } catch (error) {
      console.error(`❌ Error en la petición GET a ${fullUrl}:`, {
        message: error.message,
        name: error.name,
        stack: error.stack,
        config: {
          url: fullUrl,
          ...config,
          headers: {
            ...config.headers,
            // Ocultar el token si está presente para no mostrarlo en los logs
            'Authorization': config.headers.Authorization ? 'Bearer ***' : undefined
          }
        }
      });

      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        const networkError = new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet o si el servidor está en ejecución.');
        networkError.isNetworkError = true;
        throw networkError;
      }

      throw error;
    }
  },

  post: async (endpoint, data, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultConfig,
      ...options,
      method: 'POST',
      headers: {
        ...defaultConfig.headers,
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  put: async (endpoint, data, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultConfig,
      ...options,
      method: 'PUT',
      headers: {
        ...defaultConfig.headers,
        ...getAuthHeaders(),
        ...options.headers,
      },
      body: JSON.stringify(data),
    });

    return handleResponse(response);
  },

  delete: async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...defaultConfig,
      ...options,
      method: 'DELETE',
      headers: {
        ...defaultConfig.headers,
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    return handleResponse(response);
  },
};

// Servicios de autenticación
export const authService = {
  login: async (email, password, rememberMe) => {
    return apiClient.post('/auth/login', { email, password, rememberMe });
  },

  loginCliente: async (email, dni) => {
    return apiClient.post('/auth/login-cliente', { email, dni });
  },

  logout: async () => {
    return apiClient.post('/auth/logout');
  },

  getCurrentUser: async () => {
    return apiClient.get('/auth/me');
  },
};

// Servicio de usuarios
export const userService = {
  getUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/users${query ? `?${query}` : ''}`);
  },

  getUser: async (userId) => {
    return apiClient.get(`/users/${userId}`);
  },

  createUser: async (userData) => {
    return apiClient.post('/users', userData);
  },

  updateUser: async (userId, userData) => {
    return apiClient.put(`/users/${userId}`, userData);
  },

  deleteUser: async (userId) => {
    return apiClient.delete(`/users/${userId}`);
  },
};

// Servicio de tours
export const tourService = {
  // Obtener lista de tours con paginación y filtros
  async obtenerTours(params = {}) {
    try {
      // Asegurarse de que los parámetros de paginación tengan valores por defecto
      const { page = 1, limit = 10, ...filters } = params;

      // Construir la URL con los parámetros de consulta
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      });

      const response = await apiClient.get(`/tours?${queryParams}`);

      // La respuesta ya contiene los tours y la información de paginación
      return {
        success: true,
        tours: response.tours || [],
        total: response.total || 0,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
      };
    } catch (error) {
      console.error('Error al obtener tours:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener la lista de tours',
        tours: [],
        total: 0
      };
    }
  },

  // Obtener un tour por ID
  async obtenerTourPorId(id) {
    try {
      const response = await apiClient.get(`/tours/${id}`);
      console.log('antes de pasar al compoente', response);

      return {
        success: true,
        tour: response.tour
      };
    } catch (error) {
      console.error(`Error al obtener el tour con ID ${id}:`, error);
      return {
        success: false,
        message: error.message || `Error al obtener el tour con ID ${id}`
      };
    }
  },

  // Crear un nuevo tour
  async crearTour(tourData) {
    try {
      const response = await apiClient.post('/tours', tourData);
      return {
        success: true,
        tour: response.data,
        message: 'Tour creado exitosamente'
      };
    } catch (error) {
      console.error('Error al crear el tour:', error);
      return {
        success: false,
        message: error.message || 'Error al crear el tour'
      };
    }
  },

  // Actualizar un tour existente
  async actualizarTour(id, tourData) {
    try {
      const response = await apiClient.put(`/tours/${id}`, tourData);
      return {
        success: true,
        tour: response.data,
        message: 'Tour actualizado exitosamente'
      };
    } catch (error) {
      console.error(`Error al actualizar el tour con ID ${id}:`, error);
      return {
        success: false,
        message: error.message || `Error al actualizar el tour con ID ${id}`
      };
    }
  },

  // Eliminar un tour
  async eliminarTour(id) {
    try {
      await apiClient.delete(`/tours/${id}`);
      return {
        success: true,
        message: 'Tour eliminado exitosamente'
      };
    } catch (error) {
      console.error(`Error al eliminar el tour con ID ${id}:`, error);
      return {
        success: false,
        message: error.message || `Error al eliminar el tour con ID ${id}`
      };
    }
  },

  // Métodos adicionales para compatibilidad
  getTours: async (params = {}) => {
    const result = await tourService.obtenerTours(params);
    return result.tours || [];
  },

  getTour: async (tourId) => {
    const result = await tourService.obtenerTourPorId(tourId);
    return result.tour;
  },

  createTour: async (tourData) => {
    const result = await tourService.crearTour(tourData);
    return result.tour;
  },

  updateTour: async (tourId, tourData) => {
    const result = await tourService.actualizarTour(tourId, tourData);
    return result.tour;
  },

  deleteTour: async (tourId) => {
    const result = await tourService.eliminarTour(tourId);
    return result.success;
  }
};

// Servicio de clientes
export const clienteService = {
  // Buscar clientes por término de búsqueda
  buscarClientes: async (busqueda) => {
    try {
      console.log('🔍 Buscando clientes con término:', busqueda);
      const response = await apiClient.get('/clientes/buscar', {
        params: {
          busqueda: busqueda || ''
        }
      });
      console.log('✅ Respuesta de búsqueda de clientes:', response);
      return response.clientes || [];
    } catch (error) {
      console.error('❌ Error al buscar clientes:', error);
      if (error.response) {
        console.error('Detalles del error:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('No se recibió respuesta del servidor:', error.request);
      } else {
        console.error('Error al configurar la solicitud:', error.message);
      }
      return [];
    }
  },

  // Obtener un cliente por ID
  getCliente: async (id) => {
    try {
      const response = await apiClient.get(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener el cliente:', error);
      throw error;
    }
  },

  // Obtener lista de clientes
  getClientes: async (params = {}) => {
    try {
      const response = await apiClient.get('/clientes', { params });
      return response;
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  },

  // Crear un nuevo cliente
  crearCliente: async (clienteData) => {
    try {
      const response = await apiClient.post('/clientes', clienteData);
      return response;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw error;
    }
  },

  // Actualizar un cliente existente
  actualizarCliente: async (id, clienteData) => {
    try {
      const response = await apiClient.put(`/clientes/${id}`, clienteData);
      return response;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      throw error;
    }
  },

  // Eliminar un cliente
  eliminarCliente: async (id) => {
    try {
      const response = await apiClient.delete(`/clientes/${id}`);
      return response;
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      throw error;
    }
  }
};

// Servicio de reservas
export const bookingService = {
  getBookings: async (params = {}) => {
    // Mapear los nombres de parámetros si es necesario
    const apiParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      estado: params.estado,
      search: params.search,
      fechaInicio: params.fechaInicio,
      fechaFin: params.fechaFin
    };

    const query = new URLSearchParams();
    Object.entries(apiParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const response = await apiClient.get(`/reservas?${query.toString()}`);

    // Asegurarse de que la respuesta tenga el formato esperado
    return {
      success: true,
      reservas: response.reservas || response.data || [],
      data: response.reservas || response.data || [],
      total: response.total || 0,
      page: parseInt(response.page) || 1,
      limit: parseInt(response.limit) || 10,
      totalPages: response.totalPages,
    };
  },

  obtenerReservas: async (params = {}) => {
    return bookingService.getBookings(params);
  },

  getBooking: async (bookingId) => {
    const response = await apiClient.get(`/reservas/${bookingId}`);
    return {
      success: true,
      data: response.reserva || response.data,
      ...response
    };
  },

  obtenerReserva: async (bookingId) => {
    return bookingService.getBooking(bookingId);
  },

  createBooking: async (bookingData) => {
    const response = await apiClient.post('/reservas', bookingData);
    return {
      success: true,
      ...response
    };
  },

  crearReserva: async (bookingData) => {
    return bookingService.createBooking(bookingData);
  },

  updateBooking: async (bookingId, bookingData) => {
    const response = await apiClient.put(`/reservas/${bookingId}`, bookingData);
    return {
      success: true,
      ...response
    };
  },

  actualizarReserva: async (bookingId, bookingData) => {
    return bookingService.updateBooking(bookingId, bookingData);
  },

  deleteBooking: async (bookingId) => {
    const response = await apiClient.delete(`/reservas/${bookingId}`);
    return {
      success: true,
      ...response
    };
  },

  eliminarReserva: async (bookingId) => {
    return bookingService.deleteBooking(bookingId);
  },

  getBookingStatuses: async () => {
    // Valores fijos para los estados de reserva
    return {
      success: true,
      statuses: [
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'confirmada', label: 'Confirmada' },
        { value: 'cancelada', label: 'Cancelada' },
        { value: 'completada', label: 'Completada' }
      ]
    };
  },

  // Adjuntos
  uploadAttachment: async (id, file, tipo) => {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipo', tipo);

    // Necesitamos usar fetch directamente porque apiClient.post convierte a JSON
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/reservas/${id}/adjuntos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    return handleResponse(response);
  },

  getAttachments: async (id) => {
    return apiClient.get(`/reservas/${id}/adjuntos`);
  },

  deleteAttachment: async (id, adjuntoId) => {
    return apiClient.delete(`/reservas/${id}/adjuntos/${adjuntoId}`);
  },

  downloadAttachment: async (id, adjuntoId, nombreArchivo) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/reservas/${id}/adjuntos/${adjuntoId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al descargar el archivo');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
