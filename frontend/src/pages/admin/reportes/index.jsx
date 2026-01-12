import React, { useEffect, useMemo, useState } from 'react';
import { Card, Col, DatePicker, Progress, Row, Select, Space, Statistic, Switch, Table, Typography, Button, message } from 'antd';
import { getReporteFinanzas } from '../../../services/reportesService';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const money = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

const BarList = ({ items, valueKey = 'cantidad', labelKey = 'estado' }) => {
  const max = Math.max(1, ...items.map((i) => Number(i[valueKey] || 0)));
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {items.map((it) => {
        const value = Number(it[valueKey] || 0);
        const width = Math.round((value / max) * 100);
        return (
          <div key={String(it[labelKey])} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{String(it[labelKey])}</Text>
              <Text strong>{value}</Text>
            </div>
            <div style={{ height: 10, background: '#f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: 10, width: `${width}%`, background: '#1677ff' }} />
            </div>
          </div>
        );
      })}
    </Space>
  );
};

export default function AdminReportes() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const [rango, setRango] = useState(null);
  const [soloDeudas, setSoloDeudas] = useState(false);
  const [estadoCuota, setEstadoCuota] = useState(undefined);
  const [estadoCuenta, setEstadoCuenta] = useState(undefined);

  const filtros = useMemo(() => {
    const f = {};
    if (rango?.[0] && rango?.[1]) {
      f.desde = rango[0].format('YYYY-MM-DD');
      f.hasta = rango[1].format('YYYY-MM-DD');
    }
    if (soloDeudas) f.soloDeudas = true;
    if (estadoCuota) f.estadoCuota = estadoCuota;
    if (estadoCuenta) f.estadoCuenta = estadoCuenta;
    return f;
  }, [rango, soloDeudas, estadoCuota, estadoCuenta]);

  const cargar = async () => {
    setLoading(true);
    try {
      const resp = await getReporteFinanzas(filtros);
      setData(resp);
    } catch (e) {
      message.error('No se pudo cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const kpis = data?.kpis;
  const cuotasPorEstado = data?.cuotas_por_estado || [];
  const cuentasPorEstado = data?.cuentas_por_estado || [];
  const topDeudores = data?.top_deudores || [];

  const topDeudoresCols = [
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, r) => `${r.nombre || ''} ${r.apellido || ''}`.trim() || r.email
    },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Cuentas', dataIndex: 'cantidad_cuentas', key: 'cantidad_cuentas', width: 90 },
    {
      title: 'Deuda',
      dataIndex: 'saldo_pendiente',
      key: 'saldo_pendiente',
      align: 'right',
      render: (v) => money(v)
    }
  ];

  const pctPagado = Number(kpis?.porcentaje_pagado || 0);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>Reportes</Title>
            <Text type="secondary">Finanzas, deudas, cuotas y pagos</Text>
          </Col>
          <Col>
            <Space>
              <RangePicker value={rango} onChange={setRango} />
              <Select
                allowClear
                placeholder="Estado cuenta"
                style={{ width: 180 }}
                value={estadoCuenta}
                onChange={setEstadoCuenta}
                options={[
                  { value: 'pendiente', label: 'pendiente' },
                  { value: 'en_proceso', label: 'en_proceso' },
                  { value: 'pagado', label: 'pagado' },
                  { value: 'atrasado', label: 'atrasado' },
                  { value: 'cancelado', label: 'cancelado' }
                ]}
              />
              <Select
                allowClear
                placeholder="Estado cuota"
                style={{ width: 180 }}
                value={estadoCuota}
                onChange={setEstadoCuota}
                options={[
                  { value: 'pendiente', label: 'pendiente' },
                  { value: 'pagada_parcial', label: 'pagada_parcial' },
                  { value: 'pagada_total', label: 'pagada_total' },
                  { value: 'vencida', label: 'vencida' },
                  { value: 'cancelada', label: 'cancelada' }
                ]}
              />
              <Space>
                <Text>Solo deudas</Text>
                <Switch checked={soloDeudas} onChange={setSoloDeudas} />
              </Space>
              <Button type="primary" onClick={cargar} loading={loading}>Aplicar</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card loading={loading}>
            <Statistic title="Cuentas" value={kpis?.cuentas || 0} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card loading={loading}>
            <Statistic title="Monto total" value={money(kpis?.monto_total)} />
          </Card>
        </Col>
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
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="% Pagado vs Pendiente" loading={loading}>
            <Progress type="dashboard" percent={Math.round(pctPagado)} />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Pagado: {money(kpis?.pagos_monto)} | Pendiente: {money(kpis?.saldo_pendiente)}</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="Cuotas por estado (barras)" loading={loading}>
            <BarList items={cuotasPorEstado} valueKey="cantidad" labelKey="estado" />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="Cuentas por estado (barras)" loading={loading}>
            <BarList items={cuentasPorEstado} valueKey="cantidad" labelKey="estado" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Top deudores" loading={loading}>
            <Table
              rowKey={(r) => String(r.cliente_id)}
              columns={topDeudoresCols}
              dataSource={topDeudores}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
