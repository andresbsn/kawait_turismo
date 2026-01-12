import React from 'react';
import { Typography } from 'antd';
import CuentasCorrientesPage from '../../CuentasCorrientesPage';

const CuentasCorrientesIndex = () => {
  return (
    <div>
      <Typography.Title level={3} style={{ marginTop: 0 }}>Cuentas Corrientes</Typography.Title>
      <CuentasCorrientesPage />
    </div>
  );
};

export default CuentasCorrientesIndex;
