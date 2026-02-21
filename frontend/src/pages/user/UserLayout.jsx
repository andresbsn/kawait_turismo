import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Drawer, theme } from 'antd';
import {
  DashboardOutlined,
  DollarOutlined,
  LogoutOutlined,
  MenuOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Inicio',
      onClick: () => { navigate('/user/dashboard'); setMobileOpen(false); }
    },
    {
      key: 'cuenta',
      icon: <DollarOutlined />,
      label: 'Mi Cuenta Corriente',
      onClick: () => { navigate('/user/cuenta-corriente'); setMobileOpen(false); }
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: () => { handleLogout(); setMobileOpen(false); }
    }
  ];

  const siderContent = (
    <>
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
        KAWAI TURISMO
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar desktop */}
      <Sider
        trigger={null}
        collapsible
        collapsed={false}
        breakpoint="md"
        collapsedWidth={0}
        style={{ display: 'none' }}
        className="user-sider-desktop"
      >
        {siderContent}
      </Sider>

      {/* Sidebar visible solo en desktop via CSS */}
      <div className="hidden md:block">
        <Sider trigger={null} style={{ height: '100vh', position: 'sticky', top: 0 }}>
          {siderContent}
        </Sider>
      </div>

      {/* Drawer para mobile */}
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        width={250}
        bodyStyle={{ padding: 0, background: '#001529' }}
        headerStyle={{ display: 'none' }}
        className="md:hidden"
      >
        <div style={{ background: '#001529', minHeight: '100%' }}>
          {siderContent}
        </div>
      </Drawer>

      <Layout className="site-layout" style={{ minWidth: 0 }}>
        <Header style={{ 
          padding: '0 16px', 
          background: colorBgContainer, 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          {/* Botón hamburguesa solo en mobile */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileOpen(true)}
            className="md:hidden"
            style={{ fontSize: 18, marginRight: 12 }}
          />
          <span style={{ fontWeight: 600, fontSize: 16 }}>Mi Cuenta</span>
        </Header>
        <Content
          style={{
            margin: '16px 8px',
            padding: '16px',
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      {/* CSS inline para mostrar/ocultar sidebar desktop */}
      <style>{`
        @media (max-width: 767px) {
          .user-sider-desktop,
          .hidden.md\\:block {
            display: none !important;
          }
        }
        @media (min-width: 768px) {
          .ant-drawer.md\\:hidden {
            display: none !important;
          }
        }
        @media (min-width: 768px) {
          .md\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default UserLayout;
