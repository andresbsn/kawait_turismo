import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, InputNumber, Select,
  DatePicker, Tag, Space, message, Tooltip, Row, Col, Statistic,
  Popconfirm, Badge, Typography
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  DollarOutlined, ClockCircleOutlined, ExclamationCircleOutlined,
  FilterOutlined, ReloadOutlined, WalletOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import gastoService from '../../../services/gastoService';

const { Option } = Select;
const { Text, Title } = Typography;

const CATEGORIAS = [
  { value: 'alojamiento', label: 'Alojamiento', color: 'blue' },
  { value: 'transporte', label: 'Transporte', color: 'cyan' },
  { value: 'excursion', label: 'Excursión', color: 'green' },
  { value: 'seguro', label: 'Seguro', color: 'orange' },
  { value: 'comision', label: 'Comisión', color: 'purple' },
  { value: 'impuesto', label: 'Impuesto', color: 'red' },
  { value: 'proveedor', label: 'Proveedor', color: 'magenta' },
  { value: 'operativo', label: 'Operativo', color: 'geekblue' },
  { value: 'otro', label: 'Otro', color: 'default' },
];

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'orange', icon: <ClockCircleOutlined /> },
  { value: 'pagado', label: 'Pagado', color: 'green', icon: <CheckCircleOutlined /> },
  { value: 'vencido', label: 'Vencido', color: 'red', icon: <ExclamationCircleOutlined /> },
  { value: 'cancelado', label: 'Cancelado', color: 'default', icon: null },
];

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
  { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'otro', label: 'Otro' },
];

