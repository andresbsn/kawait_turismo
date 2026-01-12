import React from 'react';
import CuentasCorrientesList from '../components/cuentasCorrientes/CuentasCorrientesList';
import { useLocation } from 'react-router-dom';
import { Typography, Space } from 'antd';

const CuentasCorrientesPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const clienteId = params.get('cliente_id');

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Gestión de Cuentas Corrientes
      </Typography.Title>
      <CuentasCorrientesList initialFiltros={clienteId ? { cliente_id: clienteId } : {}} />
    </Space>
  );
};

export default CuentasCorrientesPage;
