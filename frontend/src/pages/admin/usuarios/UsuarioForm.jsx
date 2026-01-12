import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, Modal, message, Switch } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

const { Option } = Select;

const UsuarioForm = ({ visible, onCancel, onSave, usuario }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      // Convertir los datos del usuario al formato del formulario
      const datosFormulario = {
        username: usuario.username || '',
        email: usuario.email || '',
        role: usuario.role || 'USER',
        active: usuario.active !== undefined ? usuario.active : true
      };
      
      // Solo actualizar si hay cambios para evitar bucles de renderizado
      const currentValues = form.getFieldsValue(true);
      const hasChanges = Object.keys(datosFormulario).some(
        key => currentValues[key] !== datosFormulario[key]
      );
      
      if (hasChanges) {
        form.setFieldsValue(datosFormulario);
      }
    } else {
      // Resetear a valores por defecto para nuevo usuario
      form.resetFields();
      form.setFieldsValue({
        active: true,
        role: 'USER'
      });
    }
  }, [usuario, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      try {
        await onSave(values);
        message.success(usuario ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
      } catch (error) {
        // El mensaje de error ya se maneja en el componente padre
        throw error;
      }
    } catch (error) {
      console.error('Error al guardar el usuario:', error);
      message.error('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancelar
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
        >
          {usuario ? 'Actualizar' : 'Crear'}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          estado: 'activo',
          rol: 'USER'
        }}
      >
        <Form.Item
          name="username"
          label="Nombre de Usuario"
          rules={[{ required: true, message: 'Por favor ingrese el nombre de usuario' }]}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="Nombre de usuario" 
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Correo Electrónico"
          rules={[
            { required: true, message: 'Por favor ingrese el correo' },
            { type: 'email', message: 'Ingrese un correo válido' }
          ]}
        >
          <Input 
            prefix={<MailOutlined />} 
            placeholder="correo@ejemplo.com" 
            type="email"
          />
        </Form.Item>

        {!usuario && (
          <Form.Item
            name="password"
            label="Contraseña"
            rules={[
              { required: true, message: 'Por favor ingrese una contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Contraseña"
            />
          </Form.Item>
        )}
        
        <Form.Item
          name="role"
          label="Rol"
          rules={[{ required: true, message: 'Por favor seleccione un rol' }]}
        >
          <Select placeholder="Seleccione un rol">
            <Option value="ADMIN">Administrador</Option>
            <Option value="USER">Usuario</Option>
            <Option value="GUIDE">Guía</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="active"
          label="Estado"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="Activo" 
            unCheckedChildren="Inactivo"
            defaultChecked
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UsuarioForm;
