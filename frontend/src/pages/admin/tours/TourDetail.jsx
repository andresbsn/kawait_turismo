import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Tag, 
  Button, 
  Descriptions, 
  Divider, 
  Image, 
  Space, 
  Spin, 
  message,
  Badge,
  Tabs,
  Empty
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  InfoCircleOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import tourService from '../../../services/tourService';

const { TabPane } = Tabs;

const TourDetail = () => {
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  // Obtener los detalles del tour
  useEffect(() => {
    const cargarTour = async () => {
      try {
        setLoading(true);
        const data = await tourService.obtenerTourPorId(id);
        setTour(data);
      } catch (error) {
        console.error('Error al cargar el tour:', error);
        message.error('Error al cargar los detalles del tour');
      } finally {
        setLoading(false);
      }
    };

    cargarTour();
  }, [id]);

  // Función para formatear fechas
  const formatearFecha = (fecha) => {
    return dayjs(fecha).format('dddd, D [de] MMMM [de] YYYY');
  };

  // Función para formatear moneda
  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(monto);
  };

  // Estado del tour
  const getEstadoTag = (estado) => {
    const estados = {
      disponible: { color: 'green', text: 'Disponible' },
      completo: { color: 'red', text: 'Completo' },
      cancelado: { color: 'gray', text: 'Cancelado' },
      finalizado: { color: 'blue', text: 'Finalizado' },
    };
    const config = estados[estado] || { color: 'default', text: estado };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tour) {
    return (
      <Empty
        description="No se encontró el tour solicitado"
      >
        <Button type="primary" onClick={() => navigate('/admin/tours')}>
          Volver a la lista de tours
        </Button>
      </Empty>
    );
  }

  return (
    <div className="tour-detail">
      <Button 
        type="link" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/admin/tours')}
        style={{ marginBottom: 16 }}
      >
        Volver a la lista
      </Button>

      <Card
        title={
          <div className="flex justify-between items-center">
            <span>{tour.nombre}</span>
            <div>
              {getEstadoTag(tour.estado)}
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={() => navigate(`/admin/tours/editar/${tour.id}`)}
                className="ml-2"
              >
                Editar
              </Button>
            </div>
          </div>
        }
      >
        <Row gutter={[24, 24]}>
          {/* Columna izquierda - Imagen y descripción */}
          <Col xs={24} lg={16}>
            <div className="mb-6">
              {tour.imagenUrl ? (
                <Image
                  src={tour.imagenUrl}
                  alt={tour.nombre}
                  className="rounded-lg w-full h-96 object-cover"
                  placeholder={
                    <div className="bg-gray-100 h-96 flex items-center justify-center">
                      <PictureOutlined style={{ fontSize: 48, color: '#999' }} />
                    </div>
                  }
                />
              ) : (
                <div className="bg-gray-100 h-96 rounded-lg flex items-center justify-center">
                  <PictureOutlined style={{ fontSize: 48, color: '#999' }} />
                  <span className="ml-2 text-gray-500">Sin imagen</span>
                </div>
              )}
            </div>

            <Tabs defaultActiveKey="1">
              <TabPane tab={
                <span><InfoCircleOutlined /> Información</span>
              } key="1">
                <div className="prose max-w-none">
                  <h3>Descripción del Tour</h3>
                  <p className="text-gray-700 whitespace-pre-line">
                    {tour.descripcion || 'No hay descripción disponible.'}
                  </p>
                  
                  <h3 className="mt-6">Itinerario</h3>
                  <p className="text-gray-700">
                    {tour.itinerario || 'No hay información de itinerario disponible.'}
                  </p>
                </div>
              </TabPane>
              
              <TabPane tab={
                <span><CalendarOutlined /> Fechas</span>
              } key="2">
                <Descriptions bordered column={1}>
                  <Descriptions.Item label="Fecha de inicio">
                    {formatearFecha(tour.fechaInicio)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Fecha de finalización">
                    {formatearFecha(tour.fechaFin)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Duración">
                    {dayjs(tour.fechaFin).diff(dayjs(tour.fechaInicio), 'day') + 1} días
                  </Descriptions.Item>
                </Descriptions>
              </TabPane>
              
              <TabPane tab={
                <span><UserOutlined /> Participantes</span>
              } key="3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Cupos disponibles</span>
                      <span>{tour.cuposDisponibles} / {tour.cupoMaximo}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full" 
                        style={{ 
                          width: `${(tour.cuposDisponibles / tour.cupoMaximo) * 100}%`,
                          backgroundColor: tour.cuposDisponibles > 0 ? '#2563eb' : '#ef4444'
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <Divider>Reservas</Divider>
                  
                  <Empty 
                    description="No hay reservas para este tour"
                    image={Empty.PRESENT_IMAGE_SIMPLE}
                  />
                </div>
              </TabPane>
            </Tabs>
          </Col>

          {/* Columna derecha - Información del tour */}
          <Col xs={24} lg={8}>
            <Card 
              title="Detalles del Tour" 
              className="mb-6"
              bordered={false}
            >
              <Descriptions column={1}>
                <Descriptions.Item label="Destino">
                  <div className="flex items-center">
                    <EnvironmentOutlined className="mr-2" />
                    {tour.destino}
                  </div>
                </Descriptions.Item>
                
                <Descriptions.Item label="Precio por persona">
                  <div className="flex items-center">
                    <DollarOutlined className="mr-2" />
                    <span className="text-lg font-semibold">
                      {formatearMoneda(tour.precio)}
                    </span>
                  </div>
                </Descriptions.Item>
                
                <Descriptions.Item label="Estado">
                  {getEstadoTag(tour.estado)}
                </Descriptions.Item>
                
                <Descriptions.Item label="Disponibilidad">
                  <div className="flex items-center">
                    <UserOutlined className="mr-2" />
                    <span>
                      {tour.cuposDisponibles} de {tour.cupoMaximo} cupos disponibles
                    </span>
                  </div>
                </Descriptions.Item>
                
                <Descriptions.Item label="Creado">
                  {dayjs(tour.createdAt).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
                
                <Descriptions.Item label="Última actualización">
                  {dayjs(tour.updatedAt).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              </Descriptions>
              
              <Divider>Acciones</Divider>
              
              <Space direction="vertical" className="w-full">
                <Button 
                  type="primary" 
                  block
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/admin/tours/editar/${tour.id}`)}
                >
                  Editar Tour
                </Button>
                
                <Button 
                  type="default" 
                  block
                  icon={<CalendarOutlined />}
                  onClick={() => navigate(`/admin/reservas/nueva?tourId=${tour.id}`)}
                  disabled={tour.estado !== 'disponible'}
                >
                  Crear Reserva
                </Button>
                
                <Button 
                  type="dashed" 
                  danger 
                  block
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    // Aquí iría la lógica para eliminar el tour
                    message.warning('Función de eliminación no implementada');
                  }}
                >
                  Eliminar Tour
                </Button>
              </Space>
            </Card>
            
            <Card 
              title="Información Adicional" 
              className="mb-6"
              bordered={false}
            >
              <div className="prose">
                <h4>Incluye:</h4>
                <ul>
                  <li>Alojamiento en hoteles seleccionados</li>
                  <li>Desayuno diario</li>
                  <li>Traslados aeropuerto-hotel-aeropuerto</li>
                  <li>Guía bilingüe</li>
                  <li>Entradas a sitios turísticos</li>
                </ul>
                
                <h4>No incluye:</h4>
                <ul>
                  <li>Vuelos internacionales</li>
                  <li>Seguro de viaje</li>
                  <li>Comidas no mencionadas</li>
                  <li>Gastos personales</li>
                </ul>
                
                <h4>Requisitos:</h4>
                <ul>
                  <li>Pasaporte con validez mínima de 6 meses</li>
                  <li>Vacunas según normativa del destino</li>
                  <li>Seguro médico de viaje</li>
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default TourDetail;
