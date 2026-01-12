import axios from 'axios';

// Usar import.meta.env para Vite en lugar de process.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Configuración global de axios
axios.defaults.withCredentials = true; // Habilitar el envío de cookies

// Interceptor para agregar el token a las peticiones
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Usar Authorization: Bearer como espera el backend
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas no autorizadas
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Si recibimos un 401, el token ha expirado o no es válido
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirigir al login solo si no estamos ya en la página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

const authService = {
  // Iniciar sesión
  async login(username, password) {
    try {
      // Limpiar cualquier estado de autenticación previo
      this.logout();
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      }, {
        timeout: 10000, // 10 segundos de timeout
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true // Importante para manejar cookies HTTP-Only
      });

      if (!response.data?.token || !response.data?.user) {
        throw new Error('Respuesta del servidor inválida');
      }

      // Guardar token y usuario en localStorage
      const token = response.data.token;
      localStorage.setItem('token', token);
      
      // Configurar el token en el encabezado por defecto de axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Asegurarse de que el usuario tenga un rol válido
      const userData = response.data.user;
      if (!userData.role || !['ADMIN', 'GUIA', 'USER'].includes(userData.role)) {
        throw new Error('Rol de usuario no válido');
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      return userData;
      
    } catch (error) {
      console.error('Error en el servicio de autenticación:', error);
      // Limpiar credenciales en caso de error
      this.logout();
      
      // Proporcionar un mensaje de error más descriptivo
      let errorMessage = 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
      
      if (error.response) {
        // El servidor respondió con un código de estado fuera del rango 2xx
        errorMessage = error.response.data?.message || 
                      `Error del servidor: ${error.response.status}`;
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'La solicitud tardó demasiado tiempo. Por favor, verifica tu conexión.';
      }
      
      throw new Error(errorMessage);
    }
  },

  // Cerrar sesión
  logout() {
    // Eliminar del localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Eliminar cookies de autenticación
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Limpiar cualquier estado de autenticación en el servidor
    if (API_URL) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(console.error);
    }
  },

  // Obtener el usuario actual
  async getCurrentUser(forceRefresh = false) {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    // Si no forzamos la actualización, intentamos obtener el usuario del localStorage
    if (!forceRefresh) {
      try {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          return JSON.parse(cachedUser);
        }
      } catch (e) {
        console.error('Error al analizar el usuario en caché:', e);
        // Continuar para obtener un nuevo token
      }
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        // Configuración de caché que no afecta los headers de la petición
        params: {
          _t: new Date().getTime() // Evitar caché del navegador
        },
        validateStatus: (status) => status < 500 // Solo reintentar errores del servidor
      });
      
      // Si la respuesta es exitosa (2xx) y tiene datos
      if (response.status >= 200 && response.status < 300 && response.data) {
        const userData = response.data.user || response.data;
        // Solo actualizar si los datos son diferentes
        const currentUser = JSON.stringify(userData);
        if (localStorage.getItem('user') !== currentUser) {
          localStorage.setItem('user', currentUser);
        }
        return userData;
      }
      
      // Si hay un error de autenticación, limpiar las credenciales
      if (response.status === 401) {
        console.warn('Sesión expirada o inválida');
        this.logout();
      } else if (response.status !== 403) { // 403 podría ser un error de permisos, pero no de autenticación
        console.warn('Error al obtener el usuario:', response.status, response.data);
      }
      
      return null;
    } catch (error) {
      // Solo registrar errores que no sean de cancelación
      if (!axios.isCancel(error)) {
        console.error('Error en la solicitud de usuario:', error);
      }
      return null;
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Obtener el token
  getToken() {
    return localStorage.getItem('token');
  },

  // Obtener el rol del usuario
  getUserRole() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role : null;
  }
};

export default authService;
