import axios from 'axios';

// Configuración de la URL base de la API
const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;
const API_URL = `${API_BASE_URL}/api/usuarios`;

console.log('API Base URL:', API_BASE_URL);
console.log('API Usuarios URL:', API_URL);

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
    console.log('=== Petición ===');
    console.log('URL:', config.url);
    console.log('Método:', config.method);
    console.log('Headers:', JSON.stringify(config.headers, null, 2));
    if (config.data) {
      console.log('Datos:', JSON.stringify(config.data, null, 2));
    }
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
    console.log('=== Respuesta exitosa ===');
    console.log('URL:', response.config.url);
    console.log('Status:', response.status);
    console.log('Datos:', response.data);
    return response;
  },
  (error) => {
    console.error('=== Error en la respuesta ===');

    if (error.response) {
      // El servidor respondió con un código de error
      console.error('Status:', error.response.status);
      console.error('Datos del error:', error.response.data);
      console.error('Headers:', error.response.headers);

      // Manejar errores de autenticación/autotización
      if (error.response.status === 401) {
        console.error('Error de autenticación: Token inválido o expirado');
        // Opcional: Redirigir al login
        // window.location.href = '/login';
      } else if (error.response.status === 403) {
        console.error('Error de autorización: Permisos insuficientes');
      }
      const { status, data } = error.response;

      if (status === 401) {
        // No autorizado - redirigir al login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(new Error('Sesión expirada. Por favor, inicia sesión nuevamente.'));
      }

      // Otros códigos de error
      const errorMessage = data?.message || `Error en la petición: ${status}`;
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      return Promise.reject(new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión.'));
    } else {
      // Error al configurar la petición
      return Promise.reject(new Error('Error al procesar la solicitud.'));
    }
  }
);

// Rutas alternativas para probar (descomenta la que funcione)
const RUTAS = {
  // Opción 1: Rutas estándar REST
  estandar: {
    obtenerTodos: '/api/usuarios',
    obtenerUno: (id) => `/api/usuarios/${id}`,
    crear: '/api/usuarios',
    actualizar: (id) => `/api/usuarios/${id}`,
    eliminar: (id) => `/api/usuarios/${id}`
  },
  // Opción 2: Rutas alternativas (comenta/descomenta según necesites)
  alternativa: {
    obtenerTodos: '/api/users',
    obtenerUno: (id) => `/api/users/${id}`,
    crear: '/api/users',
    actualizar: (id) => `/api/users/${id}`,
    eliminar: (id) => `/api/users/${id}`
  }
};

// Selecciona el conjunto de rutas a usar
const rutas = RUTAS.estandar; // Cambia a 'alternativa' si es necesario

export const usuarioService = {
  // Obtener todos los usuarios
  async obtenerUsuarios(params = {}) {
    try {
      console.log('Solicitando usuarios a:', rutas.obtenerTodos);
      const response = await api.get(rutas.obtenerTodos, { params });
      console.log('Respuesta de la API:', response.data);
      // Asegurarse de que estamos devolviendo un array de usuarios
      if (response.data && Array.isArray(response.data.usuarios)) {
        return response.data.usuarios;
      } else if (Array.isArray(response.data)) {
        return response.data; // Por si la respuesta es directamente un array
      } else {
        console.warn('La respuesta no contiene un array de usuarios:', response.data);
        return [];
      }
    } catch (error) {
      console.error('Error al obtener los usuarios. Ruta intentada:', rutas.obtenerTodos);
      console.error('Detalles del error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Obtener un usuario por ID
  async obtenerUsuarioPorId(id) {
    try {
      const response = await api.get(rutas.obtenerUno(id));
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el usuario con ID ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo usuario
  async crearUsuario(usuario) {
    try {
      const response = await api.post(rutas.crear, usuario);
      return response.data;
    } catch (error) {
      console.error('Error al crear el usuario:', error);
      throw error;
    }
  },

  // Actualizar un usuario existente
  async actualizarUsuario(id, usuario) {
    try {
      console.log('Actualizando usuario - ID:', id);
      console.log('Datos a enviar:', usuario);
      const url = `/api/usuarios/${id}`;
      console.log('URL de la petición:', url);

      const response = await api.put(url, usuario);
      console.log('Respuesta del servidor:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el usuario con ID ${id}:`, error);
      if (error.response) {
        // La petición fue hecha y el servidor respondió con un status code
        // que esta fuera del rango 2xx
        console.error('Datos de la respuesta de error:', error.response.data);
        console.error('Status de la respuesta:', error.response.status);
        console.error('Headers de la respuesta:', error.response.headers);
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        console.error('No se recibió respuesta del servidor:', error.request);
      } else {
        // Algo sucedió en la configuración de la petición que generó un error
        console.error('Error al configurar la petición:', error.message);
      }
      throw error;
    }
  },

  // Eliminar un usuario
  async eliminarUsuario(id) {
    try {
      const response = await api.delete(rutas.eliminar(id));
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el usuario con ID ${id}:`, error);
      throw error;
    }
  }
};

export default usuarioService;
