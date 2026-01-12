import React, { useState } from 'react';
import { Card, Table, Tag, Space, Button, Input, Select, DatePicker } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EnvironmentOutlined, 
  DollarOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Tours = () => {
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos',
    fecha: null
  });

  // Datos de ejemplo
  const tours = [
    {
      id: 1,
      nombre: 'Tour por la Montaña Mágica',
      destino: 'Montaña Mágica',
      duracion: '2 días / 1 noche',
      precio: 125.00,
      cupos: 15,
      estado: 'activo',
      destacado: true
    },
    {
      id: 2,
      nombre: 'Aventura en el Bosque Encantado',
      destino: 'Bosque Encantado',
      duracion: '1 día',
      precio: 75.50,
      cupos: 20,
      estado: 'activo',
      destacado: false
    },
    // Agregar más tours según sea necesario
  ];

  const columns = [
    {
      title: 'Nombre del Tour',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong>{text}</strong>
          {record.destino && <span><EnvironmentOutlined /> {record.destino}</span>}
        </Space>
      ),
    },
    {
      title: 'Duración',
      dataIndex: 'duracion',
      key: 'duracion',
      render: (text) => (
        <span><ClockCircleOutlined /> {text}</span>
      ),
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      render: (precio) => (
        <span><DollarOutlined /> ${precio.toFixed(2)}</span>
      ),
    },
    {
      title: 'Cupos',
      dataIndex: 'cupos',
      key: 'cupos',
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado) => (
        <Tag color={estado === 'activo' ? 'green' : 'red'}>
          {estado.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<SearchOutlined />} />
          <Button type="link">Editar</Button>
          <Button type="link" danger>Eliminar</Button>
        </Space>
      ),
    },
  ];

  const handleBuscar = (value) => {
    setFiltros({ ...filtros, busqueda: value });
  };

  const handleEstadoChange = (value) => {
    setFiltros({ ...filtros, estado: value });
  };

  const handleFechaChange = (dates) => {
    setFiltros({ ...filtros, fecha: dates });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><EnvironmentOutlined /> Gestión de Tours</h2>
        <Button type="primary" icon={<PlusOutlined />}>
          Nuevo Tour
        </Button>
      </div>
      
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <Search
            placeholder="Buscar tours..."
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleBuscar}
            style={{ width: 300 }}
          />
          
          <Select
            defaultValue="todos"
            style={{ width: 150 }}
            onChange={handleEstadoChange}
          >
            <Option value="todos">Todos los estados</Option>
            <Option value="activo">Activos</Option>
            <Option value="inactivo">Inactivos</Option>
          </Select>
          
          <RangePicker 
            onChange={handleFechaChange} 
            style={{ width: 250 }}
            placeholder={['Fecha inicio', 'Fecha fin']}
          />
        </Space>
      </Card>
      
      <Card>
        <Table 
          columns={columns} 
          dataSource={tours} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Tours;
