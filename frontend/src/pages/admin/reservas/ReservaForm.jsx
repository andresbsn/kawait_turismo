import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Select, DatePicker, InputNumber, Card, message, Spin, Row, Col, AutoComplete, Tabs } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingService, tourService, clienteService } from '../../../config/api';
import dayjs from 'dayjs';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import ReservaAdjuntos from './ReservaAdjuntos';

const { Option } = Select;
const TIPOS_REFERENCIA = ['terrestre', 'aereo', 'asistencia'];

const ReservaForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [tours, setTours] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [acompananteClientes, setAcompananteClientes] = useState({});
  const [acompananteBuscando, setAcompananteBuscando] = useState({});
  const [clienteBuscando, setClienteBuscando] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [tourSeleccionado, setTourSeleccionado] = useState(null);
  const [usaTourExistente, setUsaTourExistente] = useState(false);
  const esEdicion = Boolean(id);
  const acompananteTimeoutRef = useRef({});

  const cantidadPersonasWatch = Form.useWatch('cantidad_personas', form);
  const monedaPrecioWatch = Form.useWatch('moneda_precio_unitario', form);
  const acompanantesWatch = Form.useWatch('acompanantes', form) || [];
  const modalidadPagoWatch = Form.useWatch('modalidad_pago', form);

  const handleBuscarAcompanante = (index, busqueda) => {
    if (acompananteTimeoutRef.current[index]) {
      clearTimeout(acompananteTimeoutRef.current[index]);
    }

    if (!busqueda || busqueda.trim().length < 2) {
      setAcompananteClientes((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    setAcompananteBuscando((prev) => ({ ...prev, [index]: true }));
    acompananteTimeoutRef.current[index] = setTimeout(async () => {
      try {
        const resultados = await clienteService.buscarClientes(busqueda);
        setAcompananteClientes((prev) => ({
          ...prev,
          [index]: Array.isArray(resultados) ? resultados : (resultados?.clientes || [])
        }));
      } catch (e) {
        setAcompananteClientes((prev) => ({ ...prev, [index]: [] }));
      } finally {
        setAcompananteBuscando((prev) => ({ ...prev, [index]: false }));
      }
    }, 300);
  };

  const handleSeleccionarAcompanante = (index, option) => {
    const list = acompananteClientes[index] || [];
    const clienteId = option?.key;
    const cliente = list.find((c) => String(c.id) === String(clienteId));
    if (!cliente) {
      message.error('No se pudo cargar la información del acompañante');
      return;
    }

    const actuales = form.getFieldValue('acompanantes') || [];
    form.setFieldsValue({
      acompanantes: (Array.isArray(actuales) ? actuales : []).map((a, i) => {
        if (i !== index) return a;
        return {
          ...a,
          id: cliente.id,
          nombre: cliente.nombre || '',
          apellido: cliente.apellido || '',
          email: cliente.email || '',
          telefono: cliente.telefono || '',
          dni: cliente.dni || ''
        };
      })
    });
  };

  // Manejar selección de cliente
  const handleSeleccionarCliente = (value, option) => {
    console.log('Cliente seleccionado:', option);
    const clienteId = option.key;
    const cliente = clientes.find(c => c.id.toString() === clienteId.toString());
    
    if (cliente) {
      console.log('Datos del cliente encontrado:', cliente);
      
      setClienteSeleccionado({
        id: cliente.id,
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        email: cliente.email || '',
        telefono: cliente.telefono || ''
      });
      
      // Actualizar los valores del formulario
      form.setFieldsValue({
        cliente_id: cliente.id,
        nombre_cliente: cliente.nombre || '',
        apellido_cliente: cliente.apellido || '',
        dni_cliente: cliente.dni || '',
        email_cliente: cliente.email || '',
        telefono_cliente: cliente.telefono || ''
      });
      
      console.log('Valores del formulario actualizados:', {
        cliente_id: cliente.id,
        nombre_cliente: cliente.nombre || '',
        apellido_cliente: cliente.apellido || '',
        dni_cliente: cliente.dni || '',
        email_cliente: cliente.email,
        telefono_cliente: cliente.telefono
      });
    } else {
      console.error('Cliente no encontrado con ID:', clienteId);
      message.error('No se pudo cargar la información del cliente');
    }
  };

  // Limpiar selección de cliente
  const limpiarCliente = () => {
    setClienteSeleccionado(null);
    form.setFieldsValue({
      cliente_id: null,
      nombre_cliente: '',
      apellido_cliente: '',
      dni_cliente: '',
      email_cliente: '',
      telefono_cliente: ''
    });
    setClientes([]);
  };

  // Cargar lista de tours disponibles
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const [toursResponse] = await Promise.all([
          tourService.obtenerTours({ estado: 'disponible' })
        ]);

        if (toursResponse.success) {
          setTours(toursResponse.tours || []);
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        message.error('Error al cargar los datos iniciales');
      }
    };
    
    cargarDatosIniciales();
  }, []);

  // Si es edición, cargar los datos de la reserva
  useEffect(() => {
    const cargarReserva = async () => {
      if (!esEdicion) return;
      
      try {
        setLoading(true);
        const response = await bookingService.getBooking(id);
        if (response.success) {
          const reserva = response.data;
          const tieneTour = Boolean(reserva?.tour_id);
          setUsaTourExistente(tieneTour);

          // Buscar el tour correspondiente
          if (tieneTour) {
            const tour = tours.find(t => t.id === reserva.tour_id);
            if (tour) {
              setTourSeleccionado(tour);
            }
          } else {
            setTourSeleccionado(null);
          }

          // Titular: primer cliente asociado
          const clientesReserva = Array.isArray(reserva?.clientes) ? reserva.clientes : [];
          const titular = clientesReserva.find((c) => c?.reserva_clientes?.tipo_cliente === 'titular') || clientesReserva[0] || null;
          if (titular) {
            setClienteSeleccionado({
              id: titular.id,
              nombre: titular.nombre || '',
              apellido: titular.apellido || '',
              email: titular.email || '',
              telefono: titular.telefono || '',
            });
          }

          const acompanantes = clientesReserva
            .filter((c) => c && c.id !== titular?.id)
            .filter((c) => c?.reserva_clientes?.tipo_cliente === 'acompanante' || !c?.reserva_clientes?.tipo_cliente)
            .map((c) => ({
              id: c.id,
              nombre: c.nombre || '',
              apellido: c.apellido || '',
              email: c.email || '',
              telefono: c.telefono || '',
              dni: c.dni || ''
            }));

          const referenciasByTipo = Array.isArray(reserva?.referencias)
            ? reserva.referencias.reduce((acc, ref) => {
                if (!ref?.tipo) return acc;
                acc[ref.tipo] = {
                  referencia: ref.referencia || undefined,
                  titular: ref.titular || undefined,
                  proveedor: ref.proveedor || undefined,
                  descripcion: ref.descripcion || undefined,
                  fecha_vencimiento_hotel: ref.fecha_vencimiento_hotel ? dayjs(ref.fecha_vencimiento_hotel) : undefined,
                  requisitos_ingresos: ref.requisitos_ingresos || undefined,
                  condiciones_generales: ref.condiciones_generales || undefined,
                };
                return acc;
              }, {})
            : {};

          if (!referenciasByTipo.terrestre && (reserva.referencia || reserva.descripcion || reserva.fecha_vencimiento_hotel || reserva.requisitos_ingresos || reserva.condiciones_generales)) {
            referenciasByTipo.terrestre = {
              referencia: reserva.referencia || undefined,
              titular: reserva.titular || undefined,
              proveedor: reserva.proveedor || undefined,
              descripcion: reserva.descripcion || undefined,
              fecha_vencimiento_hotel: reserva.fecha_vencimiento_hotel ? dayjs(reserva.fecha_vencimiento_hotel) : undefined,
              requisitos_ingresos: reserva.requisitos_ingresos || undefined,
              condiciones_generales: reserva.condiciones_generales || undefined,
            };
          }

          // Establecer los valores del formulario
          form.setFieldsValue({
            tour_id: reserva.tour_id || undefined,
            fecha_reserva: reserva.fecha_reserva ? dayjs(reserva.fecha_reserva) : dayjs(),
            cantidad_personas: reserva.cantidad_personas || 1,
            precio_unitario: reserva.precio_unitario,
            moneda_precio_unitario: reserva.moneda_precio_unitario || 'ARS',
            estado: reserva.estado,
            notas: reserva.notas,
            acompanantes,
            referencias: referenciasByTipo,
            nombre_cliente: reserva.nombre_cliente || titular?.nombre || '',
            apellido_cliente: reserva.apellido_cliente || titular?.apellido || '',
            dni_cliente: reserva.dni_cliente || titular?.dni || '',
            email_cliente: reserva.email_cliente || titular?.email || '',
            telefono_cliente: reserva.telefono_cliente || titular?.telefono || '',
            // Campos de tour personalizado
            tour_nombre: reserva.tour_nombre,
            tour_destino: reserva.tour_destino,
            tour_descripcion: reserva.tour_descripcion,
            fecha_inicio: reserva.fecha_inicio ? dayjs(reserva.fecha_inicio) : undefined,
            fecha_fin: reserva.fecha_fin ? dayjs(reserva.fecha_fin) : undefined,
          });
        }
      } catch (error) {
        console.error('Error al cargar la reserva:', error);
        message.error('No se pudo cargar la información de la reserva');
        navigate('/admin/reservas');
      } finally {
        setLoading(false);
      }
    };
    
    cargarReserva();
  }, [id, esEdicion, form, navigate, tours]);

  const onFinish = async (values) => {
    try {
      setLoading(true);

      const titularPayload = clienteSeleccionado
        ? {
            id: clienteSeleccionado.id,
            nombre: clienteSeleccionado.nombre,
            apellido: clienteSeleccionado.apellido,
            email: clienteSeleccionado.email,
            telefono: clienteSeleccionado.telefono,
            dni: values.dni_cliente || undefined,
          }
        : null;

      const acompanantesPayload = Array.isArray(values.acompanantes)
        ? values.acompanantes
            .filter((a) => a && (a.nombre || a.apellido || a.dni))
            .map((a) => ({
              id: a.id,
              nombre: a.nombre,
              apellido: a.apellido || undefined,
              email: a.email || undefined,
              telefono: a.telefono || undefined,
              dni: a.dni || undefined,
              tipo_cliente: 'acompanante',
            }))
        : [];

      const clientesPayload = titularPayload ? [titularPayload, ...acompanantesPayload] : acompanantesPayload;
      const cantidadPersonas = Number(values.cantidad_personas || 1);

      const referenciasPayload = TIPOS_REFERENCIA.reduce((acc, tipo) => {
        const ref = values?.referencias?.[tipo] || {};
        const referencia = (ref.referencia || '').trim();
        const titular = (ref.titular || '').trim();
        const proveedor = (ref.proveedor || '').trim();
        const descripcion = (ref.descripcion || '').trim();
        const requisitos = (ref.requisitos_ingresos || '').trim();
        const condiciones = (ref.condiciones_generales || '').trim();
        const fecha = ref.fecha_vencimiento_hotel;

        const tieneContenido = referencia || titular || proveedor || descripcion || requisitos || condiciones || fecha;
        if (tieneContenido) {
          acc[tipo] = {
            referencia: referencia || undefined,
            titular: titular || undefined,
            proveedor: proveedor || undefined,
            descripcion: descripcion || undefined,
            fecha_vencimiento_hotel: fecha && dayjs.isDayjs(fecha) ? fecha.format('YYYY-MM-DD') : undefined,
            requisitos_ingresos: requisitos || undefined,
            condiciones_generales: condiciones || undefined,
          };
        }

        return acc;
      }, {});

      // Preparar los datos para la API
      const reservaData = {
        ...values,
        fecha_reserva: values.fecha_reserva.format('YYYY-MM-DD'),
        cantidad_personas: cantidadPersonas,
        clientes: clientesPayload,
        referencias: referenciasPayload,
        moneda_precio_unitario: values.moneda_precio_unitario || 'ARS',
        modalidad_pago: values.modalidad_pago || 'cuotas'
      };

      if (!reservaData.tour_id) {
        reservaData.tour_id = null;
      }

      if (reservaData.fecha_inicio && dayjs.isDayjs(reservaData.fecha_inicio)) {
        reservaData.fecha_inicio = reservaData.fecha_inicio.format('YYYY-MM-DD');
      }

      if (reservaData.fecha_fin && dayjs.isDayjs(reservaData.fecha_fin)) {
        reservaData.fecha_fin = reservaData.fecha_fin.format('YYYY-MM-DD');
      }

      delete reservaData.cliente_id;
      delete reservaData.acompanantes;

      // Si es una edición, actualizar; si no, crear nueva
      if (esEdicion) {
        await bookingService.actualizarReserva(id, reservaData);
        message.success('Reserva actualizada correctamente');
      } else {
        await bookingService.crearReserva(reservaData);
        message.success('Reserva creada correctamente');
      }
      
      navigate('/admin/reservas');
    } catch (error) {
      console.error('Error al guardar la reserva:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar la reserva';
      message.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTourChange = (tourId) => {
    const tour = tours.find(t => t.id === tourId);
    setTourSeleccionado(tour);
    setUsaTourExistente(Boolean(tourId));
    
    // Actualizar el precio en el formulario si existe
    if (tour) {
      form.setFieldsValue({ 
        precio_unitario: tour.precio,
        moneda_precio_unitario: form.getFieldValue('moneda_precio_unitario') || 'ARS',
        cantidad_personas: 1,
        tour_nombre: undefined,
        tour_destino: undefined,
        tour_descripcion: undefined,
        fecha_inicio: undefined,
        fecha_fin: undefined,
      });
    }
  };
  
  // Calcular el monto total
  const calcularMontoTotal = () => {
    const cantidad = form.getFieldValue('cantidad_personas') || 0;
    const precio = form.getFieldValue('precio_unitario') || 0;
    return (cantidad * precio).toFixed(2);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/reservas')}
          style={{ marginBottom: '16px' }}
        >
          Volver a la lista
        </Button>
        <h2 style={{ marginBottom: '24px' }}>
          {esEdicion ? 'Editar Reserva' : 'Nueva Reserva'}
        </h2>
      </div>
      
      <Card>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              estado: 'pendiente',
              fecha_reserva: dayjs(),
              cantidad_personas: 1,
              moneda_precio_unitario: 'ARS',
              referencias: {},
              acompanantes: []
            }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Tour"
                  name="tour_id"
                >
                  <Select
                    placeholder="Selecciona un tour"
                    onChange={handleTourChange}
                    allowClear
                    onClear={() => {
                      setTourSeleccionado(null);
                      setUsaTourExistente(false);
                      form.setFieldsValue({ precio_unitario: undefined });
                    }}
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {tours.map(tour => (
                      <Option key={tour.id} value={tour.id}>
                        {tour.nombre} - {tour.destino}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {!usaTourExistente && (
                  <>
                    <Form.Item
                      label="Nombre del tour"
                      name="tour_nombre"
                    >
                      <Input placeholder="Ej: Escapada a Bariloche" />
                    </Form.Item>

                    <Form.Item
                      label="Destino"
                      name="tour_destino"
                      rules={[{ required: true, message: 'Por favor ingresa el destino' }]}
                    >
                      <Input placeholder="Ej: Bariloche" />
                    </Form.Item>

                    <Form.Item label="Descripción" name="tour_descripcion">
                      <Input.TextArea rows={3} placeholder="Descripción del viaje" />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Fecha inicio"
                          name="fecha_inicio"
                          rules={[{ required: true, message: 'Selecciona la fecha de inicio' }]}
                        >
                          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label="Fecha fin"
                          name="fecha_fin"
                          rules={[{ required: true, message: 'Selecciona la fecha de fin' }]}
                        >
                          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                )}

                <Form.Item
                  label="Fecha de Reserva"
                  name="fecha_reserva"
                  rules={[{ required: true, message: 'Por favor selecciona una fecha' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>

                <Form.Item
                  name="cliente_id"
                  hidden
                  noStyle
                >
                  <Input type="hidden" />
                </Form.Item>

                <Form.Item
                  label="Buscar Cliente"
                  help={clienteSeleccionado ? "" : "Busca por nombre, apellido, email o teléfono"}
                >
                  <AutoComplete
                    style={{ width: '100%' }}
                    options={clientes.map(cliente => ({
                      key: cliente.id,
                      value: `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim(),
                      label: (
                        <div>
                          <div><strong>{cliente.nombre} {cliente.apellido}</strong></div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {cliente.email} {cliente.telefono ? `| ${cliente.telefono}` : ''}
                          </div>
                        </div>
                      ),
                    }))}
                    onSelect={(value, option) => {
                      console.log('✅ Cliente seleccionado:', option);
                      handleSeleccionarCliente(value, option);
                    }}
                    onSearch={async (value) => {
                      console.log('🔍 Búsqueda iniciada con:', value);
                      if (value && value.trim().length >= 2) {
                        setClienteBuscando(true);
                        try {
                          console.log('🔎 Llamando a buscarClientes con:', value);
                          const resultados = await clienteService.buscarClientes(value);
                          console.log('📊 Resultados de la búsqueda:', resultados);
                          setClientes(Array.isArray(resultados) ? resultados : []);
                        } catch (error) {
                          console.error('❌ Error en la búsqueda:', error);
                          setClientes([]);
                        } finally {
                          setClienteBuscando(false);
                        }
                      } else {
                        setClientes([]);
                      }
                    }}
                    placeholder="Escribe para buscar clientes..."
                    notFoundContent={
                      clienteBuscando 
                        ? <span><Spin size="small" /> Buscando clientes...</span>
                        : clientes.length === 0 
                          ? "No se encontraron clientes con ese criterio"
                          : "Escribe al menos 2 caracteres para buscar"
                    }
                    disabled={!!clienteSeleccionado}
                    allowClear={!clienteSeleccionado}
                    onFocus={() => {
                      if (clientes.length === 0 && !clienteBuscando) {
                        // Mostrar mensaje de ayuda al enfocar el campo
                        message.info('Escribe al menos 2 caracteres para buscar clientes');
                      }
                    }}
                  />
                </Form.Item>

                {clienteSeleccionado && (
                  <div style={{ marginBottom: 16, padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div><strong>Cliente seleccionado:</strong> {`${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido}`}</div>
                        <div><strong>Email:</strong> {clienteSeleccionado.email}</div>
                        {clienteSeleccionado.telefono && <div><strong>Teléfono:</strong> {clienteSeleccionado.telefono}</div>}
                      </div>
                      <Button 
                        type="link" 
                        danger 
                        onClick={limpiarCliente}
                        style={{ padding: '0' }}
                      >
                        Cambiar
                      </Button>
                    </div>
                  </div>
                )}

                <Form.Item
                  label="Nombre del Cliente"
                  name="nombre_cliente"
                  rules={[{
                    required: true,
                    message: 'El nombre del cliente es obligatorio',
                    whitespace: true
                  }]}
                >
                  <Input 
                    placeholder="Nombre completo del cliente" 
                    maxLength={100}
                  />
                </Form.Item>

                <Form.Item
                  label="Apellido del Cliente"
                  name="apellido_cliente"
                  rules={[{
                    required: true,
                    message: 'El apellido del cliente es obligatorio',
                    whitespace: true
                  }]}
                >
                  <Input placeholder="Apellido del cliente" maxLength={100} />
                </Form.Item>

                <Form.Item
                  label="DNI del Cliente"
                  name="dni_cliente"
                >
                  <Input placeholder="DNI del cliente" maxLength={30} />
                </Form.Item>

                <Form.Item
                  label="Email del Cliente"
                  name="email_cliente"
                  rules={[
                    { type: 'email', message: 'Ingresa un email válido' },
                  ]}
                >
                  <Input 
                    type="email" 
                    placeholder="email@ejemplo.com" 
                  />
                </Form.Item>

                <Form.Item
                  label="Teléfono"
                  name="telefono_cliente"
                >
                  <Input placeholder="+569 1234 5678" />
                </Form.Item>

                <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>
                  Acompañantes
                </div>

                <Form.List name="acompanantes">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }, index) => (
                        <div key={key} style={{ border: '1px solid #f0f0f0', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontWeight: 500 }}>Acompañante #{index + 1}</div>
                            <Button danger type="link" onClick={() => remove(name)} style={{ padding: 0 }}>
                              Quitar
                            </Button>
                          </div>

                          <Row gutter={12}>
                            <Form.Item
                              {...restField}
                              name={[name, 'id']}
                              hidden
                              noStyle
                            >
                              <Input type="hidden" />
                            </Form.Item>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'nombre']}
                                label="Nombre"
                              >
                                <AutoComplete
                                  style={{ width: '100%' }}
                                  options={(acompananteClientes[index] || []).map((c) => ({
                                    key: c.id,
                                    value: `${c.nombre || ''}`.trim(),
                                    label: (
                                      <div>
                                        <div><strong>{c.nombre} {c.apellido}</strong></div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                          {c.email} {c.telefono ? `| ${c.telefono}` : ''}
                                        </div>
                                      </div>
                                    )
                                  }))}
                                  onSearch={(value) => handleBuscarAcompanante(index, value)}
                                  onSelect={(_, option) => handleSeleccionarAcompanante(index, option)}
                                  placeholder="Escribe para buscar o completar manualmente"
                                  notFoundContent={
                                    acompananteBuscando[index]
                                      ? <span><Spin size="small" /> Buscando...</span>
                                      : 'Sin resultados'
                                  }
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'apellido']}
                                label="Apellido"
                              >
                                <Input placeholder="Apellido" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={12}>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'email']}
                                label="Email"
                              >
                                <Input placeholder="email@ejemplo.com" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'telefono']}
                                label="Teléfono"
                              >
                                <Input placeholder="+54 ..." />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Form.Item
                            {...restField}
                            name={[name, 'dni']}
                            label="DNI"
                          >
                            <Input placeholder="DNI (opcional)" />
                          </Form.Item>
                        </div>
                      ))}

                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        disabled={
                          fields.length >= Math.max(0, Number(cantidadPersonasWatch || 1) - 1)
                        }
                      >
                        Agregar acompañante
                      </Button>
                    </>
                  )}
                </Form.List>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label="Cantidad de Personas"
                  name="cantidad_personas"
                  rules={[{ required: true, message: 'Por favor ingresa la cantidad de personas' }]}
                >
                  <InputNumber 
                    min={1} 
                    max={usaTourExistente ? tourSeleccionado?.cupos_disponibles : undefined}
                    style={{ width: '100%' }}
                    onChange={(val) => {
                      const cantidad = Number(val || 1);
                      const maxAcomp = Math.max(0, cantidad - 1);
                      const actuales = Array.isArray(acompanantesWatch) ? acompanantesWatch : [];
                      if (actuales.length > maxAcomp) {
                        form.setFieldsValue({ acompanantes: actuales.slice(0, maxAcomp) });
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item
                  label="Precio por Persona"
                  name="precio_unitario"
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    disabled={usaTourExistente}
                    formatter={(value) => {
                      const moneda = monedaPrecioWatch || 'ARS';
                      const symbol = moneda === 'USD' ? 'USD ' : '$';
                      return `${symbol}${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    }}
                    parser={(value) => value.replace(/USD\s?|\$\s?|(,*)/g, '')}
                  />
                </Form.Item>

                <Form.Item
                  label="Moneda"
                  name="moneda_precio_unitario"
                  initialValue="ARS"
                >
                  <Select
                    disabled={usaTourExistente}
                    options={[
                      { value: 'ARS', label: 'Pesos (ARS)' },
                      { value: 'USD', label: 'Dólares (USD)' }
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  label="Monto Total"
                >
                  <InputNumber 
                    style={{ width: '100%', fontWeight: 'bold' }} 
                    disabled
                    value={calcularMontoTotal()}
                    formatter={value => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>

                <Form.Item
                  label="Seña"
                  name="monto_seña"
                  initialValue={0}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    formatter={value => `$${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>

                <Form.Item
                  label="Tipo de pago"
                  name="tipo_pago"
                >
                  <Select>
                    <Option value="efectivo">Efectivo</Option>
                    <Option value="transferencia">Transferencia</Option>
                    <Option value="tarjeta">Tarjeta</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Modalidad de pago"
                  name="modalidad_pago"
                  initialValue="cuotas"
                >
                  <Select>
                    <Option value="sin_cuotas">Sin cuotas (entregas libres)</Option>
                    <Option value="cuotas">En cuotas</Option>
                  </Select>
                </Form.Item>

                {modalidadPagoWatch !== 'sin_cuotas' && (
                  <Form.Item label="Cantidad de cuotas" name="cantidad_cuotas" initialValue={1}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                )}

                <Form.Item
                  label="Estado"
                  name="estado"
                >
                  <Select>
                    <Option value="pendiente">Pendiente</Option>
                    <Option value="confirmada">Confirmada</Option>
                    <Option value="cancelada">Cancelada</Option>
                    <Option value="completada">Completada</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Notas"
                  name="notas"
                >
                  <Input.TextArea rows={4} placeholder="Notas adicionales sobre la reserva" />
                </Form.Item>

                <div style={{ marginBottom: 8, fontWeight: 600 }}>Referencias</div>
                <Tabs
                  items={[
                    { key: 'terrestre', label: 'Terrestre' },
                    { key: 'aereo', label: 'Aéreo' },
                    { key: 'asistencia', label: 'Asistencia' },
                  ].map((tab) => ({
                    key: tab.key,
                    label: tab.label,
                    children: (
                      <>
                        <Form.Item label="Referencia" name={['referencias', tab.key, 'referencia']}>
                          <Input placeholder="Número de referencia" />
                        </Form.Item>

                        <Form.Item label="Titular" name={['referencias', tab.key, 'titular']}>
                          <Input placeholder="Titular de esta referencia" />
                        </Form.Item>

                        <Form.Item label="Proveedor" name={['referencias', tab.key, 'proveedor']}>
                          <Input placeholder="Proveedor de esta referencia" />
                        </Form.Item>

                        <Form.Item label="Descripción" name={['referencias', tab.key, 'descripcion']}>
                          <Input.TextArea rows={3} placeholder="Descripción de la referencia" />
                        </Form.Item>

                        <Form.Item label="Fecha Vencimiento Hotel" name={['referencias', tab.key, 'fecha_vencimiento_hotel']}>
                          <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Seleccioná la fecha" />
                        </Form.Item>

                        <Form.Item label="Requisitos de Ingresos" name={['referencias', tab.key, 'requisitos_ingresos']}>
                          <Input.TextArea rows={3} placeholder="Requisitos de ingreso al destino" />
                        </Form.Item>

                        <Form.Item label="Condiciones Generales" name={['referencias', tab.key, 'condiciones_generales']}>
                          <Input.TextArea rows={3} placeholder="Condiciones generales de la referencia" />
                        </Form.Item>

                        {esEdicion ? (
                          <ReservaAdjuntos
                            reservaId={id}
                            referenceType={tab.key}
                            compact
                          />
                        ) : (
                          <div style={{ color: '#999', fontSize: 12 }}>
                            Guardá la reserva para poder adjuntar el archivo de esta referencia.
                          </div>
                        )}
                      </>
                    ),
                  }))}
                />
              </Col>
            </Row>

            <Row justify="end" style={{ marginTop: '24px' }}>
              <Col>
                <Button 
                  onClick={() => navigate('/admin/reservas')} 
                  style={{ marginRight: '8px' }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  {esEdicion ? 'Actualizar Reserva' : 'Crear Reserva'}
                </Button>
              </Col>
            </Row>
          </Form>
        </Spin>
      </Card>
      
      {esEdicion && <ReservaAdjuntos reservaId={id} />}
    </div>
  );
};

export default ReservaForm;
