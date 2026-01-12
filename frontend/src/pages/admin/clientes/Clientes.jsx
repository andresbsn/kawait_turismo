import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Typography, 
  Input, 
  Row, 
  Col,
  Tag,
  message,
  Popconfirm,
  Spin
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  UserOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import clienteService from '../../../services/clienteService';
import ClienteForm from './ClienteForm';

const { Title } = Typography;
const { Search } = Input;

const Clientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [clienteActual, setClienteActual] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const cargarClientes = async (params = {}) => {
    try {
      setLoading(true);
      
      const { current, pageSize } = pagination;
      const queryParams = {
        page: params.pagination?.current || current,
        limit: params.pagination?.pageSize || pageSize,
        search: searchText,
        ...params
      };

      const response = await clienteService.obtenerClientes(queryParams);
      
      setClientes(Array.isArray(response) ? response : []);
      
      if (response.pagination) {
        setPagination({
          ...pagination,
          total: response.pagination.total || 0,
          current: response.pagination.page || 1,
          pageSize: response.pagination.pageSize || 10,
        });
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      message.error('Error al cargar la lista de clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, [searchText]);

  const handleTableChange = (pagination, filters, sorter) => {
    cargarClientes({
      sortField: sorter.field,
      sortOrder: sorter.order,
      pagination,
      ...filters,
    });
  };

  const handleEliminarCliente = async (id) => {
    try {
      await clienteService.eliminarCliente(id);
      message.success('Cliente eliminado correctamente');
      cargarClientes();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      message.error('No se pudo eliminar el cliente. Intente nuevamente.');
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (_, record) => (
        <div>
          <div><strong>{record.nombre} {record.apellido}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>DNI: {record.dni}</div>
        </div>
      ),
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: 'Contacto',
      dataIndex: 'email',
      key: 'contacto',
      render: (_, record) => (
        <div>
          <div>{record.email}</div>
          {record.telefono && (
            <div style={{ fontSize: '12px', color: '#666' }}>Tel: {record.telefono}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Dirección',
      dataIndex: 'direccion',
      key: 'direccion',
      render: (direccion) => direccion || 'No especificada',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 190,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<DollarOutlined />}
            onClick={() => navigate(`/admin/cuentas-corrientes?cliente_id=${record.id}`)}
            title="Cuenta Corriente"
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => {
              setClienteActual(record);
              setModalVisible(true);
            }}
            title="Editar"
          />
          <Popconfirm
            title="¿Está seguro de eliminar este cliente?"
            onConfirm={() => handleEliminarCliente(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            placement="left"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              title="Eliminar"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleFormSuccess = () => {
    setModalVisible(false);
    setClienteActual(null);
    cargarClientes();
  };

  return (
    <div className="clientes-container">
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <UserOutlined style={{ marginRight: 8 }} />
              <span>Gestión de Clientes</span>
            </div>
            <div>
              <Search
                placeholder="Buscar clientes..."
                allowClear
                enterButton={
                  <Button type="primary">
                    <SearchOutlined />
                  </Button>
                }
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250, marginRight: 16 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setClienteActual(null);
                  setModalVisible(true);
                }}
              >
                Nuevo Cliente
              </Button>
            </div>
          </div>
        }
        bordered={false}
        className="custom-card"
      >
        <Table
          columns={columns}
          dataSource={clientes}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <UserOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 16 }} />
                <div style={{ color: '#bfbfbf' }}>No hay clientes registrados</div>
              </div>
            ),
          }}
        />
      </Card>

      <Modal
        title={clienteActual ? 'Editar Cliente' : 'Nuevo Cliente'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setClienteActual(null);
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <ClienteForm
          initialValues={clienteActual}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setModalVisible(false);
            setClienteActual(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default Clientes;
