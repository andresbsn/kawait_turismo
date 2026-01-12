import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, theme, Card, Table, Tag, Badge } from 'antd';
import {
  DashboardOutlined,
  ScheduleOutlined,
  TeamOutlined,
  MessageOutlined,
  UserOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const GuideDashboard = () => {
  const navigate = useNavigate();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const columns = [
    {
      title: 'Tour',
      dataIndex: 'tour',
      key: 'tour',
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Hora',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Pasajeros',
      dataIndex: 'passengers',
      key: 'passengers',
    },
    {
      title: 'Estado',
      key: 'status',
      dataIndex: 'status',
      render: (status) => {
        let color = 'geekblue';
        if (status === 'Completado') color = 'green';
        if (status === 'Cancelado') color = 'volcano';
        if (status === 'En progreso') color = 'orange';
        return (
          <Tag color={color} key={status}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'action',
      render: (_, record) => (
        <a>Ver detalles</a>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      tour: 'Tour por la Ciudad',
      date: '15/11/2023',
      time: '09:00 AM',
      passengers: 8,
      status: 'Pendiente',
    },
    {
      key: '2',
      tour: 'Aventura en la Montaña',
      date: '16/11/2023',
      time: '08:00 AM',
      passengers: 5,
      status: 'Pendiente',
    },
    {
      key: '3',
      tour: 'Tour Gastronómico',
      date: '14/11/2023',
      time: '06:00 PM',
      passengers: 6,
      status: 'Completado',
    },
  ];

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
              icon: <ScheduleOutlined />,
              label: 'Mis Tours',
            },
            {
              key: '3',
              icon: <TeamOutlined />,
              label: 'Grupos',
            },
            {
              key: '4',
              icon: <MessageOutlined />,
              label: 'Mensajes',
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
            <h2>Panel de Guía</h2>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '16px' }}>Bienvenido, Guía</span>
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
          <h1>Bienvenido a tu Panel de Guía</h1>
          <p>Gestiona tus tours y mantente al día con tus actividades.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', margin: '24px 0' }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Tours Pendientes</p>
                  <h2 style={{ margin: '8px 0 0 0', fontSize: '24px' }}>5</h2>
                </div>
                <Badge count={5} style={{ backgroundColor: '#1890ff' }} />
              </div>
            </Card>
            
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Próximo Tour</p>
                  <h2 style={{ margin: '8px 0 0 0', fontSize: '16px' }}>Tour por la Ciudad</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>15/11/2023 - 09:00 AM</p>
                </div>
                <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              </div>
            </Card>
            
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Calificación</p>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '24px', marginRight: '8px' }}>4.8</span>
                    <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>/5.0</span>
                  </div>
                </div>
                <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              </div>
            </Card>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h2>Próximos Tours Programados</h2>
            <Table 
              columns={columns} 
              dataSource={data} 
              style={{ marginTop: '16px' }}
              pagination={false}
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default GuideDashboard;
