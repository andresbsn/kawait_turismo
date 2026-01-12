import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import authService from '../services/auth.service';

// Mapeo de roles a rutas
const ROLE_PATHS = {
  'ADMIN': '/admin/dashboard',
  'GUIA': '/admin/clientes',
  'USER': '/user/cuenta-corriente'
};

// Obtener la ruta basada en el rol
const getRouteForRole = (role) => ROLE_PATHS[role] || '/';

// Componente de carga
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spin size="large" tip="Verificando autenticación..." />
  </div>
);

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const [authState, setAuthState] = useState({
    isLoading: true,
    isAuthorized: false,
    user: null
  });

  // Verificar autenticación solo cuando cambia la ubicación o los roles permitidos
  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      if (!isMounted) return;

      try {
        const token = authService.getToken();
        
        // Si no hay token, no está autenticado
        if (!token) {
          throw new Error('No autenticado');
        }

        // Obtener el usuario actual (usando la caché primero)
        const user = await authService.getCurrentUser(false);
        
        // Verificar si el usuario tiene el rol necesario
        const hasRequiredRole = !allowedRoles.length || (user?.role && allowedRoles.includes(user.role));

        if (isMounted) {
          setAuthState({
            isLoading: false,
            isAuthorized: !!user && hasRequiredRole,
            user
          });
        }

        // Verificar en segundo plano si el token sigue siendo válido
        if (user) {
          authService.getCurrentUser(true).catch(() => {
            if (isMounted) {
              authService.logout();
              setAuthState({
                isLoading: false,
                isAuthorized: false,
                user: null
              });
            }
          });
        }

      } catch (error) {
        console.error('Error de autenticación:', error);
        if (isMounted) {
          setAuthState({
            isLoading: false,
            isAuthorized: false,
            user: null
          });
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, allowedRoles]);

  // Mostrar spinner de carga
  if (authState.isLoading) {
    return <LoadingSpinner />;
  }

  // Si no está autenticado, redirigir al login
  if (!authState.isAuthorized) {
    // Si ya está en la página de login, no redirigir para evitar bucles
    if (location.pathname === '/login') {
      return children;
    }

    // Redirigir al login con la ubicación actual para redirigir después del login
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Si el usuario no tiene el rol necesario, redirigir según su rol
  if (authState.user?.role && allowedRoles.length > 0 && !allowedRoles.includes(authState.user.role)) {
    const userRolePath = getRouteForRole(authState.user.role);
    
    // Solo redirigir si el usuario no tiene acceso a la ruta actual
    if (!location.pathname.startsWith(userRolePath)) {
      console.log(`Redirigiendo a ${userRolePath} porque el rol ${authState.user.role} no tiene acceso a ${location.pathname}`);
      return <Navigate to={userRolePath} replace />;
    }
  }

  // Si está autorizado, renderizar los hijos
  return children;
};

export const PublicRoute = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const token = authService.getToken();
        
        if (token) {
          const currentUser = await authService.getCurrentUser(true);
          if (isMounted) {
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Mostrar spinner de carga
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Si hay un usuario autenticado, redirigir según su rol
  if (user?.role) {
    const rolePath = {
      'ADMIN': '/admin/dashboard',
      'GUIA': '/admin/clientes',
      'USER': '/user/cuenta-corriente'
    };
    
    const redirectTo = rolePath[user.role] || '/';
    
    // Solo redirigir si no está ya en la ruta destino
    if (location.pathname !== redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
  }
  
  return children;
};
