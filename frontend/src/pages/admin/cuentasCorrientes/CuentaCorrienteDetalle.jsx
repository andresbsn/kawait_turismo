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
  message,
  Statistic,
  Row,
  Col,
  Divider,
  Upload
} from 'antd';
import { DollarOutlined, PlusOutlined, PaperClipOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getCuentaCorrienteById, registrarEntrega, getPagosCuenta, descargarComprobante as descargarComprobanteTransferencia } from '../../../services/cuentaCorrienteService';
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
    cancelada: { color: 'default', label: 'Cancelada' },
    en_proceso: { color: 'blue', label: 'En proceso' },
    pagado: { color: 'green', label: 'Pagado' }
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
  const [pagos, setPagos] = useState([]);

  const [openPago, setOpenPago] = useState(false);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null);
  const [savingPago, setSavingPago] = useState(false);
  const [form] = Form.useForm();

  // Para modal de entrega libre
  const [openEntrega, setOpenEntrega] = useState(false);
  const [savingEntrega, setSavingEntrega] = useState(false);
  const [formEntrega] = Form.useForm();
  const [archivoComprobante, setArchivoComprobante] = useState(null);

  const esSinCuotas = cuenta && Number(cuenta.cantidad_cuotas) === 0;

  const cargar = async () => {
    setLoading(true);
    try {
      const resp = await getCuentaCorrienteById(id);
      setCuenta(resp.cuenta);
      // Si es sin cuotas, cargar los pagos/entregas
      if (resp.cuenta && Number(resp.cuenta.cantidad_cuotas) === 0) {
        const pagosResp = await getPagosCuenta(id);
        setPagos(pagosResp.pagos || []);
      }
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
    const tour = cuenta.reserva?.tour?.nombre || cuenta.reserva?.tour_nombre || 'N/A';
    return (
      <Space direction="vertical" size={2}>
        <Title level={4} style={{ margin: 0 }}>Cuenta Corriente #{cuenta.id}</Title>
        <Text><b>Cliente:</b> {cliente}</Text>
        <Text><b>Tour:</b> {tour}</Text>
        <Text>
          <b>Monto total:</b> ${Number(cuenta.monto_total || 0).toLocaleString()} &nbsp;|&nbsp;
          <b>Saldo pendiente:</b> ${Number(cuenta.saldo_pendiente || 0).toLocaleString()} &nbsp;|&nbsp;
          <b>Modalidad:</b> {esSinCuotas ? <Tag color="purple">Sin cuotas (entregas)</Tag> : <Tag color="blue">{cuenta.cantidad_cuotas} cuota(s)</Tag>}
        </Text>
      </Space>
    );
  }, [cuenta, esSinCuotas]);

  // === CUOTAS: pago por cuota ===
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

  // === SIN CUOTAS: entregas libres ===
  const abrirEntrega = () => {
    formEntrega.resetFields();
    formEntrega.setFieldsValue({
      monto: '',
      metodo_pago: 'efectivo',
      observaciones: ''
    });
    setArchivoComprobante(null);
    setOpenEntrega(true);
  };

  const submitEntrega = async () => {
    try {
      const values = await formEntrega.validateFields();
      setSavingEntrega(true);
      const resp = await registrarEntrega(cuenta.id, values, archivoComprobante);
      message.success(`Entrega registrada: ${resp?.pago?.numero_comprobante || 'OK'}`);
      setOpenEntrega(false);
      setArchivoComprobante(null);
      await cargar();
    } catch (e) {
      const errMsg = e?.response?.data?.message || 'Error al registrar la entrega';
      message.error(errMsg);
    } finally {
      setSavingEntrega(false);
    }
  };

  // Descargar comprobante de transferencia
  const verComprobanteTransferencia = async (pago) => {
    try {
      const blob = await descargarComprobanteTransferencia(pago.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      message.error('No se pudo abrir el comprobante de transferencia');
    }
  };

  // === PDF ===
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

  // === COLUMNAS CUOTAS ===
  const columnsCuotas = [
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

  // === COLUMNAS ENTREGAS (SIN CUOTAS) ===
  const columnsEntregas = [
    {
      title: '#',
      key: 'index',
      width: 60,
      render: (_, __, index) => pagos.length - index
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha_pago',
      key: 'fecha_pago',
      render: (v) => v ? new Date(v).toLocaleDateString('es-AR') : 'N/A'
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      align: 'right',
      render: (v) => `$${Number(v || 0).toLocaleString()}`
    },
    {
      title: 'Método',
      dataIndex: 'metodo_pago',
      key: 'metodo_pago',
      render: (v) => {
        const label = METODOS_PAGO.find(m => m.value === v)?.label || v;
        return label;
      }
    },
    {
      title: 'Comprobante',
      dataIndex: 'numero_comprobante',
      key: 'numero_comprobante',
    },
    {
      title: 'Observaciones',
      dataIndex: 'observaciones',
      key: 'observaciones',
      ellipsis: true
    },
    {
      title: 'Comprobante Transf.',
      key: 'comprobante_transf',
      width: 140,
      render: (_, pago) => {
        if (!pago.comprobante_transferencia) return <Text type="secondary">-</Text>;
        return (
          <Button
            type="link"
            icon={<PaperClipOutlined />}
            onClick={() => verComprobanteTransferencia(pago)}
          >
            Ver
          </Button>
        );
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, pago) => (
        <Space>
          <Button onClick={() => verComprobante(pago)}>Ver PDF</Button>
          <Button onClick={() => descargarComprobante(pago)}>Descargar</Button>
        </Space>
      )
    }
  ];

  // Cálculos para resumen sin cuotas
  const totalEntregas = pagos.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space>
        <Button onClick={() => navigate(`/admin/cuentas-corrientes${location.search || ''}`)}>Volver</Button>
      </Space>

      <Card loading={loading} title={header}>
        {esSinCuotas ? (
          <>
            {/* Resumen visual */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic
                  title="Total de la reserva"
                  value={Number(cuenta?.monto_total || 0)}
                  prefix="$"
                  precision={0}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total entregado"
                  value={totalEntregas}
                  prefix="$"
                  precision={0}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Saldo pendiente"
                  value={Number(cuenta?.saldo_pendiente || 0)}
                  prefix="$"
                  precision={0}
                  valueStyle={{ color: Number(cuenta?.saldo_pendiente || 0) > 0 ? '#cf1322' : '#3f8600' }}
                />
              </Col>
            </Row>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>Entregas realizadas</Title>
              {Number(cuenta?.saldo_pendiente || 0) > 0 && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={abrirEntrega}
                >
                  Nueva Entrega
                </Button>
              )}
            </div>

            <Table
              rowKey="id"
              columns={columnsEntregas}
              dataSource={pagos}
              pagination={false}
              locale={{ emptyText: 'No hay entregas registradas aún' }}
            />
          </>
        ) : (
          <Table
            rowKey="id"
            columns={columnsCuotas}
            dataSource={cuenta?.cuotas || []}
            pagination={false}
          />
        )}
      </Card>

      {/* Modal de pago de cuota */}
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

      {/* Modal de entrega libre (sin cuotas) */}
      <Modal
        title="Nueva Entrega"
        open={openEntrega}
        onCancel={() => setOpenEntrega(false)}
        onOk={submitEntrega}
        okText="Registrar Entrega"
        cancelText="Cancelar"
        confirmLoading={savingEntrega}
      >
        <Form layout="vertical" form={formEntrega}>
          <Form.Item
            label={`Monto de la entrega (saldo pendiente: $${Number(cuenta?.saldo_pendiente || 0).toLocaleString()})`}
            name="monto"
            rules={[
              { required: true, message: 'Ingresá el monto' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              max={Number(cuenta?.saldo_pendiente || 0)}
              step={1000}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
            />
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
              const metodo = formEntrega.getFieldValue('metodo_pago');
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

          <Form.Item shouldUpdate noStyle>
            {() => {
              const metodo = formEntrega.getFieldValue('metodo_pago');
              if (metodo !== 'transferencia') return null;

              return (
                <Form.Item label="Comprobante de Transferencia" style={{ marginBottom: 16 }}>
                  <Upload
                    maxCount={1}
                    beforeUpload={(file) => {
                      // Validar tipo
                      const esValido = file.type.startsWith('image/') || file.type === 'application/pdf';
                      if (!esValido) {
                        message.error('Solo se permiten imágenes o archivos PDF');
                        return Upload.LIST_IGNORE;
                      }
                      // Validar tamaño (5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        message.error('El archivo no puede superar los 5MB');
                        return Upload.LIST_IGNORE;
                      }
                      setArchivoComprobante(file);
                      return false; // Evitar upload automático
                    }}
                    onRemove={() => setArchivoComprobante(null)}
                    fileList={archivoComprobante ? [archivoComprobante] : []}
                    accept="image/*,.pdf"
                  >
                    <Button icon={<UploadOutlined />}>Adjuntar comprobante</Button>
                  </Upload>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Imagen o PDF del comprobante de transferencia (máx. 5MB)
                  </Text>
                </Form.Item>
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
