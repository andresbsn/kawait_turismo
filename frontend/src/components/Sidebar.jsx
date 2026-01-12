import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  UserGroupIcon, 
  UserIcon, 
  DocumentTextIcon, 
  Cog8ToothIcon, 
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  ChartBarIcon,
  CalendarIcon,
  MapIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { authService } from '../config/api';
import logo from './assets/logo.jpeg'; // Ruta corregida para el logo

const Sidebar = ({ collapsed, onCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener datos del usuario al cargar el componente
  useEffect(() => {
    let isMounted = true;
    
    const loadUser = async () => {
      // Si ya estamos cargando, no hacer nada
      if (isLoading === false) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        const response = await authService.getCurrentUser();
        console.log('Respuesta del servidor (getCurrentUser):', response);
        
        // La respuesta tiene la estructura { success: true, user: {...} }
        if (response && response.success && response.user) {
          if (isMounted) {
            setUser(response.user);
            // Guardar el usuario en localStorage para persistencia
            localStorage.setItem('user', JSON.stringify(response.user));
          }
        } else {
          throw new Error('Datos de usuario no válidos en la respuesta');
        }
      } catch (error) {
        console.error('Error al cargar el usuario:', error);
        // Limpiar el almacenamiento local en caso de error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirigir al login solo si no estamos ya en la página de login
        if (!window.location.pathname.includes('/login')) {
          navigate('/login', { 
            state: { from: location },
            replace: true 
          });
        }
      } finally {
        if (isMounted && isLoading) {
          setIsLoading(false);
        }
      }
    };

    // Intentar cargar el usuario desde localStorage primero
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (e) {
        console.error('Error al analizar los datos del usuario guardados:', e);
        localStorage.removeItem('user');
      }
    }

    // Luego intentar actualizar desde el servidor
    loadUser();
    
    // Limpiar al desmontar
    return () => {
      isMounted = false;
    };
  }, [isLoading, navigate, location]);

  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      // Limpiar el token y los datos del usuario del almacenamiento local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Opcional: Llamar al endpoint de logout en el servidor
      try {
        await authService.logout();
      } catch (serverError) {
        console.warn('No se pudo notificar al servidor del cierre de sesión:', serverError);
        // Continuar con el cierre de sesión local incluso si falla la llamada al servidor
      }
      
      // Redirigir a la página de login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Asegurarse de limpiar el almacenamiento local incluso si hay un error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login', { replace: true });
    }
  };

  // Elementos del menú según el rol del usuario
  const getNavItems = () => {
    if (!user) return [];
    
    const items = [
      { 
        name: 'Inicio', 
        href: '/admin/dashboard', 
        icon: HomeIcon, 
        current: location.pathname === '/admin/dashboard',
        roles: ['ADMIN', 'GUIA']
      },
    ];

    // Solo el administrador puede ver usuarios
    if (user.role === 'ADMIN') {
      items.push(
        {
          name: 'Usuarios',
          href: '/admin/usuarios',
          icon: UserGroupIcon,
          current: location.pathname.startsWith('/admin/usuarios'),
          roles: ['ADMIN']
        },
        {
          name: 'Clientes',
          href: '/admin/clientes',
          icon: UserIcon,
          current: location.pathname.startsWith('/admin/clientes'),
          roles: ['ADMIN']
        },
        {
          name: 'Tours',
          href: '/admin/tours',
          icon: MapIcon,
          current: location.pathname.startsWith('/admin/tours'),
          roles: ['ADMIN']
        },
        {
          name: 'Reservas',
          href: '/admin/reservas',
          icon: CalendarIcon,
          current: location.pathname.startsWith('/admin/reservas'),
          roles: ['ADMIN', 'GUIA']
        },
        {
          name: 'Reportes',
          href: '/admin/reportes',
          icon: ChartBarIcon,
          current: location.pathname.startsWith('/admin/reportes'),
          roles: ['ADMIN']
        }
      );
    }
    
    // Elementos para GUIA
    if (user.role === 'GUIA') {
      items.push(
        {
          name: 'Clientes',
          href: '/admin/clientes',
          icon: UserIcon,
          current: location.pathname.startsWith('/admin/clientes'),
          roles: ['GUIA']
        },
        {
          name: 'Reservas',
          href: '/admin/reservas',
          icon: CalendarIcon,
          current: location.pathname.startsWith('/admin/reservas'),
          roles: ['GUIA']
        }
      );
    }

    // Elemento de perfil para todos los roles
    items.push({
      name: 'Mi Perfil',
      href: '/admin/perfil',
      icon: UserCircleIcon,
      current: location.pathname.startsWith('/admin/perfil'),
      roles: ['ADMIN', 'GUIA']
    });

    return items.filter(item => item.roles.includes(user?.role));
  };

  if (isLoading) {
    return (
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 h-screen bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  const navItems = getNavItems();

  // Estilos para los enlaces del menú
  const menuItemClasses = (isActive) => 
    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive 
        ? 'bg-primary-600 text-white shadow-lg' 
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  // Obtener la ruta actual
  const currentPath = location.pathname;

  return (
    <div className={`h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white ${collapsed ? 'w-20' : 'w-64'} flex flex-col transition-all duration-300 ease-in-out`}>
      {/* Logo y título */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src={logo} 
            alt="Kawait Turismo" 
            className={`h-10 w-10 rounded-lg ${collapsed ? 'mx-auto' : ''}`}
          />
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Kawait Turismo
            </h1>
          )}
        </div>
        <button 
          onClick={onCollapse}
          className="p-1.5 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white focus:outline-none transition-colors duration-200"
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Información del usuario */}
      <div className="p-4 border-b border-gray-700">
        <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
          {!collapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-400">
                {user?.role === 'ADMIN' ? 'Administrador' : 
                 user?.role === 'GUIA' ? 'Guía' : 'Usuario'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Menú de navegación */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${menuItemClasses(item.current)} mb-1`}
              title={collapsed ? item.name : ''}
            >
              <item.icon className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 flex-shrink-0`} />
              {!collapsed && item.name}
              {item.current && (
                <span className="ml-auto bg-white/20 rounded-full w-1.5 h-1.5"></span>
              )}
            </Link>
          ))}
          
          <div className="border-t border-gray-700 my-2"></div>
          
          {/* Botón de cierre de sesión */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors duration-200"
          >
            <ArrowLeftOnRectangleIcon className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5`} />
            {!collapsed && 'Cerrar sesión'}
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
