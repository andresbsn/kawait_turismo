import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Badge, 
  Input, 
  Select, 
  DatePicker, 
  message, 
  Spin,
  Popconfirm,
  Tooltip,
  Empty
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
  });
  const navigate = useNavigate();

  // Cargar reservas
  const fetchReservas = async (params = {}) => {
    try {
      setLoading(true);
      
      const { current = 1, pageSize = 10 } = pagination;
      const { estado, search, fecha } = filters;
      
      // Construir parámetros de consulta
      const queryParams = {
        page: current,
        limit: pageSize,
        ...(estado && { estado }),
        ...(search && { search }),
        ...(fecha && fecha[0] && fecha[1] && { 
          fechaInicio: fecha[0].format('YYYY-MM-DD'),
          fechaFin: fecha[1].format('YYYY-MM-DD')
        })
      };
      
      try {
        const response = await bookingService.getBookings(queryParams);
        
        if (response && response.success) {
          // Mapear los datos para que coincidan con lo que espera la tabla
          const reservasMapeadas = (response.reservas || []).map(reserva => {
            const titular = Array.isArray(reserva.clientes) ? reserva.clientes[0] : null;
            const tourNombre = reserva.tour?.nombre || reserva.tour_nombre || 'Sin tour';
            const tourDestino = reserva.tour?.destino || reserva.tour_destino || '';

            return {
              ...reserva,
              nombreCliente: titular ? `${titular.nombre || ''} ${titular.apellido || ''}`.trim() : 'Sin cliente',
              emailCliente: titular?.email || 'Sin email',
              telefonoCliente: titular?.telefono || 'Sin teléfono',
              fechaReserva: reserva.fecha_reserva || new Date().toISOString(),
              cantidadPersonas: reserva.cantidad_personas || 1,
              precioUnitario: reserva.precio_unitario || 0,
              montoTotal: reserva.monto_total || 0,
              tour: {
                ...(reserva.tour || {}),
                nombre: tourNombre,
                destino: tourDestino,
              },
              key: reserva.id || Math.random().toString(36).substr(2, 9)
            };
          });
          
          setReservas(reservasMapeadas);
          setPagination({
            ...pagination,
            current: response.page || current,
            pageSize: response.limit || pageSize,
            total: response.total || 0,
          });
        } else {
          message.error(response?.message || 'Error al cargar las reservas');
          setReservas([]);
        }
      } catch (apiError) {
        console.error('Error en la petición de reservas:', apiError);
        // No mostrar mensaje de error si es un error de autenticación (se maneja en el interceptor)
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

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchReservas();
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
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      render: (text) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Tour',
      dataIndex: ['tour', 'nombre'],
      key: 'tour',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.tour?.nombre}</div>
          <div className="text-xs text-gray-500">{record.tour?.destino}</div>
        </div>
      ),
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
      render: (monto) => `$${parseFloat(monto || 0).toLocaleString('es-CL')}`,
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
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
            <RangePicker 
              style={{ width: '100%' }}
              onChange={(dates) => handleFilterChange('fecha', dates)}
              value={filters.fecha}
              format="DD/MM/YYYY"
              placeholder={['Fecha inicio', 'Fecha fin']}
            />
          </div>
          <div>
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
    </div>
  );
};

export default Reservas;