const GastosPage = () => {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });
  const [resumen, setResumen] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pagarModalVisible, setPagarModalVisible] = useState(false);
  const [gastoSeleccionado, setGastoSeleccionado] = useState(null);
  const [form] = Form.useForm();
  const [pagarForm] = Form.useForm();
  const [filtros, setFiltros] = useState({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const cargarGastos = useCallback(async (page = 1, pageSize = 15) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        ...filtros
      };
      const result = await gastoService.getGastos(params);
      setGastos(result.data || []);
      setPagination({
        current: result.page || page,
        pageSize: result.limit || pageSize,
        total: result.total || 0
      });
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      message.error('Error al cargar los gastos');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  const cargarResumen = useCallback(async () => {
    try {
      const result = await gastoService.getResumen(filtros);
      setResumen(result.data);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  }, [filtros]);

  useEffect(() => {
    cargarGastos();
    cargarResumen();
  }, [cargarGastos, cargarResumen]);

  const handleTableChange = (pag) => {
    cargarGastos(pag.current, pag.pageSize);
  };

  const abrirModalCrear = () => {
    setGastoSeleccionado(null);
    form.resetFields();
    form.setFieldsValue({
      moneda: 'ARS',
      categoria: 'otro',
      estado: 'pendiente'
    });
    setModalVisible(true);
  };

  const abrirModalEditar = (gasto) => {
    setGastoSeleccionado(gasto);
    form.setFieldsValue({
      ...gasto,
      fecha_vencimiento: gasto.fecha_vencimiento ? dayjs(gasto.fecha_vencimiento) : null,
      fecha_pago: gasto.fecha_pago ? dayjs(gasto.fecha_pago) : null,
      importe: parseFloat(gasto.importe)
    });
    setModalVisible(true);
  };

  const abrirModalPagar = (gasto) => {
    setGastoSeleccionado(gasto);
    pagarForm.resetFields();
    pagarForm.setFieldsValue({
      fecha_pago: dayjs(),
      metodo_pago: gasto.metodo_pago || 'efectivo'
    });
    setPagarModalVisible(true);
  };

  const guardarGasto = async () => {
    try {
      const values = await form.validateFields();

      const data = {
        ...values,
        fecha_vencimiento: values.fecha_vencimiento?.format('YYYY-MM-DD'),
        fecha_pago: values.fecha_pago?.format('YYYY-MM-DD') || null,
      };

      if (gastoSeleccionado) {
        await gastoService.actualizarGasto(gastoSeleccionado.id, data);
        message.success('Gasto actualizado correctamente');
      } else {
        await gastoService.crearGasto(data);
        message.success('Gasto creado correctamente');
      }

      setModalVisible(false);
      cargarGastos(pagination.current, pagination.pageSize);
      cargarResumen();
    } catch (error) {
      if (error.errorFields) return; // validation error
      console.error('Error al guardar gasto:', error);
      message.error(error.response?.data?.message || 'Error al guardar el gasto');
    }
  };

  const confirmarPago = async () => {
    try {
      const values = await pagarForm.validateFields();
      await gastoService.marcarPagado(gastoSeleccionado.id, {
        fecha_pago: values.fecha_pago?.format('YYYY-MM-DD'),
        metodo_pago: values.metodo_pago
      });
      message.success('Gasto marcado como pagado');
      setPagarModalVisible(false);
      cargarGastos(pagination.current, pagination.pageSize);
      cargarResumen();
    } catch (error) {
      if (error.errorFields) return;
      console.error('Error al marcar como pagado:', error);
      message.error('Error al marcar como pagado');
    }
  };

  const eliminarGasto = async (id) => {
    try {
      await gastoService.eliminarGasto(id);
      message.success('Gasto eliminado');
      cargarGastos(pagination.current, pagination.pageSize);
      cargarResumen();
    } catch (error) {
      console.error('Error al eliminar:', error);
      message.error('Error al eliminar el gasto');
    }
  };

  const aplicarFiltros = (values) => {
    const f = {};
    if (values.estado) f.estado = values.estado;
    if (values.categoria) f.categoria = values.categoria;
    if (values.desde) f.desde = values.desde.format('YYYY-MM-DD');
    if (values.hasta) f.hasta = values.hasta.format('YYYY-MM-DD');
    setFiltros(f);
  };

  const limpiarFiltros = () => {
    setFiltros({});
  };

  const formatMoneda = (valor, moneda = 'ARS') => {
    if (!valor && valor !== 0) return '-';
    return `${moneda === 'USD' ? 'US$' : '$'} ${parseFloat(valor).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  };

  const getEstadoTag = (estado) => {
    const est = ESTADOS.find(e => e.value === estado);
    return est ? <Tag icon={est.icon} color={est.color}>{est.label}</Tag> : <Tag>{estado}</Tag>;
  };

  const getCategoriaTag = (categoria) => {
    const cat = CATEGORIAS.find(c => c.value === categoria);
    return cat ? <Tag color={cat.color}>{cat.label}</Tag> : <Tag>{categoria}</Tag>;
  };

  const columns = [
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      ellipsis: true,
      width: 250,
      render: (text, record) => (
        <div>
          <Text strong style={{ display: 'block' }}>{text}</Text>
          {record.proveedor && <Text type="secondary" style={{ fontSize: 12 }}>{record.proveedor}</Text>}
        </div>
      )
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      width: 130,
      render: getCategoriaTag
    },
    {
      title: 'Importe',
      dataIndex: 'importe',
      key: 'importe',
      width: 140,
      align: 'right',
      render: (val, record) => (
        <Text strong style={{ color: '#cf1322' }}>
          {formatMoneda(val, record.moneda)}
        </Text>
      )
    },
    {
      title: 'Vencimiento',
      dataIndex: 'fecha_vencimiento',
      key: 'fecha_vencimiento',
      width: 130,
      render: (fecha) => {
        if (!fecha) return '-';
        const fv = dayjs(fecha);
        const hoy = dayjs();
        const vencido = fv.isBefore(hoy, 'day');
        return (
          <Text type={vencido ? 'danger' : undefined}>
            {fv.format('DD/MM/YYYY')}
          </Text>
        );
      },
      sorter: (a, b) => dayjs(a.fecha_vencimiento).unix() - dayjs(b.fecha_vencimiento).unix()
    },
    {
      title: 'Fecha Pago',
      dataIndex: 'fecha_pago',
      key: 'fecha_pago',
      width: 120,
      render: (fecha) => fecha ? dayjs(fecha).format('DD/MM/YYYY') : <Text type="secondary">Sin pagar</Text>
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: 110,
      render: getEstadoTag,
      filters: ESTADOS.map(e => ({ text: e.label, value: e.value })),
      onFilter: (value, record) => record.estado === value
    },
    {
      title: 'N° Factura',
      dataIndex: 'numero_factura',
      key: 'numero_factura',
      width: 120,
      render: (val) => val || <Text type="secondary">-</Text>
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.estado === 'pendiente' && (
            <Tooltip title="Marcar como pagado">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => abrirModalPagar(record)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              />
            </Tooltip>
          )}
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => abrirModalEditar(record)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar este gasto?"
            onConfirm={() => eliminarGasto(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        <WalletOutlined style={{ marginRight: 8 }} />
        Gastos
      </Title>

      {/* Resumen */}
      {resumen && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Total General"
                value={resumen.total_general || 0}
                prefix="$"
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Total Pagado"
                value={resumen.total_pagado || 0}
                prefix={<CheckCircleOutlined />}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Total Pendiente"
                value={resumen.total_pendiente || 0}
                prefix={<ClockCircleOutlined />}
                precision={2}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" hoverable>
              <Statistic
                title="Cantidad de Gastos"
                value={resumen.total_gastos || 0}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filtros */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                Filtros
              </Button>
              {Object.keys(filtros).length > 0 && (
                <Button size="small" onClick={limpiarFiltros} icon={<ReloadOutlined />}>
                  Limpiar
                </Button>
              )}
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={abrirModalCrear}>
              Nuevo Gasto
            </Button>
          </Col>
        </Row>

        {mostrarFiltros && (
          <Form
            layout="inline"
            onFinish={aplicarFiltros}
            style={{ marginTop: 16, flexWrap: 'wrap', gap: 8 }}
          >
            <Form.Item name="estado" style={{ marginBottom: 8 }}>
              <Select placeholder="Estado" style={{ width: 140 }} allowClear>
                {ESTADOS.map(e => <Option key={e.value} value={e.value}>{e.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="categoria" style={{ marginBottom: 8 }}>
              <Select placeholder="Categoría" style={{ width: 150 }} allowClear>
                {CATEGORIAS.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="desde" style={{ marginBottom: 8 }}>
              <DatePicker placeholder="Desde" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="hasta" style={{ marginBottom: 8 }}>
              <DatePicker placeholder="Hasta" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 8 }}>
              <Button type="primary" htmlType="submit">Filtrar</Button>
            </Form.Item>
          </Form>
        )}
      </Card>

      {/* Tabla */}
      <Card>
        <Table
          columns={columns}
          dataSource={gastos}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `${total} gastos`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          rowClassName={(record) => {
            if (record.estado === 'vencido') return 'row-vencido';
            if (record.estado === 'pagado') return 'row-pagado';
            return '';
          }}
        />
      </Card>

      {/* Modal Crear/Editar */}
      <Modal
        title={gastoSeleccionado ? 'Editar Gasto' : 'Nuevo Gasto'}
        open={modalVisible}
        onOk={guardarGasto}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText={gastoSeleccionado ? 'Actualizar' : 'Crear'}
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="descripcion"
                label="Descripción"
                rules={[{ required: true, message: 'La descripción es obligatoria' }]}
              >
                <Input.TextArea rows={2} placeholder="Descripción del gasto" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="categoria"
                label="Categoría"
                rules={[{ required: true, message: 'Seleccioná una categoría' }]}
              >
                <Select placeholder="Seleccioná categoría">
                  {CATEGORIAS.map(c => <Option key={c.value} value={c.value}>{c.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="proveedor"
                label="Proveedor"
              >
                <Input placeholder="Nombre del proveedor" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="importe"
                label="Importe"
                rules={[{ required: true, message: 'Ingresá el importe' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  step={100}
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="moneda" label="Moneda">
                <Select>
                  <Option value="ARS">ARS</Option>
                  <Option value="USD">USD</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fecha_vencimiento"
                label="Fecha de Vencimiento"
                rules={[{ required: true, message: 'Ingresá la fecha de vencimiento' }]}
              >
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="estado" label="Estado">
                <Select>
                  {ESTADOS.map(e => <Option key={e.value} value={e.value}>{e.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="metodo_pago" label="Método de Pago">
                <Select placeholder="Seleccioná método" allowClear>
                  {METODOS_PAGO.map(m => <Option key={m.value} value={m.value}>{m.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fecha_pago" label="Fecha de Pago">
                <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Si ya se pagó" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="numero_factura" label="N° Factura/Comprobante">
                <Input placeholder="Número de factura" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reserva_id" label="Reserva Asociada (ID)">
                <InputNumber style={{ width: '100%' }} placeholder="ID de reserva (opcional)" min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="observaciones" label="Observaciones">
                <Input.TextArea rows={2} placeholder="Observaciones adicionales" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Pagar */}
      <Modal
        title="Registrar Pago"
        open={pagarModalVisible}
        onOk={confirmarPago}
        onCancel={() => setPagarModalVisible(false)}
        okText="Confirmar Pago"
        cancelText="Cancelar"
        width={400}
      >
        {gastoSeleccionado && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">Gasto:</Text>
            <br />
            <Text strong>{gastoSeleccionado.descripcion}</Text>
            <br />
            <Text type="danger" strong style={{ fontSize: 18 }}>
              {formatMoneda(gastoSeleccionado.importe, gastoSeleccionado.moneda)}
            </Text>
          </div>
        )}
        <Form form={pagarForm} layout="vertical">
          <Form.Item
            name="fecha_pago"
            label="Fecha de Pago"
            rules={[{ required: true, message: 'Seleccioná la fecha de pago' }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="metodo_pago"
            label="Método de Pago"
            rules={[{ required: true, message: 'Seleccioná el método de pago' }]}
          >
            <Select>
              {METODOS_PAGO.map(m => <Option key={m.value} value={m.value}>{m.label}</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .row-vencido {
          background-color: #fff1f0 !important;
        }
        .row-pagado {
          background-color: #f6ffed !important;
        }
      `}</style>
    </div>
  );
};

export default GastosPage;
