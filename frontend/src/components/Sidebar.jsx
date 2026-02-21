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
  ChevronRightIcon,
  CurrencyDollarIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { authService } from '../config/api';
import logo from './assets/logo.jpeg';

const Sidebar = ({ collapsed, onCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Cerrar sidebar móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Obtener datos del usuario al cargar el componente
  useEffect(() => {
    let isMounted = true;
    
    const loadUser = async () => {
      if (isLoading === false) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        const response = await authService.getCurrentUser();
        console.log('Respuesta del servidor (getCurrentUser):', response);
        
        if (response && response.success && response.user) {
          if (isMounted) {
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
          }
        } else {
          throw new Error('Datos de usuario no válidos en la respuesta');
        }
      } catch (error) {
        console.error('Error al cargar el usuario:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
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

    loadUser();
    
    return () => {
      isMounted = false;
    };
  }, [isLoading, navigate, location]);

  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      try {
        await authService.logout();
      } catch (serverError) {
        console.warn('No se pudo notificar al servidor del cierre de sesión:', serverError);
      }
      
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
        },
        {
          name: 'Gastos',
          href: '/admin/gastos',
          icon: CurrencyDollarIcon,
          current: location.pathname.startsWith('/admin/gastos'),
          roles: ['ADMIN']
        }
      );
    }
    
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
      <>
        {/* Placeholder desktop */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 h-screen bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        </div>
      </>
    );
  }

  const navItems = getNavItems();

  const menuItemClasses = (isActive) => 
    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive 
        ? 'bg-primary-600 text-white shadow-lg' 
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  // Contenido del sidebar (compartido entre mobile y desktop)
  const sidebarContent = (
    <>
      {/* Logo y título */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src={logo} 
            alt="Kawai Turismo" 
            className={`h-10 w-10 rounded-lg ${collapsed ? 'mx-auto' : ''}`}
          />
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              Kawai Turismo
            </h1>
          )}
        </div>
        {/* Botón colapsar solo en desktop */}
        <button 
          onClick={onCollapse}
          className="hidden md:block p-1.5 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white focus:outline-none transition-colors duration-200"
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
        {/* Botón cerrar solo en mobile */}
        <button 
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white focus:outline-none transition-colors duration-200"
          aria-label="Cerrar menú"
        >
          <XMarkIcon className="h-5 w-5" />
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
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors duration-200"
          >
            <ArrowLeftOnRectangleIcon className={`${collapsed ? 'mx-auto' : 'mr-3'} h-5 w-5`} />
            {!collapsed && 'Cerrar sesión'}
          </button>
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Botón hamburguesa para mobile — visible solo en pantallas chicas */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-gray-800 text-white shadow-lg hover:bg-gray-700 transition-colors duration-200"
        aria-label="Abrir menú"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Overlay para mobile */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile — drawer que se desliza */}
      <div className={`
        md:hidden fixed inset-y-0 left-0 z-50 w-64 
        bg-gradient-to-b from-gray-900 to-gray-800 text-white
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {sidebarContent}
      </div>

      {/* Sidebar desktop — siempre visible, colapsa con icono */}
      <div className={`
        hidden md:flex md:flex-col md:flex-shrink-0
        h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white
        ${collapsed ? 'w-20' : 'w-64'}
        transition-all duration-300 ease-in-out
      `}>
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
