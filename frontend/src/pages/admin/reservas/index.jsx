import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Select, 
  DatePicker, 
  message, 
  Spin,
  Popconfirm,
  Tooltip,
  Empty,
  Modal,
  Form,
  InputNumber
} from 'antd';
import { 
  CalendarOutlined, 
  SearchOutlined, 
  SyncOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { bookingService } from '../../../config/api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta_credito', label: 'Tarjeta Crédito' },
  { value: 'tarjeta_debito', label: 'Tarjeta Débito' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'otro', label: 'Otro' },
];

const Reservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    estado: '',
    search: '',
    fecha: null,
    referencia: '',
    titular: '',
  });
  const [pagoModalVisible, setPagoModalVisible] = useState(false);
  const [reservaPagoSeleccionada, setReservaPagoSeleccionada] = useState(null);
  const [savingPago, setSavingPago] = useState(false);
  const [pagoForm] = Form.useForm();
  const navigate = useNavigate();

  // Cargar reservas
  const fetchReservas = async (params = {}) => {
    try {
      setLoading(true);

      const { current = 1, pageSize = 10 } = params;
      const { estado, search, fecha, referencia, titular } = filters;

      const queryParams = {
        page: current,
        limit: pageSize,
        ...(estado && { estado }),
        ...(search && { search }),
        ...(referencia && { referencia }),
        ...(titular && { titular }),
        ...(fecha && fecha[0] && fecha[1] && {
          fechaInicio: fecha[0].format('YYYY-MM-DD'),
          fechaFin: fecha[1].format('YYYY-MM-DD')
        })
      };

      try {
        const response = await bookingService.getBookings(queryParams);

        if (response && response.success) {
          const reservasMapeadas = (response.reservas || []).map(reserva => {
            const titular = Array.isArray(reserva.clientes) && reserva.clientes.length > 0 ? reserva.clientes[0] : null;
            const tourNombre = reserva.tour?.nombre || reserva.tour_nombre || 'Sin tour';
            const tourDestino = reserva.tour?.destino || reserva.tour_destino || '';
            const cuentas = Array.isArray(reserva.cuentas_corrientes) ? reserva.cuentas_corrientes : [];
            
            const montoTotalCuenta = cuentas.reduce((sum, cuenta) => sum + Number(cuenta?.monto_total || 0), 0);
            const saldoPendienteCuenta = cuentas.reduce((sum, cuenta) => sum + Number(cuenta?.saldo_pendiente || 0), 0);
            const montoTotalCalculadoVuelo = Number(reserva.cantidad_personas || 0) * Number(reserva.precio_unitario || 0);
            
            const montoTotalFinal = montoTotalCuenta > 0 ? montoTotalCuenta : montoTotalCalculadoVuelo;
            const montoAbonadoFinal = cuentas.length > 0 
              ? Math.max(0, montoTotalFinal - saldoPendienteCuenta)
              : Number(reserva.monto_abonado || 0);
            const saldoPendienteFinal = cuentas.length > 0 
              ? saldoPendienteCuenta 
              : Math.max(0, montoTotalFinal - montoAbonadoFinal);

            console.log(`[Diagnostic] Reserva ${reserva.codigo}:`, {
              monto_total_db_or_calc: montoTotalFinal,
              monto_abonado_db: reserva.monto_abonado,
              monto_abonado_parsed: montoAbonadoFinal,
              saldo_pendiente_final: saldoPendienteFinal,
              cuentas_corrientes_len: cuentas.length
            });

            const nombreClienteManual = (reserva.nombre_cliente || reserva.apellido_cliente)
              ? `${reserva.nombre_cliente || ''} ${reserva.apellido_cliente || ''}`.trim()
              : null;

            return {
              ...reserva,
              nombreCliente: titular 
                ? `${titular.nombre || ''} ${titular.apellido || ''}`.trim() 
                : (nombreClienteManual || 'Sin titular'),
              emailCliente: titular?.email || reserva.email_cliente || 'Sin email',
              telefonoCliente: titular?.telefono || reserva.telefono_cliente || 'Sin teléfono',
              fechaReserva: reserva.fecha_reserva || new Date().toISOString(),
              cantidadPersonas: reserva.cantidad_personas || 1,
              precioUnitario: reserva.precio_unitario || 0,
              montoTotal: montoTotalFinal,
              saldoPendiente: saldoPendienteFinal,
              montoAbonado: montoAbonadoFinal,
              tour: {
                ...(reserva.tour || {}),
                nombre: tourNombre,
                destino: tourDestino,
              },
              key: reserva.id || Math.random().toString(36).substr(2, 9)
            };
          });

          setReservas(reservasMapeadas);
          setPagination((prev) => ({
            ...prev,
            current: response.page || current,
            pageSize: response.limit || pageSize,
            total: response.total || 0,
          }));
        } else {
          message.error(response?.message || 'Error al cargar las reservas');
          setReservas([]);
        }
      } catch (apiError) {
        console.error('Error en la petición de reservas:', apiError);
        if (apiError.status !== 401) {
          message.error(apiError.message || 'Error al cargar las reservas');
        }
        setReservas([]);
      }
    } catch (error) {
      console.error('Error al cargar reservas:', error);
      message.error('Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalPago = (reserva) => {
    const saldoPendiente = Number(reserva?.saldoPendiente || 0);
    setReservaPagoSeleccionada(reserva);
    setPagoModalVisible(true);
    pagoForm.setFieldsValue({
      monto: saldoPendiente > 0 ? saldoPendiente : undefined,
      metodo_pago: 'transferencia',
      nombre_entrega: '',
      email_entrega: ''
    });
  };

  const cerrarModalPago = () => {
    setPagoModalVisible(false);
    setReservaPagoSeleccionada(null);
    pagoForm.resetFields();
  };

  const confirmarPago = async () => {
    if (!reservaPagoSeleccionada) return;

    try {
      const values = await pagoForm.validateFields();
      const saldoPendiente = Number(reservaPagoSeleccionada.saldoPendiente || 0);
      const monto = Number(values.monto || 0);

      if (monto <= 0) {
        message.error('El importe debe ser mayor a 0');
        return;
      }

      if (saldoPendiente > 0 && monto > saldoPendiente) {
        message.error('El importe no puede superar el saldo adeudado');
        return;
      }

      setSavingPago(true);

      const observaciones = [
        values.nombre_entrega ? `Entrega por: ${values.nombre_entrega}` : null,
        values.email_entrega ? `Email: ${values.email_entrega}` : null,
      ].filter(Boolean).join(' | ');

      await bookingService.registrarPagoReserva(reservaPagoSeleccionada.id, {
        monto,
        metodo_pago: values.metodo_pago,
        nombre_entrega: values.nombre_entrega,
        email_entrega: values.email_entrega,
        observaciones,
      });

      message.success('Pago generado y asociado a la reserva');
      cerrarModalPago();
      fetchReservas({
        current: pagination.current,
        pageSize: pagination.pageSize,
      });
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || 'No se pudo generar el pago');
    } finally {
      setSavingPago(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchReservas({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  }, [filters, pagination.current, pagination.pageSize]);

  // Manejar cambio de página o tamaño de página
  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFilters({
      estado: '',
      search: '',
      fecha: null,
      referencia: '',
      titular: '',
    });
  };

  // Manejar eliminación de reserva
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const response = await bookingService.deleteBooking(id);
      if (response.success) {
        message.success('Reserva eliminada exitosamente');
        // Recargar las reservas con la paginación actual
        fetchReservas({
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters
        });
      } else {
        message.error(response.message || 'Error al eliminar la reserva');
      }
    } catch (error) {
      console.error('Error al eliminar la reserva:', error);
      message.error(error.message || 'Error al eliminar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Código / Referencias',
      dataIndex: 'codigo',
      key: 'codigo',
      render: (text, record) => {
        const refColors = {
          terrestre: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
          aereo: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
          asistencia: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' }
        };

        return (
          <div>
            <div className="font-semibold text-gray-800">{text}</div>
            {Array.isArray(record.referencias) && record.referencias.length > 0 && (
              <div className="mt-1.5 flex flex-col gap-1">
                {record.referencias.map((ref) => {
                  const colors = refColors[ref.tipo] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
                  return (
                    <div 
                      key={ref.id} 
                      className={`text-[11px] px-2 py-0.5 rounded border ${colors.bg} ${colors.text} ${colors.border} flex flex-col`}
                      style={{ maxWidth: '200px' }}
                    >
                      <div className="font-medium capitalize">{ref.tipo}</div>
                      <div className="truncate">Ref: <span className="font-semibold">{ref.referencia || 'Sin ref.'}</span></div>
                      {ref.titular && <div className="truncate text-gray-500">Titular: {ref.titular}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Destino',
      dataIndex: ['tour', 'destino'],
      key: 'destino',
      render: (destino) => <span className="font-medium text-gray-800">{destino || 'Sin destino'}</span>,
    },
    {
      title: 'Cliente',
      dataIndex: 'cliente',
      key: 'cliente',
      render: (_, record) => (
        <div>
          <div>{record.nombreCliente}</div>
          <div className="text-xs text-gray-500">{record.emailCliente}</div>
        </div>
      ),
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaReserva',
      key: 'fecha',
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.fechaReserva) - new Date(b.fechaReserva),
    },
    {
      title: 'Pasajeros',
      dataIndex: 'cantidadPersonas',
      key: 'pasajeros',
      align: 'center',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      filters: [
        { text: 'Pendiente', value: 'pendiente' },
        { text: 'Confirmada', value: 'confirmada' },
        { text: 'Cancelada', value: 'cancelada' },
        { text: 'Completada', value: 'completada' },
      ],
      filteredValue: filters.estado ? [filters.estado] : null,
      onFilter: (value, record) => record.estado === value,
      render: (estado) => {
        const estadoConfig = {
          pendiente: { color: 'orange', text: 'Pendiente' },
          confirmada: { color: 'green', text: 'Confirmada' },
          cancelada: { color: 'red', text: 'Cancelada' },
          completada: { color: 'blue', text: 'Completada' },
        };
        const config = estadoConfig[estado] || { color: 'default', text: estado };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Monto Total',
      dataIndex: 'montoTotal',
      key: 'monto',
      render: (_, record) => {
        const total = Number(record?.montoTotal || 0);
        const adeudado = Number(record?.saldoPendiente || 0);
        const moneda = record?.moneda_precio_unitario === 'USD' ? 'USD' : 'ARS';
        return (
          <div>
            <div>{`${moneda} ${total.toLocaleString('es-CL')}`}</div>
            <div className="text-xs text-gray-500">{`Adeuda: ${moneda} ${adeudado.toLocaleString('es-CL')}`}</div>
          </div>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Ver detalles">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/admin/reservas/ver/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/admin/reservas/editar/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Generar pago">
            <Button
              type="primary"
              onClick={() => abrirModalPago(record)}
              disabled={Number(record?.saldoPendiente || 0) <= 0}
            >
              Generar pago
            </Button>
          </Tooltip>
          <Popconfirm
            title="¿Está seguro de eliminar esta reserva?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Eliminar">
              <Button danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="reservas-container">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          <CalendarOutlined className="mr-2" />
          Gestión de Reservas
        </h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate('/admin/reservas/nuevo')}
        >
          Nueva Reserva
        </Button>
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Búsqueda General</label>
            <Input
              placeholder="Buscar por código o cliente"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onPressEnter={() => fetchReservas()}
              allowClear
              prefix={<SearchOutlined />}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Referencia</label>
            <Input
              placeholder="Ref. de reserva, aéreo, terrestre..."
              value={filters.referencia}
              onChange={(e) => handleFilterChange('referencia', e.target.value)}
              onPressEnter={() => fetchReservas()}
              allowClear
              prefix={<SearchOutlined />}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Titular de Referencia / Nombre</label>
            <Input
              placeholder="Nombre de titular en referencias..."
              value={filters.titular}
              onChange={(e) => handleFilterChange('titular', e.target.value)}
              onPressEnter={() => fetchReservas()}
              allowClear
              prefix={<SearchOutlined />}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Estado</label>
            <Select
              placeholder="Filtrar por estado"
              style={{ width: '100%' }}
              allowClear
              value={filters.estado || null}
              onChange={(value) => handleFilterChange('estado', value)}
            >
              <Option value="pendiente">Pendiente</Option>
              <Option value="confirmada">Confirmada</Option>
              <Option value="cancelada">Cancelada</Option>
              <Option value="completada">Completada</Option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Rango de Fechas</label>
            <RangePicker 
              style={{ width: '100%' }}
              onChange={(dates) => handleFilterChange('fecha', dates)}
              value={filters.fecha}
              format="DD/MM/YYYY"
              placeholder={['Fecha inicio', 'Fecha fin']}
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={limpiarFiltros}
              className="w-full"
              icon={<SyncOutlined />}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Spin spinning={loading}>
          <Table 
            columns={columns} 
            dataSource={reservas} 
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} reservas`,
              pageSizeOptions: ['10', '20', '50', '100'],
              showQuickJumper: true,
              size: 'default',
            }}
            onChange={handleTableChange}
            locale={{
              emptyText: (
                <Empty 
                  description={
                    <span>No hay reservas registradas</span>
                  }
                >
                  <Button 
                    type="primary" 
                    onClick={() => navigate('/admin/reservas/nuevo')}
                  >
                    Crear Primera Reserva
                  </Button>
                </Empty>
              )
            }}
          />
        </Spin>
      </Card>

      <Modal
        title="Generar pago"
        open={pagoModalVisible}
        onCancel={cerrarModalPago}
        onOk={confirmarPago}
        okText="Confirmar pago"
        cancelText="Cancelar"
        confirmLoading={savingPago}
      >
        <Form layout="vertical" form={pagoForm}>
          <Form.Item>
            <div style={{ color: '#666' }}>
              {`Saldo adeudado: $${Number(reservaPagoSeleccionada?.saldoPendiente || 0).toLocaleString('es-CL')}`}
            </div>
          </Form.Item>

          <Form.Item
            label="Importe a entregar"
            name="monto"
            rules={[{ required: true, message: 'Ingresá el importe' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              max={Number(reservaPagoSeleccionada?.saldoPendiente || 0) || undefined}
              step={1000}
            />
          </Form.Item>

          <Form.Item
            label="Método de pago"
            name="metodo_pago"
            rules={[{ required: true, message: 'Seleccioná el método de pago' }]}
          >
            <Select options={METODOS_PAGO} />
          </Form.Item>

          <Form.Item
            label="Nombre de quien entrega"
            name="nombre_entrega"
            rules={[{ required: true, message: 'Ingresá el nombre' }]}
          >
            <Input placeholder="Nombre y apellido" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email_entrega"
            rules={[
              { required: true, message: 'Ingresá el email' },
              { type: 'email', message: 'Ingresá un email válido' }
            ]}
          >
            <Input placeholder="email@dominio.com" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Reservas;
