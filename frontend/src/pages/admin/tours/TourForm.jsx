import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  DatePicker, 
  Select, 
  Button, 
  Row, 
  Col, 
  Card, 
  Upload, 
  message, 
  Spin,
  Switch
} from 'antd';
import { 
  SaveOutlined, 
  UploadOutlined, 
  ArrowLeftOutlined 
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { tourService } from '../../../config/api';

const { TextArea } = Input;
const { Option } = Select;

const TourForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Estados para manejar la carga de datos
  const [loadingData, setLoadingData] = useState(false);

  // Cargar datos del tour si estamos editando
  useEffect(() => {
    if (id) {
      console.log('ID del tour a editar:', id);
      setIsEditing(true);
      cargarTour();
    } else {
      // Si no hay ID, es un nuevo tour
      form.resetFields();
      setFileList([]);
    }
  }, [id]);

  const cargarTour = async () => {
    if (!id) {
      console.log('[TourForm] 🆕 No hay ID, es un nuevo tour');
      form.resetFields();
      setFileList([]);
      return;
    }

    try {
      console.log(`[TourForm] 🔄 Iniciando carga del tour con ID: ${id}`);
      setLoadingData(true);
      
      // Limpiar el formulario
      form.resetFields();
      setFileList([]);
      
      console.log(`[TourForm] 📡 Solicitando datos del tour ${id}...`);
      const response = await tourService.obtenerTourPorId(id);
      
      if (!response || !response.tour) {
        throw new Error('No se recibieron datos del tour');
      }
      
      const tour = response.tour;
      console.log('[TourForm] 📥 Datos recibidos del servidor:', JSON.stringify(tour, null, 2));
      
      // Crear objeto con los valores para el formulario
      const valoresFormulario = {
        nombre: tour.nombre || '',
        descripcion: tour.descripcion || '',
        destino: tour.destino || '',
        fechaInicio: tour.fechaInicio ? dayjs(tour.fechaInicio) : null,
        fechaFin: tour.fechaFin ? dayjs(tour.fechaFin) : null,
        precio: tour.precio || 0,
        cupoMaximo: tour.cupoMaximo || 1,
        estado: tour.estado || 'disponible',
        activo: tour.activo !== undefined ? tour.activo : true,
        imagenUrl: tour.imagenUrl || ''
      };
      
      console.log('[TourForm] 📝 Valores preparados para el formulario:', valoresFormulario);
      
      // Establecer los valores en el formulario
      console.log('[TourForm] ⏳ Estableciendo valores en el formulario...');
      
      try {
        // Primero, establecer los valores por defecto
        form.setFieldsValue({
          estado: 'disponible',
          activo: true,
          ...valoresFormulario
        });
        
        console.log('[TourForm] ✅ Valores establecidos en el formulario');
        
        // Configurar la imagen si existe
        if (valoresFormulario.imagenUrl) {
          console.log(`[TourForm] 🖼️ Configurando imagen del tour: ${valoresFormulario.imagenUrl}`);
          setFileList([{
            uid: '-1',
            name: 'imagen-tour',
            status: 'done',
            url: valoresFormulario.imagenUrl,
          }]);
        } else {
          console.log('[TourForm] 🖼️ No hay imagen para este tour');
          setFileList([]);
        }
        
        console.log('[TourForm] ✅ Formulario cargado correctamente');
        
      } catch (formError) {
        console.error('[TourForm] ❌ Error al establecer valores en el formulario:', formError);
        message.error('Error al cargar los datos del formulario');
      }
      
    } catch (error) {
      console.error('[TourForm] ❌ Error al cargar el tour:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido al cargar el tour';
      message.error(`Error al cargar el tour: ${errorMessage}`);
    } finally {
      setLoadingData(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      // Preparar los datos del tour con valores por defecto
      const tourData = {
        nombre: values.nombre || '',
        descripcion: values.descripcion || '',
        destino: values.destino || '',
        fechaInicio: values.fechaInicio ? values.fechaInicio.toISOString() : null,
        fechaFin: values.fechaFin ? values.fechaFin.toISOString() : null,
        precio: parseFloat(values.precio) || 0,
        cupoMaximo: parseInt(values.cupoMaximo, 10) || 1,
        estado: values.estado || 'disponible',
        activo: values.activo !== undefined ? values.activo : true,
        imagenUrl: values.imagenUrl || '',
        // Si es un nuevo tour, establecer cuposDisponibles igual a cupoMaximo
        ...(!isEditing && { 
          cuposDisponibles: parseInt(values.cupoMaximo, 10) || 1
        })
      };

      console.log('Datos a enviar al servidor:', tourData);

      if (isEditing) {
        await tourService.actualizarTour(id, tourData);
        message.success('Tour actualizado exitosamente');
      } else {
        await tourService.crearTour(tourData);
        message.success('Tour creado exitosamente');
      }

      // Redirigir a la lista de tours después de guardar
      navigate('/admin/tours');
    } catch (error) {
      console.error('Error al guardar el tour:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Error al guardar el tour';
      message.error(errorMessage);
      
      // Mostrar errores de validación si existen
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const formErrors = {};
        
        validationErrors.forEach(err => {
          const fieldName = err.path;
          formErrors[fieldName] = { 
            errors: [new Error(err.msg)] 
          };
        });
        
        form.setFields(formErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  // Configuración para el componente Upload
  const uploadProps = {
    onRemove: () => {
      setFileList([]);
      form.setFieldsValue({ imagenUrl: '' });
      return false;
    },
    beforeUpload: (file) => {
      // Validar el tipo de archivo
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Solo se pueden subir archivos de imagen!');
        return Upload.LIST_IGNORE;
      }
      
      // Validar tamaño de archivo (máximo 2MB)
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('La imagen debe ser menor a 2MB!');
        return Upload.LIST_IGNORE;
      }
      
      // Leer el archivo como URL de datos
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setFileList([{
          uid: '-1',
          name: file.name,
          status: 'done',
          url: reader.result,
        }]);
        
        // Guardar la URL de la imagen en el formulario
        form.setFieldsValue({ imagenUrl: reader.result });
      };
      
      return false; // Evitar la carga automática
    },
    fileList,
  };

  if (loadingData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Cargando datos del tour..." />
      </div>
    );
  }

  return (
    <Card 
      title={isEditing ? `Editar Tour ${id ? `#${id}` : ''}` : 'Nuevo Tour'}
      extra={
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
      }
    >
      <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            estado: 'disponible',
            activo: true
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="nombre"
                label="Nombre del Tour"
                rules={[
                  { required: true, message: 'Por favor ingrese el nombre del tour' },
                  { min: 3, message: 'El nombre debe tener al menos 3 caracteres' },
                  { max: 100, message: 'El nombre no puede tener más de 100 caracteres' }
                ]}
              >
                <Input placeholder="Ej: Aventura en la montaña" />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="destino"
                label="Destino"
                rules={[
                  { required: true, message: 'Por favor ingrese el destino' },
                  { min: 3, message: 'El destino debe tener al menos 3 caracteres' }
                ]}
              >
                <Input placeholder="Ej: Bariloche, Patagonia" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="fechaInicio"
                label="Fecha de Inicio"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  disabledDate={(current) => {
                    // Deshabilitar fechas anteriores a hoy
                    return current && current < dayjs().startOf('day');
                  }}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item
                name="fechaFin"
                label="Fecha de Fin"
                dependencies={['fechaInicio']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const fechaInicio = getFieldValue('fechaInicio');
                      if (value && fechaInicio && !dayjs(value).isAfter(dayjs(fechaInicio))) {
                        return Promise.reject(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  disabledDate={(current) => {
                    // Deshabilitar fechas anteriores a la fecha de inicio
                    const fechaInicio = form.getFieldValue('fechaInicio');
                    return current && current < dayjs(fechaInicio).startOf('day');
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="precio"
                label="Precio"
                initialValue={0}
                rules={[
                  { type: 'number', min: 0, message: 'El precio debe ser mayor o igual a 0' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  min={0}
                  step={0.01}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item
                name="cupoMaximo"
                label="Cupo Máximo"
                initialValue={10}
                rules={[
                  { type: 'number', min: 1, message: 'El cupo debe ser mayor a 0' }
                ]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={1}
                  disabled={isEditing}
                />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={8}>
              <Form.Item
                name="estado"
                label="Estado"
                rules={[{ required: true, message: 'Por favor seleccione el estado' }]}
              >
                <Select>
                  <Option value="disponible">Disponible</Option>
                  <Option value="completo">Completo</Option>
                  <Option value="cancelado">Cancelado</Option>
                  <Option value="finalizado">Finalizado</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[
              { max: 2000, message: 'La descripción no puede tener más de 2000 caracteres' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="Describa el tour en detalle, incluyendo itinerario, actividades, alojamiento, comidas incluidas, etc." 
            />
          </Form.Item>

          <Form.Item
            name="imagenUrl"
            label="Imagen del Tour"
          >
            <Upload
              {...uploadProps}
              listType="picture-card"
              maxCount={1}
              accept="image/*"
            >
              {fileList.length >= 1 ? null : (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Subir imagen</div>
                </div>
              )}
            </Upload>
          </Form.Item>
          
          <Form.Item
            name="activo"
            label="Activo"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Sí" 
              unCheckedChildren="No" 
              defaultChecked 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />} 
              loading={loading}
            >
              {isEditing ? 'Actualizar Tour' : 'Crear Tour'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
  );
};

export default TourForm;
