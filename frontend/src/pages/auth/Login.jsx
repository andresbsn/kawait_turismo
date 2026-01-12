import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Checkbox, Card, Typography, message, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../../config/api';
import { setupInterceptors } from '../../config/interceptors';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errors, setErrors] = useState({});
  const [isClienteLogin, setIsClienteLogin] = useState(false);
  
  // Configurar interceptores al montar el componente
  useEffect(() => {
    setupInterceptors();
    checkAuth();
  }, []);
  
  // Verificar si el usuario ya está autenticado
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Verificar si el token es válido
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user && user.role) {
          // Redirigir según el rol
          const rolePath = {
            'ADMIN': '/admin/dashboard',
            'GUIA': '/guide/dashboard',
            'USER': '/user/cuenta-corriente'
          };
          
          navigate(rolePath[user.role] || '/', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
      }
    }
    
    setIsCheckingAuth(false);
  };

  const onFinish = async (values) => {
    console.log('Valores del formulario:', values);
    setIsLoading(true);
    setErrors({});

    try {
      // Validar el formulario
      await form.validateFields();

      // Llamar al servicio de autenticación
      const rememberMe = values.remember || false;
      const response = isClienteLogin
        ? await authService.loginCliente(values.username, values.password)
        : await authService.login(values.username, values.password, rememberMe);

      console.log('Respuesta del servidor:', response);

      // Guardar token y datos del usuario
      if (response.token) {
        localStorage.setItem('token', response.token);
        
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Redirigir según el rol
          const rolePath = {
            'ADMIN': '/admin/dashboard',
            'GUIA': '/guide/dashboard',
            'USER': '/user/cuenta-corriente'
          };
          
          const targetPath = rolePath[response.user.role] || '/';
          console.log(`Redirigiendo a: ${targetPath}`);
          
          // Redirigir a la ruta solicitada o al dashboard por defecto
          const from = location.state?.from || targetPath;
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      
      // Mostrar mensaje de error específico si está disponible
      const status = error?.status;
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        'Error al iniciar sesión. Verifica tus credenciales e intenta nuevamente.';

      if (status === 401) {
        const msg = isClienteLogin
          ? 'Email o DNI incorrectos. Verificá los datos e intentá nuevamente.'
          : 'Usuario o contraseña incorrectos. Verificá los datos e intentá nuevamente.';
        setErrors({ form: msg });
        message.error(msg);

        // Limpiar password/DNI para reintento
        form.setFieldsValue({ password: '' });
      } else {
        setErrors({ form: errorMessage });
        message.error(errorMessage);
      }
      
      // Limpiar credenciales inválidas
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar spinner mientras se verifica la autenticación
  if (isCheckingAuth) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="Verificando sesión..." />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-lg border border-accent-100">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center text-white shadow-md">
              <UserOutlined className="text-3xl" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Iniciar sesión
          </h2>
        </div>
        
        {errors.form && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errors.form}</p>
              </div>
            </div>
          </div>
        )}
        
        <Form
          form={form}
          className="mt-8 space-y-6"
          onFinish={onFinish}
        >
          <div className="rounded-md shadow-sm space-y-4">
            <Form.Item
              name="username"
              rules={[{
                required: true,
                message: isClienteLogin ? 'Por favor ingresa tu email' : 'Por favor ingresa tu nombre de usuario',
              }]}
              className="mb-4"
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400" />} 
                placeholder={isClienteLogin ? 'Email' : 'Nombre de usuario'} 
                size="large"
                className="rounded-xl border-gray-300 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200"
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[{
                required: true,
                message: isClienteLogin ? 'Por favor ingresa tu DNI' : 'Por favor ingresa tu contraseña',
              }]}
              className="mb-1"
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400" />} 
                placeholder={isClienteLogin ? 'DNI' : 'Contraseña'} 
                size="large"
                className="rounded-xl border-gray-300 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200"
              />
            </Form.Item>
          </div>

          <div className="flex items-center justify-between mb-6">
            <Checkbox
              checked={isClienteLogin}
              onChange={(e) => setIsClienteLogin(e.target.checked)}
              className="text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              Soy cliente
            </Checkbox>

            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox className="text-gray-600 hover:text-primary-600 transition-colors duration-200" disabled={isClienteLogin}>
                Recordarme
              </Checkbox>
            </Form.Item>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200 hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>

          <div>
            <Button 
              type="primary" 
              htmlType="submit"
              className="w-full flex justify-center items-center h-12 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-medium rounded-xl text-base shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
              loading={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
