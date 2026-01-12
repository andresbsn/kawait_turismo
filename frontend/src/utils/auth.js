// Función para obtener el token del localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Función para verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return !!getToken();
};

// Función para obtener el usuario del localStorage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Función para obtener el rol del usuario
export const getUserRole = () => {
  const user = getCurrentUser();
  return user?.role || null;
};
