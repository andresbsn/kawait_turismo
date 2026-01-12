import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCuentasCorrientes } from '../../services/cuentaCorrienteService';
import FiltrosCuentas from './FiltrosCuentas';

const estados = {
  pendiente: { label: 'Pendiente', color: 'orange' },
  en_proceso: { label: 'En Proceso', color: 'blue' },
  pagado: { label: 'Pagado', color: 'green' },
  atrasado: { label: 'Atrasado', color: 'red' },
  cancelado: { label: 'Cancelado', color: 'default' }
};

const CuentasCorrientesList = ({ initialFiltros = {} }) => {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filtros, setFiltros] = useState(initialFiltros || {});
  const navigate = useNavigate();
  const location = useLocation();

  const cargarCuentas = async () => {
    try {
      setLoading(true);
      const data = await getCuentasCorrientes({
        ...filtros,
        page,
        limit: pageSize
      });
      setCuentas(data.cuentas || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, [page, pageSize, filtros]);

  const handleFiltrosChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setPage(1);
  };

  const handleVerDetalle = (id) => {
    navigate(`/admin/cuentas-corrientes/${id}${location.search || ''}`);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 90 },
    {
      title: 'Cliente',
      key: 'cliente',
      render: (_, record) => `${record.cliente?.nombre || ''} ${record.cliente?.apellido || ''}`.trim() || '-'
    },
    {
      title: 'Tour',
      key: 'tour',
      render: (_, record) => record.reserva?.tour?.nombre || record.reserva?.tour_nombre || '-'
    },
    {
      title: 'Monto Total',
      dataIndex: 'monto_total',
      key: 'monto_total',
      align: 'right',
      render: (v) => `$${Number(v || 0).toLocaleString()}`
    },
    {
      title: 'Saldo Pendiente',
      dataIndex: 'saldo_pendiente',
      key: 'saldo_pendiente',
      align: 'right',
      render: (v) => `$${Number(v || 0).toLocaleString()}`
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (v) => {
        const e = estados[v] || { label: v, color: 'default' };
        return <Tag color={e.color}>{e.label}</Tag>;
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 160,
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleVerDetalle(record.id)}>Ver</Button>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <FiltrosCuentas onFiltrosChange={handleFiltrosChange} initialFiltros={initialFiltros} />
      <Card>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={cuentas}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
          onRow={(record) => ({
            onClick: () => handleVerDetalle(record.id)
          })}
        />
      </Card>
    </Space>
  );
};

export default CuentasCorrientesList;
