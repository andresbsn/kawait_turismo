import React, { useEffect } from 'react';
import { Form, Input, Button, DatePicker, message } from 'antd';
import clienteService from '../../../services/clienteService';
import dayjs from 'dayjs';

const { Item } = Form;
const { TextArea } = Input;

const ClienteForm = ({ initialValues, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    if (initialValues) {
      // Formatear la fecha de nacimiento para el DatePicker
      const values = {
        ...initialValues,
        fechaNacimiento: initialValues.fechaNacimiento ? dayjs(initialValues.fechaNacimiento) : null
      };
      form.setFieldsValue(values);
    }
  }, [initialValues, form]);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      // Formatear los datos antes de enviar
      const data = {
        ...values,
        fechaNacimiento: values.fechaNacimiento ? values.fechaNacimiento.format('YYYY-MM-DD') : null
      };

      if (initialValues?.id) {
        await clienteService.actualizarCliente(initialValues.id, data);
        message.success('Cliente actualizado correctamente');
      } else {
        await clienteService.crearCliente(data);
        message.success('Cliente creado correctamente');
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error al guardar el cliente:', error);
      const errorMessage = error.response?.data?.message || 'Error al guardar el cliente';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        dni: ''
      }}
    >
      <div style={{ display: 'flex', gap: '16px' }}>
        <Item
          name="nombre"
          label="Nombre"
          rules={[{ required: true, message: 'El nombre es requerido' }]}
          style={{ flex: 1 }}
        >
          <Input placeholder="Ingrese el nombre" />
        </Item>
        
        <Item
          name="apellido"
          label="Apellido"
          rules={[{ required: true, message: 'El apellido es requerido' }]}
          style={{ flex: 1 }}
        >
          <Input placeholder="Ingrese el apellido" />
        </Item>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'El email es requerido' },
            { type: 'email', message: 'Ingrese un email válido' }
          ]}
          style={{ flex: 1 }}
        >
          <Input type="email" placeholder="ejemplo@dominio.com" />
        </Item>

        <Item
          name="dni"
          label="DNI"
          rules={[
            { required: true, message: 'El DNI es requerido' },
            { pattern: /^\d{7,8}$/, message: 'Ingrese un DNI válido (7 u 8 dígitos)' }
          ]}
          style={{ flex: 1 }}
        >
          <Input placeholder="Ej: 12345678" />
        </Item>
      </div>

      <Item
        name="telefono"
        label="Teléfono"
        rules={[
          { pattern: /^[0-9+\-\s()]*$/, message: 'Ingrese un teléfono válido' }
        ]}
      >
        <Input placeholder="Ingrese el teléfono" />
      </Item>

      <Item
        name="direccion"
        label="Dirección"
      >
        <TextArea rows={2} placeholder="Ingrese la dirección" />
      </Item>

      <Item
        name="fechaNacimiento"
        label="Fecha de Nacimiento"
      >
        <DatePicker 
          style={{ width: '100%' }} 
          format="DD/MM/YYYY"
          placeholder="Seleccione la fecha de nacimiento"
        />
      </Item>

      <Item style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {initialValues?.id ? 'Actualizar' : 'Crear'} Cliente
          </Button>
        </div>
      </Item>
    </Form>
  );
};

export default ClienteForm;
