import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, theme } from 'antd';
import {
  DashboardOutlined,
  DollarOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer }
  } = theme.useToken();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const selectedKey = location.pathname.startsWith('/user/cuenta-corriente')
    ? 'cuenta'
    : 'dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={false}>
        <div
          className="logo"
          style={{
            height: '32px',
            margin: '16px',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}
        >
          KAWAY TURISMO
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: 'Inicio',
              onClick: () => navigate('/user/dashboard')
            },
            {
              key: 'cuenta',
              icon: <DollarOutlined />,
              label: 'Mi Cuenta Corriente',
              onClick: () => navigate('/user/cuenta-corriente')
            },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Cerrar Sesión',
              onClick: handleLogout
            }
          ]}
        />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserLayout;
