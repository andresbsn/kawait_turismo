import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, message } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { usuarioService } from '../../../services/usuarioService';
import UsuarioForm from './UsuarioForm';

const { confirm } = Modal;

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const data = await usuarioService.obtenerUsuarios();
      console.log('Usuarios cargados:', data);
      // Asegurarse de que los datos son un array antes de establecer el estado
      if (Array.isArray(data)) {
        setUsuarios(data);
      } else {
        console.error('La respuesta no es un array:', data);
        setUsuarios([]);
        message.error('Error al cargar los usuarios: formato de datos incorrecto');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      message.error(error.message || 'Error al cargar los usuarios');
      setUsuarios([]);
    } finally {
      setCargando(false);
    }
  };

  const columns = [
    {
      title: 'Usuario',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        // Asegurarse de que role sea un string antes de usar toUpperCase
        const roleStr = role ? String(role).toUpperCase() : 'USER';
        return (
          <Tag color={roleStr === 'ADMIN' ? 'red' : roleStr === 'GUIDE' ? 'blue' : 'green'}>
            {roleStr}
          </Tag>
        );
      },
    },
    {
      title: 'Estado',
      dataIndex: 'active',
      key: 'active',
      render: (active) => {
        // Asegurarse de manejar valores undefined/null
        const isActive = active !== undefined ? active : true;
        const estado = isActive ? 'activo' : 'inactivo';
        return (
          <Tag color={isActive ? 'green' : 'red'}>
            {estado.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setUsuarioActual(record);
              setModalVisible(true);
            }}
          />
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => showDeleteConfirm(record.id)}
          />
        </Space>
      ),
    },
  ];

  const handleSave = async (values) => {
    try {
      setLoading(true);
      console.log('Guardando usuario. Usuario actual:', usuarioActual);
      console.log('Datos del formulario:', values);
      
      if (usuarioActual && (usuarioActual.id || usuarioActual._id)) {
        // Actualizar usuario existente
        const userId = usuarioActual.id || usuarioActual._id;
        console.log('Actualizando usuario con ID:', userId, 'Datos:', values);
        await usuarioService.actualizarUsuario(userId, values);
        message.success('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        console.log('Creando nuevo usuario con datos:', values);
        await usuarioService.crearUsuario(values);
        message.success('Usuario creado correctamente');
      }
      
      // Recargar la lista de usuarios
      await cargarUsuarios();
      setModalVisible(false);
      setUsuarioActual(null);
    } catch (error) {
      message.error(error.message || 'Ocurrió un error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await usuarioService.eliminarUsuario(id);
      message.success('Usuario eliminado correctamente');
      await cargarUsuarios();
    } catch (error) {
      message.error(error.message || 'Ocurrió un error al eliminar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirm = (id) => {
    confirm({
      title: '¿Estás seguro de eliminar este usuario?',
      icon: <ExclamationCircleOutlined />,
      content: 'Esta acción no se puede deshacer',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk: () => handleDelete(id),
    });
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2><UserOutlined /> Gestión de Usuarios</h2>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setUsuarioActual(null);
            setModalVisible(true);
          }}
        >
          Nuevo Usuario
        </Button>
      </div>
      
      <UsuarioForm
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setUsuarioActual(null);
        }}
        onSave={handleSave}
        usuario={usuarioActual}
      />
      <Card>
        <Table 
          columns={columns} 
          dataSource={usuarios} 
          rowKey="_id"
          loading={cargando}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} usuarios`,
            locale: {
              items_per_page: '/ página',
              jump_to: 'Ir a',
              page: '',
              prev_page: 'Página anterior',
              next_page: 'Página siguiente',
              prev_5: '5 páginas anteriores',
              next_5: '5 páginas siguientes',
              prev_3: '3 páginas anteriores',
              next_3: '3 páginas siguientes',
            }
          }}
        />
      </Card>
    </div>
  );
};

export default Usuarios;
