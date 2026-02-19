import React, { useState } from 'react';
import { 
  Card, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Select, 
  message, 
  Upload, 
  Avatar,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  GlobalOutlined,
  UploadOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const Ajustes = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('perfil');
  const [avatarUrl, setAvatarUrl] = useState('https://randomuser.me/api/portraits/men/1.jpg');

  const onFinish = (values) => {
    console.log('Valores del formulario:', values);
    setLoading(true);
    
    // Simular una petición a la API
    setTimeout(() => {
      message.success('Configuración guardada exitosamente');
      setLoading(false);
    }, 1500);
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('¡Solo puedes subir archivos JPG/PNG!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('La imagen debe ser menor a 2MB!');
    }
    return isJpgOrPng && isLt2M;
  };

  const handleChange = (info) => {
    if (info.file.status === 'done') {
      // Aquí iría la lógica para subir la imagen al servidor
      // Por ahora, simulamos una URL de imagen
      setAvatarUrl(URL.createObjectURL(info.file.originFileObj));
      message.success('¡Imagen subida exitosamente!');
    }
  };

  const notificationSettings = [
    { name: 'email_notifications', label: 'Notificaciones por correo', default: true },
    { name: 'push_notifications', label: 'Notificaciones push', default: true },
    { name: 'reservation_updates', label: 'Actualizaciones de reservas', default: true },
    { name: 'promotions', label: 'Ofertas y promociones', default: true },
    { name: 'newsletter', label: 'Boletín informativo', default: false },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Configuración</h2>
      
      <Tabs 
        defaultActiveKey={activeTab} 
        onChange={setActiveTab}
        tabPosition="left"
        style={{ background: '#fff', padding: '0 24px' }}
      >
        <TabPane tab={
          <span><UserOutlined /> Perfil</span>
        } key="perfil">
          <Card title="Información del perfil" style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                customRequest={({ onSuccess }) => onSuccess('ok')}
              >
                <div>
                  <Avatar 
                    size={100} 
                    src={avatarUrl} 
                    icon={<UserOutlined />} 
                  />
                  <div style={{ marginTop: 8 }}>Cambiar foto</div>
                </div>
              </Upload>
            </div>
            
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                nombre: 'Admin',
                apellido: 'Principal',
                email: 'admin@kawai.com',
                telefono: '+1234567890',
                biografia: 'Administrador principal del sistema',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  label="Nombre"
                  name="nombre"
                  rules={[{ required: true, message: 'Por favor ingresa tu nombre' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Nombre" />
                </Form.Item>
                
                <Form.Item
                  label="Apellido"
                  name="apellido"
                  rules={[{ required: true, message: 'Por favor ingresa tu apellido' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Apellido" />
                </Form.Item>
              </div>
              
              <Form.Item
                label="Correo electrónico"
                name="email"
                rules={[
                  { required: true, message: 'Por favor ingresa tu correo electrónico' },
                  { type: 'email', message: 'Por favor ingresa un correo electrónico válido' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Correo electrónico" />
              </Form.Item>
              
              <Form.Item
                label="Teléfono"
                name="telefono"
                rules={[{ required: false }]}
              >
                <Input placeholder="Teléfono" />
              </Form.Item>
              
              <Form.Item
                label="Biografía"
                name="biografia"
                rules={[{ required: false }]}
              >
                <TextArea rows={4} placeholder="Cuéntanos sobre ti..." />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Guardar cambios
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab={
          <span><LockOutlined /> Seguridad</span>
        } key="seguridad">
          <Card title="Cambiar contraseña" style={{ marginBottom: 24 }}>
            <Form
              layout="vertical"
              onFinish={onFinish}
            >
              <Form.Item
                label="Contraseña actual"
                name="currentPassword"
                rules={[{ required: true, message: 'Por favor ingresa tu contraseña actual' }]}
              >
                <Input.Password placeholder="Contraseña actual" />
              </Form.Item>
              
              <Form.Item
                label="Nueva contraseña"
                name="newPassword"
                rules={[{ required: true, message: 'Por favor ingresa una nueva contraseña' }]}
              >
                <Input.Password placeholder="Nueva contraseña" />
              </Form.Item>
              
              <Form.Item
                label="Confirmar nueva contraseña"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Por favor confirma tu nueva contraseña' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Las contraseñas no coinciden'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirmar nueva contraseña" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Cambiar contraseña
                </Button>
              </Form.Item>
            </Form>
          </Card>
          
          <Card title="Autenticación de dos factores" style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <h4>Autenticación de dos factores (2FA)</h4>
              <p>Agrega una capa adicional de seguridad a tu cuenta.</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <div>
                  <h4>Estado: <Tag color="green">Desactivado</Tag></h4>
                  <p>La autenticación de dos factores no está activada actualmente.</p>
                </div>
                <Button type="primary">Activar 2FA</Button>
              </div>
            </div>
          </Card>
        </TabPane>
        
        <TabPane tab={
          <span><GlobalOutlined /> Preferencias</span>
        } key="preferencias">
          <Card title="Configuración regional" style={{ marginBottom: 24 }}>
            <Form
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                timezone: 'America/Santiago',
                dateFormat: 'DD/MM/YYYY',
                timeFormat: '24h',
                language: 'es',
                currency: 'CLP',
              }}
            >
              <Form.Item
                label="Zona horaria"
                name="timezone"
                rules={[{ required: true }]}
              >
                <Select style={{ width: '100%' }}>
                  <Option value="America/Santiago">(GMT-04:00) Santiago</Option>
                  <Option value="America/New_York">(GMT-05:00) Nueva York</Option>
                  <Option value="Europe/Madrid">(GMT+01:00) Madrid</Option>
                  <Option value="UTC">UTC</Option>
                </Select>
              </Form.Item>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  label="Formato de fecha"
                  name="dateFormat"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="DD/MM/YYYY">DD/MM/AAAA</Option>
                    <Option value="MM/DD/YYYY">MM/DD/AAAA</Option>
                    <Option value="YYYY-MM-DD">AAAA-MM-DD</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  label="Formato de hora"
                  name="timeFormat"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="24h">24 horas</Option>
                    <Option value="12h">12 horas (AM/PM)</Option>
                  </Select>
                </Form.Item>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item
                  label="Idioma"
                  name="language"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="es">Español</Option>
                    <Option value="en">English</Option>
                    <Option value="pt">Português</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  label="Moneda"
                  name="currency"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="CLP">Peso Chileno (CLP)</Option>
                    <Option value="USD">Dólar Estadounidense (USD)</Option>
                    <Option value="EUR">Euro (EUR)</Option>
                    <Option value="BRL">Real Brasileño (BRL)</Option>
                  </Select>
                </Form.Item>
              </div>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Guardar preferencias
                </Button>
              </Form.Item>
            </Form>
          </Card>
          
          <Card title="Notificaciones">
            <Form
              layout="vertical"
              onFinish={onFinish}
              initialValues={notificationSettings.reduce((acc, item) => {
                acc[item.name] = item.default;
                return acc;
              }, {})}
            >
              {notificationSettings.map((setting) => (
                <Form.Item
                  key={setting.name}
                  name={setting.name}
                  label={setting.label}
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren={<CheckOutlined />} 
                    unCheckedChildren={<CloseOutlined />} 
                  />
                </Form.Item>
              ))}
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Guardar configuración de notificaciones
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Ajustes;
