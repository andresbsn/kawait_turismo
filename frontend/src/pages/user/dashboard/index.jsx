import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, theme, Card, Row, Col, Statistic } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const UserDashboard = () => {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={false}>
        <div className="logo" style={{
          height: '32px',
          margin: '16px',
          background: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          KAWAY TURISMO
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              icon: <DashboardOutlined />,
              label: 'Inicio',
            },
            {
              key: '2',
              icon: <BookOutlined />,
              label: 'Nueva Reserva',
            },
            {
              key: '3',
              icon: <HistoryOutlined />,
              label: 'Mis Reservas',
            },
            {
              key: '4',
              icon: <EnvironmentOutlined />,
              label: 'Tours Disponibles',
            },
            {
              key: '5',
              icon: <UserOutlined />,
              label: 'Mi Perfil',
            },
            {
              key: '6',
              icon: <LogoutOutlined />,
              label: 'Cerrar Sesión',
              onClick: handleLogout,
            },
          ]}
        />
      </Sider>
      <Layout className="site-layout">
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <div style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Mi Cuenta</h2>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '16px' }}>Bienvenido, Usuario</span>
            </div>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          <h1>Bienvenido a tu Panel de Usuario</h1>
          <p>Gestiona tus reservas y encuentra nuevos destinos para explorar.</p>
          
          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Próximo Tour"
                  value="Tour por la Ciudad"
                  valueStyle={{ fontSize: '18px' }}
                />
                <p>Fecha: 15/11/2023</p>
                <p>Hora: 09:00 AM</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Reservas Activas"
                  value={2}
                  valueStyle={{ color: '#3f8600' }}
                />
                <p>Próximos viajes</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Puntos de Fidelidad"
                  value={450}
                  valueStyle={{ color: '#1890ff' }}
                  suffix="puntos"
                />
                <p>¡Sigue acumulando para obtener descuentos!</p>
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: '24px' }}>
            <h2>Tus Próximos Tours</h2>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Card 
                  title="Tour por la Ciudad" 
                  extra={<a href="#">Ver detalles</a>}
                  style={{ marginBottom: '16px' }}
                >
                  <p><strong>Fecha:</strong> 15/11/2023</p>
                  <p><strong>Hora:</strong> 09:00 AM</p>
                  <p><strong>Punto de encuentro:</strong> Plaza Principal</p>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card 
                  title="Aventura en la Montaña" 
                  extra={<a href="#">Ver detalles</a>}
                  style={{ marginBottom: '16px' }}
                >
                  <p><strong>Fecha:</strong> 20/11/2023</p>
                  <p><strong>Hora:</strong> 08:00 AM</p>
                  <p><strong>Punto de encuentro:</strong> Estación de Autobuses</p>
                </Card>
              </Col>
            </Row>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserDashboard;
