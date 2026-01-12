import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  Input,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getCuentaCorrienteById } from '../../../services/cuentaCorrienteService';
import { registrarPagoCuota } from '../../../services/cuotaService';
import { getComprobantePdf } from '../../../services/pagoService';

const { Title, Text } = Typography;

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta_credito', label: 'Tarjeta Crédito' },
  { value: 'tarjeta_debito', label: 'Tarjeta Débito' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'echq', label: 'eCheq' },
  { value: 'otro', label: 'Otro' }
];

const estadoTag = (estado) => {
  const map = {
    pendiente: { color: 'default', label: 'Pendiente' },
    pagada_parcial: { color: 'orange', label: 'Parcial' },
    pagada_total: { color: 'green', label: 'Pagada' },
    vencida: { color: 'red', label: 'Vencida' },
    cancelada: { color: 'default', label: 'Cancelada' }
  };

  const v = map[estado] || { color: 'default', label: estado };
  return <Tag color={v.color}>{v.label}</Tag>;
};

const openBlobPdf = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (!w) {
    // Fallback: descargar
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

const downloadBlobPdf = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

const CuentaCorrienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [cuenta, setCuenta] = useState(null);

  const [openPago, setOpenPago] = useState(false);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null);
  const [savingPago, setSavingPago] = useState(false);
  const [form] = Form.useForm();

  const cargar = async () => {
    setLoading(true);
    try {
      const resp = await getCuentaCorrienteById(id);
      setCuenta(resp.cuenta);
    } catch (e) {
      message.error('No se pudo cargar la cuenta corriente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [id]);

  const header = useMemo(() => {
    if (!cuenta) return null;
    const cliente = cuenta.cliente ? `${cuenta.cliente.nombre} ${cuenta.cliente.apellido}` : 'N/A';
    const tour = cuenta.reserva?.tour?.nombre || 'N/A';
    return (
      <Space direction="vertical" size={2}>
        <Title level={4} style={{ margin: 0 }}>Cuenta Corriente #{cuenta.id}</Title>
        <Text><b>Cliente:</b> {cliente}</Text>
        <Text><b>Tour:</b> {tour}</Text>
        <Text>
          <b>Monto total:</b> ${Number(cuenta.monto_total || 0).toLocaleString()} &nbsp;|&nbsp;
          <b>Saldo pendiente:</b> ${Number(cuenta.saldo_pendiente || 0).toLocaleString()}
        </Text>
      </Space>
    );
  }, [cuenta]);

  const abrirPago = (cuota) => {
    setCuotaSeleccionada(cuota);
    form.resetFields();
    form.setFieldsValue({
      monto_pagado: Number(cuota.monto) - Number(cuota.monto_pagado || 0),
      metodo_pago: 'efectivo',
      observaciones: ''
    });
    setOpenPago(true);
  };

  const submitPago = async () => {
    try {
      const values = await form.validateFields();
      setSavingPago(true);
      const resp = await registrarPagoCuota(cuotaSeleccionada.id, values);
      message.success(`Pago registrado: ${resp?.pago?.numero_comprobante || 'OK'}`);
      setOpenPago(false);
      setCuotaSeleccionada(null);
      await cargar();
    } catch (e) {
      // el interceptor global ya muestra el error en muchos casos
    } finally {
      setSavingPago(false);
    }
  };

  const verComprobante = async (pago) => {
    try {
      const blob = await getComprobantePdf(pago.id, { download: false });
      openBlobPdf(blob, `${pago.numero_comprobante || 'comprobante'}.pdf`);
    } catch (e) {
      message.error('No se pudo abrir el comprobante');
    }
  };

  const descargarComprobante = async (pago) => {
    try {
      const blob = await getComprobantePdf(pago.id, { download: true });
      downloadBlobPdf(blob, `${pago.numero_comprobante || 'comprobante'}.pdf`);
    } catch (e) {
      message.error('No se pudo descargar el comprobante');
    }
  };

  const columns = [
    {
      title: 'Cuota',
      dataIndex: 'numero_cuota',
      key: 'numero_cuota',
      width: 90
    },
    {
      title: 'Vencimiento',
      dataIndex: 'fecha_vencimiento',
      key: 'fecha_vencimiento',
      render: (v) => (v ? new Date(v).toLocaleDateString('es-AR') : 'N/A')
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      align: 'right',
      render: (v) => `$${Number(v || 0).toLocaleString()}`
    },
    {
      title: 'Pagado',
      dataIndex: 'monto_pagado',
      key: 'monto_pagado',
      align: 'right',
      render: (_, cuota) => {
        const monto = cuota?.pago?.monto !== undefined && cuota?.pago?.monto !== null
          ? cuota.pago.monto
          : cuota.monto_pagado;
        return `$${Number(monto || 0).toLocaleString()}`;
      }
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (v) => estadoTag(v)
    },
    {
      title: 'Comprobante',
      key: 'comprobante',
      render: (_, cuota) => {
        const p = cuota.pago;
        if (!p) return <Text type="secondary">-</Text>;
        return <Text>{p.numero_comprobante || `#${p.id}`}</Text>;
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, cuota) => {
        const saldo = Number(cuota.monto) - Number(cuota.monto_pagado || 0);
        const puedePagar = saldo > 0 && !cuota.pago;

        return (
          <Space>
            {puedePagar && (
              <Button type="primary" onClick={() => abrirPago(cuota)}>
                Registrar pago
              </Button>
            )}
            {cuota.pago && (
              <>
                <Button onClick={() => verComprobante(cuota.pago)}>Ver PDF</Button>
                <Button onClick={() => descargarComprobante(cuota.pago)}>Descargar</Button>
              </>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space>
        <Button onClick={() => navigate(`/admin/cuentas-corrientes${location.search || ''}`)}>Volver</Button>
      </Space>

      <Card loading={loading} title={header}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={cuenta?.cuotas || []}
          pagination={false}
        />
      </Card>

      <Modal
        title={cuotaSeleccionada ? `Registrar pago - Cuota ${cuotaSeleccionada.numero_cuota}` : 'Registrar pago'}
        open={openPago}
        onCancel={() => {
          setOpenPago(false);
          setCuotaSeleccionada(null);
        }}
        onOk={submitPago}
        okText="Guardar"
        cancelText="Cancelar"
        confirmLoading={savingPago}
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Monto pagado"
            name="monto_pagado"
            rules={[{ required: true, message: 'Ingresá el monto' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0.01} step={100} />
          </Form.Item>

          <Form.Item
            label="Método de pago"
            name="metodo_pago"
            rules={[{ required: true, message: 'Seleccioná un método' }]}
          >
            <Select options={METODOS_PAGO} />
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const metodo = form.getFieldValue('metodo_pago');
              if (metodo !== 'cheque' && metodo !== 'echq') return null;

              return (
                <Card size="small" title="Datos de cheque" style={{ marginBottom: 16 }}>
                  <Form.Item label="Banco" name={['extra', 'banco']}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Número" name={['extra', 'numero']}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Fecha emisión" name={['extra', 'fecha_emision']}>
                    <Input placeholder="DD/MM/AAAA" />
                  </Form.Item>
                  <Form.Item label="Fecha cobro" name={['extra', 'fecha_cobro']}>
                    <Input placeholder="DD/MM/AAAA" />
                  </Form.Item>
                </Card>
              );
            }}
          </Form.Item>

          <Form.Item label="Observaciones" name="observaciones">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default CuentaCorrienteDetalle;
