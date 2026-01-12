import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserAddOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AdminLayout = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Obtener el nombre del usuario
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'Administrador';

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{
          overflow: 'hidden',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 1000,
          flex: '0 0 auto'
        }}
        width={250}
      >
        <div className="logo" style={{
          height: '64px',
          margin: '16px',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'KT' : 'KAWAY TURISMO'}
        </div>
        
        <Menu 
          theme="dark" 
          mode="inline" 
          defaultSelectedKeys={['1']}
        >
          <Menu.Item key="1" icon={<DashboardOutlined />} onClick={() => navigate('/admin/dashboard')}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="2" icon={<UserOutlined />} onClick={() => navigate('/admin/usuarios')}>
            Usuarios
          </Menu.Item>
          <Menu.Item key="3" icon={<UserAddOutlined />} onClick={() => navigate('/admin/clientes')}>
            Clientes
          </Menu.Item>
          <Menu.Item key="4" icon={<CalendarOutlined />} onClick={() => navigate('/admin/reservas')}>
            Reservas
          </Menu.Item>
          <Menu.Item key="5" icon={<TeamOutlined />} onClick={() => navigate('/admin/guias')}>
            Guías
          </Menu.Item>
          <Menu.Item key="6" icon={<SettingOutlined />} onClick={() => navigate('/admin/ajustes')}>
            Ajustes
          </Menu.Item>
          <Menu.Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <Menu.Item 
            key="logout" 
            icon={<LogoutOutlined />} 
            danger
            onClick={handleLogout}
          >
            Cerrar Sesión
          </Menu.Item>
        </Menu>
        
        {!collapsed && (
          <div style={{ 
            padding: '16px', 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            color: 'rgba(255, 255, 255, 0.65)'
          }}>
            <div style={{ fontSize: '12px' }}>Bienvenido,</div>
            <div style={{ fontWeight: 500 }}>{userName}</div>
          </div>
        )}
      </Sider>
      
      <Layout style={{ 
        flex: '1', 
        marginLeft: collapsed ? 80 : 50, 
        transition: 'margin-left 0.2s',
        minHeight: '100vh',
        background: '#f0f2f5'
      }}>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'flex-end',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <span style={{ marginRight: '16px' }}>{userName}</span>
        </Header>
        <Content style={{ 
          margin: '16px', 
          padding: '16px', 
          minHeight: 'calc(100vh - 96px)',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
