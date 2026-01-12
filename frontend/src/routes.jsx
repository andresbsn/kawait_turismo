import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

// Componentes de carga perezosa
const Login = lazy(() => import('./pages/auth/Login'));
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const DashboardContent = lazy(() => import('./pages/admin/dashboard/DashboardContent'));
const AdminUsuarios = lazy(() => import('./pages/admin/usuarios'));
const AdminReservas = lazy(() => import('./pages/admin/reservas/index'));
const AdminTours = lazy(() => import('./pages/admin/tours'));
import TourForm from './pages/admin/tours/TourForm';
const AdminAjustes = lazy(() => import('./pages/admin/ajustes'));
const AdminClientes = lazy(() => import('./pages/admin/clientes/Clientes'));
const CuentasCorrientesPage = lazy(() => import('./pages/CuentasCorrientesPage'));
const CuentaCorrienteDetalle = lazy(() => import('./pages/admin/cuentasCorrientes/CuentaCorrienteDetalle'));
const AdminReportes = lazy(() => import('./pages/admin/reportes'));
const UserDashboard = lazy(() => import('./pages/user/dashboard'));
const UserLayout = lazy(() => import('./pages/user/UserLayout'));
const MisCuentasCorrientes = lazy(() => import('./pages/user/cuentaCorriente/MisCuentasCorrientes'));
const GuideDashboard = lazy(() => import('./pages/guide/dashboard'));
const UserProfile = lazy(() => import('./pages/admin/perfil'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Componente de carga
const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

// Componente de envoltura para la carga perezosa
const LazyComponent = ({ component: Component }) => (
  <Suspense fallback={<Loading />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  // Ruta raíz redirige al login
  { 
    path: '/', 
    element: <Navigate to="/login" replace /> 
  },
  
  // Ruta de login (solo accesible si no estás autenticado)
  { 
    path: '/login', 
    element: (
      <PublicRoute>
        <LazyComponent component={Login} />
      </PublicRoute>
    )
  },

  // RUTAS DE ADMINISTRADOR Y GUÍA
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN', 'GUIA']}>
        <LazyComponent component={AdminLayout} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <LazyComponent component={DashboardContent} /> },
      { 
        path: 'usuarios', 
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <LazyComponent component={AdminUsuarios} />
          </ProtectedRoute>
        )
      },
      { 
        path: 'reservas',
        children: [
          { 
            index: true, 
            element: <LazyComponent component={AdminReservas} /> 
          },
          { 
            path: 'nuevo', 
            element: <LazyComponent component={lazy(() => import('./pages/admin/reservas/ReservaForm'))} />
          },
          { 
            path: 'editar/:id', 
            element: <LazyComponent component={lazy(() => import('./pages/admin/reservas/ReservaForm'))} />
          },
          { 
            path: 'ver/:id', 
            element: <div>Vista detallada de la reserva</div>
          }
        ]
      },
      { 
        path: 'tours', 
        children: [
          { index: true, element: <LazyComponent component={AdminTours} /> },
          { path: 'nuevo', element: <LazyComponent component={TourForm} /> },
          { path: 'editar/:id', element: <LazyComponent component={TourForm} /> },
          { path: 'ver/:id', element: <div>Vista detallada del tour</div> }
        ]
      },
      { 
        path: 'ajustes', 
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <LazyComponent component={AdminAjustes} />
          </ProtectedRoute>
        )
      },
      { path: 'clientes', element: <LazyComponent component={AdminClientes} /> },
      {
        path: 'reportes',
        element: (
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <LazyComponent component={AdminReportes} />
          </ProtectedRoute>
        )
      },
      { 
        path: 'cuentas-corrientes',
        children: [
          { index: true, element: <LazyComponent component={CuentasCorrientesPage} /> },
          { path: ':id', element: <LazyComponent component={CuentaCorrienteDetalle} /> }
        ]
      },
      { path: 'perfil', element: <LazyComponent component={UserProfile} /> },
    ],
  },

  // RUTAS DE USUARIO
  {
    path: '/user',
    element: (
      <ProtectedRoute allowedRoles={['USER']}>
        <LazyComponent component={UserLayout} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <LazyComponent component={UserDashboard} /> },
      { path: 'cuenta-corriente', element: <LazyComponent component={MisCuentasCorrientes} /> }
    ],
  },

  // RUTAS DE GUÍA
  {
    path: '/guide',
    element: (
      <ProtectedRoute allowedRoles={['GUIA']}>
        <LazyComponent component={GuideDashboard} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <LazyComponent component={GuideDashboard} /> },
    ],
  },

  // Ruta no encontrada
  {
    path: '*',
    element: <LazyComponent component={NotFound} />
  }
]);

export default router;

