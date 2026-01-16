import axios from 'axios';

// Configuración de la URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = `${API_BASE_URL}/api/clientes`;

console.log('API Base URL:', API_BASE_URL);
console.log('API Clientes URL:', API_URL);

// Configuración global de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': 'es-ES'
  }
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(
  (config) => {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');

    // Si hay un token, añadirlo a los headers
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
    }

    // Log de depuración
    console.log('=== Petición Cliente ===');
    console.log('URL:', config.url);
    console.log('Método:', config.method);
    if (config.params) {
      console.log('Parámetros:', JSON.stringify(config.params, null, 2));
    }

    return config;
  },
  (error) => {
    console.error('Error en la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores globales
api.interceptors.response.use(
  (response) => {
    console.log('=== Respuesta exitosa Cliente ===');
    console.log('URL:', response.config.url);
    return response;
  },
  (error) => {
    console.error('=== Error en la respuesta Cliente ===');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Datos del error:', error.response.data);

      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
      }

      const errorMessage = error.response.data?.message || `Error en la petición: ${error.response.status}`;
      return Promise.reject(new Error(errorMessage));
    }
    return Promise.reject(error);
  }
);

const clienteService = {
  /**
   * Obtiene la lista de clientes con paginación y búsqueda
   */
  async obtenerClientes(params = {}) {
    try {
      console.log('Solicitando clientes...');
      const response = await api.get('/api/clientes', { params });
      console.log('Respuesta clientes:', response.data);

      // Adaptar la respuesta según la estructura que devuelva el backend
      if (response.data && Array.isArray(response.data.clientes)) {
        return response.data.clientes;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  },

  /**
   * Obtiene un cliente por su ID
   */
  async obtenerClientePorId(id) {
    try {
      const response = await api.get(`/api/clientes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el cliente con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo cliente
   */
  async crearCliente(cliente) {
    try {
      const response = await api.post('/api/clientes', cliente);
      return response.data;
    } catch (error) {
      console.error('Error al crear el cliente:', error);
      throw error;
    }
  },

  /**
   * Actualiza un cliente existente
   */
  async actualizarCliente(id, cliente) {
    try {
      const response = await api.put(`/api/clientes/${id}`, cliente);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el cliente con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un cliente
   */
  async eliminarCliente(id) {
    try {
      const response = await api.delete(`/api/clientes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el cliente con ID ${id}:`, error);
      throw error;
    }
  }
};

export default clienteService;
