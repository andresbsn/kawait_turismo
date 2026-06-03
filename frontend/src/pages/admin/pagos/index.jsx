import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Select, 
  message, 
  Spin,
  Empty,
  Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  SyncOutlined, 
  DollarOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getTodosLosPagos, getComprobantePdf } from '../../../services/pagoService';

const { Option } = Select;

const METODOS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta_credito', label: 'Tarjeta Crédito' },
  { value: 'tarjeta_debito', label: 'Tarjeta Débito' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'echq', label: 'E-Cheq' },
  { value: 'otro', label: 'Otro' },
];

const PagosModule = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    metodo_pago: '',
  });

  // Cargar pagos
  const fetchPagos = async (params = {}) => {
    try {
      setLoading(true);
      const { current = 1, pageSize = 10 } = params;
      const { search, metodo_pago } = filters;

      const queryParams = {
        page: current,
        limit: pageSize,
        ...(search && { search }),
        ...(metodo_pago && { metodo_pago })
      };

      const response = await getTodosLosPagos(queryParams);

      if (response && response.success) {
        setPagos(response.pagos || []);
        setPagination((prev) => ({
          ...prev,
          current: response.pagination?.page || current,
          pageSize: response.pagination?.limit || pageSize,
          total: response.pagination?.total || 0,
        }));
      } else {
        message.error(response?.message || 'Error al cargar los pagos');
        setPagos([]);
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      message.error(error.message || 'Error al cargar los pagos');
      setPagos([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar descarga de comprobante
  const descargarComprobante = async (pagoId, numeroComprobante, forceDownload = false) => {
    try {
      message.loading({ content: 'Generando comprobante...', key: 'pdf' });
      const blob = await getComprobantePdf(pagoId, { download: forceDownload });
      
      const file = new Blob([blob], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      if (forceDownload) {
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `${numeroComprobante}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        message.success({ content: 'Comprobante descargado correctamente', key: 'pdf' });
      } else {
        window.open(fileURL, '_blank');
        message.destroy('pdf');
      }
    } catch (error) {
      console.error('Error al descargar comprobante:', error);
      message.error({ content: 'Error al generar el comprobante PDF', key: 'pdf' });
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    fetchPagos({
      current: pagination.current,
      pageSize: pagination.pageSize,
    });
  }, [filters, pagination.current, pagination.pageSize]);

  // Manejar cambio de página
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  // Manejar cambio de filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFilters({
      search: '',
      metodo_pago: '',
    });
  };

  const columns = [
    {
      title: 'Comprobante',
      dataIndex: 'numero_comprobante',
      key: 'numero_comprobante',
      render: (text) => <span className="font-semibold text-gray-700">{text}</span>,
    },
    {
      title: 'Reserva',
      dataIndex: 'reserva',
      key: 'reserva',
      render: (reserva) => (
        reserva ? (
          <div>
            <div className="font-medium text-primary-600">{reserva.codigo}</div>
            <div className="text-xs text-gray-500">{reserva.tour_destino || 'Destino no especificado'}</div>
          </div>
        ) : (
          <span className="text-gray-400">Sin reserva directa</span>
        )
      ),
    },
    {
      title: 'Pagador',
      key: 'pagador',
      render: (_, record) => {
        const nombre = record.nombre_pagador || `${record.reserva?.nombre_cliente || ''} ${record.reserva?.apellido_cliente || ''}`.trim() || 'No especificado';
        const email = record.email_pagador || record.reserva?.email_cliente || 'Sin email';
        return (
          <div>
            <div className="font-medium">{nombre}</div>
            <div className="text-xs text-gray-500">{email}</div>
          </div>
        );
      },
    },
    {
      title: 'Importe',
      dataIndex: 'monto',
      key: 'monto',
      render: (monto, record) => {
        const valor = Number(monto || 0);
        const moneda = record.reserva?.moneda_precio_unitario || 'ARS';
        return (
          <span className="font-bold text-green-600 text-base">
            {`${moneda} ${valor.toLocaleString('es-AR')}`}
          </span>
        );
      },
    },
    {
      title: 'Método',
      dataIndex: 'metodo_pago',
      key: 'metodo_pago',
      render: (metodo) => {
        const colores = {
          efectivo: 'green',
          transferencia: 'blue',
          tarjeta_credito: 'purple',
          tarjeta_debito: 'cyan',
          deposito: 'orange',
          cheque: 'magenta',
          echq: 'volcano',
          otro: 'default'
        };
        const label = METODOS_PAGO.find(m => m.value === metodo)?.label || metodo;
        return <Tag color={colores[metodo] || 'default'} className="uppercase font-medium">{label}</Tag>;
      },
    },
    {
      title: 'Fecha de Pago',
      dataIndex: 'fecha_pago',
      key: 'fecha_pago',
      render: (fecha) => dayjs(fecha).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => new Date(a.fecha_pago) - new Date(b.fecha_pago),
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Ver Comprobante PDF">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => descargarComprobante(record.id, record.numero_comprobante, false)}
            />
          </Tooltip>
          <Tooltip title="Descargar PDF">
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => descargarComprobante(record.id, record.numero_comprobante, true)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="pagos-container" style={{ padding: '8px' }}>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center">
          <DollarOutlined className="mr-2 text-primary-600" />
          Historial de Pagos de Reservas
        </h1>
      </div>

      <Card className="mb-4" style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              placeholder="Buscar por comprobante, código reserva o pagador"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onPressEnter={() => fetchPagos()}
              allowClear
              prefix={<SearchOutlined />}
            />
          </div>
          <div>
            <Select
              placeholder="Filtrar por método de pago"
              style={{ width: '100%' }}
              allowClear
              value={filters.metodo_pago || null}
              onChange={(value) => handleFilterChange('metodo_pago', value)}
            >
              {METODOS_PAGO.map(m => (
                <Option key={m.value} value={m.value}>{m.label}</Option>
              ))}
            </Select>
          </div>
          <div>
            <Button 
              onClick={limpiarFiltros}
              className="w-full flex items-center justify-center"
              icon={<SyncOutlined />}
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>
      </Card>

      <Card style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <Spin spinning={loading}>
          <Table 
            columns={columns} 
            dataSource={pagos} 
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} pagos registrados`,
              pageSizeOptions: ['10', '20', '50'],
              showQuickJumper: true,
            }}
            onChange={handleTableChange}
            locale={{
              emptyText: (
                <Empty description={<span>No se encontraron registros de pagos</span>} />
              )
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default PagosModule;
