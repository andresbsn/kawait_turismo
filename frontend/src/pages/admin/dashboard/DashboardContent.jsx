import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Typography, Progress, Space, Button, Table, Tag, message } from 'antd';
import { CalendarOutlined, DollarOutlined, FileTextOutlined, UserOutlined, WalletOutlined } from '@ant-design/icons';
import { getReporteFinanzas } from '../../../services/reportesService';

const { Title } = Typography;

const money = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

const DashboardContent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const role = String(user?.role || '').toUpperCase().trim();
  const isAdmin = role === 'ADMIN';

  const cargar = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const resp = await getReporteFinanzas({});
      setData(resp);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message;
      message.error(msg || 'No se pudo cargar el resumen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const kpis = data?.kpis;
  const cuotasPorEstado = data?.cuotas_por_estado || [];
  const topDeudores = data?.top_deudores || [];

  const cuotasMap = useMemo(() => {
    const m = {};
    cuotasPorEstado.forEach((r) => {
      m[String(r.estado)] = Number(r.cantidad || 0);
    });
    return m;
  }, [cuotasPorEstado]);

  const pctPagado = Math.round(Number(kpis?.porcentaje_pagado || 0));

  const quickActions = useMemo(() => {
    const base = [
      {
        key: 'reservas',
        title: 'Reservas',
        desc: 'Crear y gestionar viajes',
        icon: <CalendarOutlined />,
        to: '/admin/reservas'
      },
      {
        key: 'cuentas',
        title: 'Cuentas Corrientes',
        desc: 'Cuotas, saldos y pagos',
        icon: <WalletOutlined />,
        to: '/admin/cuentas-corrientes'
      },
      {
        key: 'clientes',
        title: 'Clientes',
        desc: 'Datos y contacto',
        icon: <UserOutlined />,
        to: '/admin/clientes'
      },
      {
        key: 'tours',
        title: 'Tours',
        desc: 'Catálogo y disponibilidad',
        icon: <FileTextOutlined />,
        to: '/admin/tours'
      }
    ];

    if (isAdmin) {
      base.push({
        key: 'reportes',
        title: 'Reportes',
        desc: 'Insights y filtros',
        icon: <DollarOutlined />,
        to: '/admin/reportes'
      });
    }

    return base;
  }, [isAdmin]);

  const topDeudoresCols = [
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, r) => `${r.nombre || ''} ${r.apellido || ''}`.trim() || r.email
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Deuda',
      dataIndex: 'saldo_pendiente',
      key: 'saldo_pendiente',
      align: 'right',
      render: (v) => money(v)
    }
  ];

  const deudaTags = (
    <Space wrap>
      <Tag color={cuotasMap.vencida ? 'red' : 'default'}>Vencidas: {cuotasMap.vencida || 0}</Tag>
      <Tag color={cuotasMap.pendiente ? 'gold' : 'default'}>Pendientes: {cuotasMap.pendiente || 0}</Tag>
      <Tag color={cuotasMap.cancelada ? 'blue' : 'default'}>Canceladas: {cuotasMap.cancelada || 0}</Tag>
    </Space>
  );

  return (
    <div className="p-6">
      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col>
          <Title level={2} style={{ margin: 0 }}>Inicio</Title>
          <Typography.Text type="secondary">
            Accesos rápidos y métricas clave
          </Typography.Text>
        </Col>
        <Col>
          <Space>
            {isAdmin && (
              <Button onClick={cargar} loading={loading}>Actualizar</Button>
            )}
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {quickActions.map((a) => (
          <Col key={a.key} xs={24} sm={12} md={8} lg={4}>
            <Card
              hoverable
              onClick={() => navigate(a.to)}
              style={{ height: '100%' }}
            >
              <Space direction="vertical" size={4}>
                <Space>
                  {a.icon}
                  <Typography.Text strong>{a.title}</Typography.Text>
                </Space>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{a.desc}</Typography.Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {isAdmin ? (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={6}>
              <Card loading={loading}>
                <Statistic title="Saldo pendiente" value={money(kpis?.saldo_pendiente)} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card loading={loading}>
                <Statistic title="Pagos (monto)" value={money(kpis?.pagos_monto)} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card loading={loading}>
                <Statistic title="Cuentas" value={kpis?.cuentas || 0} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card loading={loading}>
                <Statistic title="% pagado" value={`${pctPagado}%`} />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={8}>
              <Card title="Indicador de cobranzas" loading={loading}>
                <Progress type="dashboard" percent={pctPagado} />
                <div style={{ marginTop: 12 }}>
                  <Typography.Text type="secondary">
                    Pagado: {money(kpis?.pagos_monto)} | Pendiente: {money(kpis?.saldo_pendiente)}
                  </Typography.Text>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card title="Alertas rápidas" loading={loading}>
                {deudaTags}
                <div style={{ marginTop: 12 }}>
                  <Space>
                    <Button onClick={() => navigate('/admin/cuentas-corrientes')}>Ver cuentas</Button>
                    <Button type="primary" onClick={() => navigate('/admin/reportes')}>Abrir reportes</Button>
                  </Space>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card title="Top deudores" loading={loading}>
                <Table
                  rowKey={(r) => String(r.cliente_id)}
                  columns={topDeudoresCols}
                  dataSource={topDeudores}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={16}>
            <Card title="Atajos para tu trabajo (Guía)">
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                Usá los accesos rápidos para gestionar <strong>reservas</strong> y <strong>clientes</strong>. Los reportes financieros están disponibles para administradores.
              </Typography.Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title="Sugerencias">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button onClick={() => navigate('/admin/reservas')} icon={<CalendarOutlined />}>Ir a reservas</Button>
                <Button onClick={() => navigate('/admin/clientes')} icon={<UserOutlined />}>Ir a clientes</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default DashboardContent;
