import React, { useEffect, useState } from 'react';
import { Card, Table, Typography, Space, Button, message, Tag } from 'antd';
import { getComprobantePdf, getMisComprobantesReserva } from '../../../services/pagoService';

const { Title, Text } = Typography;

const metodoPagoTag = (metodo) => {
  const map = {
    efectivo: { color: 'green', label: 'Efectivo' },
    transferencia: { color: 'blue', label: 'Transferencia' },
    tarjeta_credito: { color: 'purple', label: 'Tarjeta Crédito' },
    tarjeta_debito: { color: 'cyan', label: 'Tarjeta Débito' },
    deposito: { color: 'orange', label: 'Depósito' },
    cheque: { color: 'magenta', label: 'Cheque' },
    echq: { color: 'volcano', label: 'eCheq' },
    otro: { color: 'default', label: 'Otro' }
  };
  const value = map[metodo] || { color: 'default', label: metodo || 'Sin definir' };
  return <Tag color={value.color}>{value.label}</Tag>;
};

const openBlobPdf = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (!w) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

const downloadBlobPdf = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

const MisCuentasCorrientes = () => {
  const [loading, setLoading] = useState(false);
  const [pagos, setPagos] = useState([]);

  const cargar = async () => {
    setLoading(true);
    try {
      const resp = await getMisComprobantesReserva();
      setPagos(resp?.pagos || []);
    } catch (e) {
      message.error('No se pudieron cargar tus comprobantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const columns = [
    {
      title: 'Comprobante',
      dataIndex: 'numero_comprobante',
      key: 'numero_comprobante',
      render: (value) => value || '-'
    },
    {
      title: 'Fecha de pago',
      dataIndex: 'fecha_pago',
      key: 'fecha_pago',
      render: (value) => (value ? new Date(value).toLocaleString('es-AR') : '-')
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      align: 'right',
      render: (value, record) => {
        const moneda = record?.reserva?.moneda_precio_unitario || 'ARS';
        return `${moneda} ${Number(value || 0).toLocaleString('es-AR')}`;
      }
    },
    {
      title: 'Método',
      dataIndex: 'metodo_pago',
      key: 'metodo_pago',
      render: (value) => metodoPagoTag(value)
    },
    {
      title: 'Observaciones',
      dataIndex: 'observaciones',
      key: 'observaciones',
      render: (value) => value || '-'
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, pago) => {
        const filename = `${pago.numero_comprobante || 'comprobante'}.pdf`;
        return (
          <Space>
            <Button
              onClick={async () => {
                try {
                  const blob = await getComprobantePdf(pago.id, { download: false });
                  openBlobPdf(blob, filename);
                } catch (e) {
                  message.error('No se pudo abrir el comprobante');
                }
              }}
            >
              Ver PDF
            </Button>
            <Button
              onClick={async () => {
                try {
                  const blob = await getComprobantePdf(pago.id, { download: true });
                  downloadBlobPdf(blob, filename);
                } catch (e) {
                  message.error('No se pudo descargar el comprobante');
                }
              }}
            >
              Descargar
            </Button>
          </Space>
        );
      }
    }
  ];

  const codigoReserva = pagos[0]?.reserva?.codigo || null;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card loading={loading}>
        <Title level={3} style={{ marginTop: 0 }}>Mis comprobantes</Title>
        {codigoReserva && <Text type="secondary">Reserva: {codigoReserva}</Text>}
      </Card>

      {pagos.length === 0 ? (
        <Card>
          <Text>No tenés comprobantes asociados a esta reserva.</Text>
        </Card>
      ) : (
        <Card>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={pagos}
            pagination={false}
          />
        </Card>
      )}
    </Space>
  );
};

export default MisCuentasCorrientes;
