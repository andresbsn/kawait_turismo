import React, { useState, useEffect, useRef } from 'react';
import { 
  Table, 
  Button, 
  Card, 
  Input, 
  Row, 
  Col, 
  Select, 
  Tag, 
  Space, 
  Popconfirm, 
  message, 
  Tooltip, 
  Badge,
  Spin,
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
// Eliminada la dependencia de react-highlight-words
import { tourService } from '../../../config/api';

const { Search } = Input;
const { Option } = Select;

const Tours = () => {
  const navigate = useNavigate();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    estado: '',
    sortField: 'fechaInicio',
    sortOrder: 'ascend'
  });
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef(null);

  // Obtener la lista de tours
  const fetchTours = async (params = {}) => {
    try {
      setLoading(true);
      
      const { current = 1, pageSize = 10 } = params.pagination || pagination;
      const { search, estado, sortField, sortOrder } = filters;
      
      // Construir parámetros de consulta
      const queryParams = {
        page: current,
        limit: pageSize,
      };
      
      // Agregar filtros si existen
      if (search) queryParams.search = search;
      if (estado) queryParams.estado = estado;
      if (sortField) queryParams.sortField = sortField;
      if (sortOrder) queryParams.sortOrder = sortOrder === 'ascend' ? 'ASC' : 'DESC';
      
      const response = await tourService.obtenerTours(queryParams);
      
      if (response.success) {
        setTours(response.tours || []);
        setPagination({
          ...pagination,
          current: response.page || current,
          pageSize: response.limit || pageSize,
          total: response.total || 0,
        });
      } else {
        message.error(response.message || 'Error al cargar los tours');
        setTours([]);
      }
    } catch (error) {
      console.error('Error al cargar los tours:', error);
      message.error(error.message || 'Error al cargar los tours');
      setTours([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchTours({ pagination });
  }, []);

  // Manejar cambio de página o tamaño de página
  const handleTableChange = (newPagination, filters, sorter) => {
    const newFilters = { ...filters };
    
    // Actualizar ordenamiento
    if (sorter.field) {
      newFilters.sortField = sorter.field;
      newFilters.sortOrder = sorter.order;
    }
    
    setFilters(newFilters);
    fetchTours({
      pagination: { ...pagination, ...newPagination },
      ...newFilters,
    });
  };

  // Manejar búsqueda
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  // Manejar reinicio de búsqueda
  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText('');
  };

  // Configuración de búsqueda para las columnas
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Buscar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Buscar
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Limpiar
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  });

  // Manejar eliminación de un tour
  const handleDelete = async (id) => {
    try {
      await tourService.eliminarTour(id);
      message.success('Tour eliminado exitosamente');
      fetchTours({ pagination }); // Recargar la lista
    } catch (error) {
      console.error('Error al eliminar el tour:', error);
      message.error(error.response?.data?.message || 'Error al eliminar el tour');
    }
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTours({ 
      pagination: { ...pagination, current: 1 },
      ...newFilters
    });
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    const newFilters = {
      search: '',
      estado: '',
      sortField: 'fechaInicio',
      sortOrder: 'ascend'
    };
    setFilters(newFilters);
    setSearchText('');
    setSearchedColumn('');
    fetchTours({ 
      pagination: { ...pagination, current: 1 },
      ...newFilters
    });
  };

  // Definir columnas de la tabla
  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      width: '25%',
      sorter: true,
      ...getColumnSearchProps('nombre', 'nombre'),
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.destino}</div>
        </div>
      ),
    },
    {
      title: 'Fechas',
      dataIndex: 'fechaInicio',
      key: 'fechas',
      width: '15%',
      sorter: true,
      render: (_, record) => (
        <div>
          <div>{dayjs(record.fechaInicio).format('DD/MM/YYYY')}</div>
          <div className="text-xs text-gray-400">al {dayjs(record.fechaFin).format('DD/MM/YYYY')}</div>
        </div>
      ),
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      width: '10%',
      sorter: true,
      render: (precio) => `$${precio.toLocaleString()}`,
    },
    {
      title: 'Disponibilidad',
      dataIndex: 'cuposDisponibles',
      key: 'disponibilidad',
      width: '15%',
      sorter: true,
      render: (_, record) => (
        <div>
          <div>
            <Badge 
              status={record.cuposDisponibles > 0 ? 'success' : 'error'} 
              text={`${record.cuposDisponibles} / ${record.cupoMaximo} cupos`} 
            />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ 
                width: `${(record.cuposDisponibles / record.cupoMaximo) * 100}%`,
                backgroundColor: record.cuposDisponibles > 0 ? '#2563eb' : '#ef4444'
              }}
            ></div>
          </div>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      width: '10%',
      filters: [
        { text: 'Disponible', value: 'disponible' },
        { text: 'Completo', value: 'completo' },
        { text: 'Cancelado', value: 'cancelado' },
        { text: 'Finalizado', value: 'finalizado' },
      ],
      filteredValue: filters.estado ? [filters.estado] : null,
      onFilter: (value, record) => record.estado === value,
      render: (estado) => {
        const estadoConfig = {
          disponible: { color: 'green', text: 'Disponible' },
          completo: { color: 'red', text: 'Completo' },
          cancelado: { color: 'gray', text: 'Cancelado' },
          finalizado: { color: 'blue', text: 'Finalizado' },
        };
        const config = estadoConfig[estado] || { color: 'default', text: estado };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: '15%',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Ver detalles">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/admin/tours/ver/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/admin/tours/editar/${record.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title="¿Está seguro de eliminar este tour?"
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
    <div className="tours-container">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Tours</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => navigate('/admin/tours/nuevo')}
        >
          Nuevo Tour
        </Button>
      </div>

      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12} lg={8}>
            <Search
              placeholder="Buscar por nombre, destino o descripción"
              allowClear
              enterButton={
                <div className="flex items-center">
                  <SearchOutlined />
                  <span className="ml-1">Buscar</span>
                </div>
              }
              size="large"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onSearch={(value) => handleFilterChange('search', value)}
            />
          </Col>
          
          <Col xs={24} md={12} lg={6}>
            <Select
              placeholder="Filtrar por estado"
              style={{ width: '100%' }}
              allowClear
              size="large"
              value={filters.estado || undefined}
              onChange={(value) => handleFilterChange('estado', value)}
            >
              <Option value="disponible">Disponible</Option>
              <Option value="completo">Completo</Option>
              <Option value="cancelado">Cancelado</Option>
              <Option value="finalizado">Finalizado</Option>
            </Select>
          </Col>
          
          <Col xs={24} md={12} lg={6} className="flex justify-end">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={clearFilters}
              className="w-full md:w-auto"
            >
              Limpiar Filtros
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          rowKey="id"
          dataSource={tours}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} tours`,
            pageSizeOptions: ['10', '20', '50', '100'],
            showQuickJumper: true,
            size: 'default',
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  filters.search || filters.estado
                    ? 'No se encontraron tours que coincidan con los filtros aplicados'
                    : 'No hay tours registrados'
                }
              >
                {!filters.search && !filters.estado && (
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => navigate('/admin/tours/nuevo')}
                  >
                    Crear primer tour
                  </Button>
                )}
              </Empty>
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default Tours;
