import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Spin, Upload, Avatar } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, UploadOutlined } from '@ant-design/icons';
import authService from '../../../services/auth.service';

const UserProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        setAvatarUrl(userData.avatar || '');
        
        // Establecer valores iniciales del formulario
        form.setFieldsValue({
          nombre: userData.nombre || '',
          apellido: userData.apellido || '',
          email: userData.email || '',
          telefono: userData.telefono || '',
          username: userData.username || ''
        });
      } catch (error) {
        console.error('Error al cargar el perfil:', error);
        message.error('No se pudo cargar la información del perfil');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [form]);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      // Aquí iría la lógica para actualizar el perfil
      // await userService.updateProfile(user.id, values);
      message.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      message.error('Error al actualizar el perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = (info) => {
    if (info.file.status === 'done') {
      // Aquí iría la lógica para subir la imagen
      // y actualizar el avatar del usuario
      message.success('Imagen subida correctamente');
    } else if (info.file.status === 'error') {
      message.error('Error al subir la imagen');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mi Perfil</h1>
      
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="text-center">
            <Avatar 
              size={128} 
              src={avatarUrl} 
              icon={<UserOutlined />} 
              className="mb-4"
            />
            <Upload
              name="avatar"
              showUploadList={false}
              onChange={handleAvatarChange}
              beforeUpload={() => false}
            >
              <Button icon={<UploadOutlined />}>Cambiar foto</Button>
            </Upload>
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">
              {user.nombre} {user.apellido}
            </h2>
            <p className="text-gray-600 mb-4">
              {user.role === 'ADMIN' ? 'Administrador' : 
               user.role === 'GUIA' ? 'Guía Turístico' : 'Usuario'}
            </p>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="mt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  name="nombre"
                  label="Nombre"
                  rules={[
                    { required: true, message: 'Por favor ingresa tu nombre' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined className="text-gray-400" />} 
                    placeholder="Nombre" 
                  />
                </Form.Item>
                
                <Form.Item
                  name="apellido"
                  label="Apellido"
                  rules={[
                    { required: true, message: 'Por favor ingresa tu apellido' }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined className="text-gray-400" />} 
                    placeholder="Apellido" 
                  />
                </Form.Item>
                
                <Form.Item
                  name="email"
                  label="Correo electrónico"
                  rules={[
                    { 
                      required: true, 
                      message: 'Por favor ingresa tu correo electrónico' 
                    },
                    { 
                      type: 'email', 
                      message: 'Por favor ingresa un correo electrónico válido' 
                    }
                  ]}
                >
                  <Input 
                    prefix={<MailOutlined className="text-gray-400" />} 
                    placeholder="Correo electrónico" 
                    type="email"
                  />
                </Form.Item>
                
                <Form.Item
                  name="telefono"
                  label="Teléfono"
                >
                  <Input 
                    prefix={<PhoneOutlined className="text-gray-400" />} 
                    placeholder="Teléfono" 
                  />
                </Form.Item>
                
                <Form.Item
                  name="username"
                  label="Nombre de usuario"
                  rules={[
                    { 
                      required: true, 
                      message: 'Por favor ingresa un nombre de usuario' 
                    },
                    { 
                      min: 3, 
                      message: 'El nombre de usuario debe tener al menos 3 caracteres' 
                    }
                  ]}
                >
                  <Input 
                    prefix={<UserOutlined className="text-gray-400" />} 
                    placeholder="Nombre de usuario" 
                  />
                </Form.Item>
                
                <Form.Item
                  name="password"
                  label="Nueva contraseña"
                  help="Deja en blanco si no deseas cambiar la contraseña"
                >
                  <Input.Password 
                    prefix={<LockOutlined className="text-gray-400" />} 
                    placeholder="Nueva contraseña" 
                  />
                </Form.Item>
              </div>
              
              <Form.Item className="mt-6">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isSubmitting}
                >
                  Guardar cambios
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;
