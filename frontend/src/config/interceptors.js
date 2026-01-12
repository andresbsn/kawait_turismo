import { message } from 'antd';
import { authService } from './api';

// Interceptor para manejar errores globales
export const errorHandler = (error) => {
  console.error('Error en la petición:', error);

  const currentPath = window.location?.pathname || '';
  const requestUrl = String(error?.url || '');
  const isLoginRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/login-cliente');
  const isOnLoginPage = currentPath.includes('/login');
  
  // Verificar si es un error de red
  if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
    message.error('Error de conexión. Por favor, verifica tu conexión a internet.');
    return Promise.reject(error);
  }
  
  // Manejar errores de autenticación
  if (error.status === 401) {
    // En el login, un 401 suele ser "credenciales inválidas".
    // No forzar redirect (evita refrescar la página) y dejar que el componente maneje el mensaje.
    if (isLoginRequest || isOnLoginPage) {
      return Promise.reject(error);
    }

    // Si el token expiró o no es válido en una ruta protegida, redirigir al login
    message.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');

    // Limpiar datos de autenticación
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirigir al login
    window.location.href = '/login';
    return Promise.reject(error);
  }
  
  // Mostrar mensaje de error del servidor si está disponible
  if (error.data && error.data.message) {
    message.error(error.data.message);
  } else if (error.data && Array.isArray(error.data.errors) && error.data.errors.length > 0) {
    const firstMsg = error.data.errors[0]?.msg;
    message.error(firstMsg || 'Error de validación. Verifica los datos ingresados.');
  } else if (error.data && error.data.errors && typeof error.data.errors === 'object') {
    const firstKey = Object.keys(error.data.errors)[0];
    const firstMsg = firstKey ? error.data.errors[firstKey]?.msg : undefined;
    message.error(firstMsg || 'Error de validación. Verifica los datos ingresados.');
  } else {
    message.error('Ocurrió un error inesperado. Por favor, inténtalo de nuevo.');
  }
  
  return Promise.reject(error);
};

// Interceptor para agregar el token a las peticiones
export const authInterceptor = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  return { url, options };
};

// Función para configurar los interceptores
export const setupInterceptors = () => {
  // Guardar referencia original de fetch
  const originalFetch = window.fetch;
  
  // Sobrescribir fetch global
  window.fetch = async (url, options = {}) => {
    try {
      // Aplicar interceptores de solicitud
      const { url: modifiedUrl, options: modifiedOptions } = await authInterceptor(url, options);
      
      // Realizar la petición
      const response = await originalFetch(modifiedUrl, modifiedOptions);
      
      // Si la respuesta no es exitosa, lanzar error
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Error en la petición');
        error.status = response.status;
        error.data = errorData;
        error.url = modifiedUrl;
        throw error;
      }
      
      return response;
    } catch (error) {
      // Manejar errores
      return errorHandler(error);
    }
  };
};

// Interceptor para verificar la autenticación en cada cambio de ruta
export const setupAuthCheck = (history) => {
  // Verificar autenticación en cada cambio de ruta
  history.listen((location, action) => {
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const token = localStorage.getItem('token');
    
    if (!token && !isAuthPage) {
      // Si no hay token y no está en una página de autenticación, redirigir al login
      history.push('/login', { from: location.pathname });
    } else if (token && isAuthPage) {
      // Si hay token y está en una página de autenticación, redirigir al dashboard
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const rolePath = {
        'ADMIN': '/admin/dashboard',
        'GUIDE': '/guide/dashboard',
        'USER': '/user/dashboard'
      };
      
      history.push(rolePath[user.role] || '/');
    }
  });
};
