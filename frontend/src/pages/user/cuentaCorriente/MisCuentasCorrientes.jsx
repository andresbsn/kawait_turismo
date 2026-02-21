import React, { useEffect, useMemo, useState } from 'react';
import { Card, Collapse, Table, Typography, Tag, Space, Button, message } from 'antd';
import { getMisCuentasCorrientes } from '../../../services/cuentaCorrienteService';
import { getComprobantePdf } from '../../../services/pagoService';
import MisAdjuntosReserva from './MisAdjuntosReserva';

const { Title, Text } = Typography;

const estadoCuotaTag = (estado) => {
  const map = {
    pendiente: { color: 'default', label: 'Pendiente' },
    pagada_parcial: { color: 'orange', label: 'Parcial' },
    pagada_total: { color: 'green', label: 'Pagada' },
    vencida: { color: 'red', label: 'Vencida' },
    cancelada: { color: 'default', label: 'Cancelada' }
  };
  const v = map[estado] || { color: 'default', label: estado };
  return <Tag color={v.color}>{v.label}</Tag>;
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
  const [data, setData] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const resp = await getMisCuentasCorrientes();
      setData(resp);
    } catch (e) {
      message.error('No se pudo cargar tu cuenta corriente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const cuentas = data?.cuentas || [];

  const columns = [
    { title: 'Cuota', dataIndex: 'numero_cuota', key: 'numero_cuota', width: 90 },
    {
      title: 'Vencimiento',
      dataIndex: 'fecha_vencimiento',
      key: 'fecha_vencimiento',
      render: (v) => (v ? new Date(v).toLocaleDateString('es-AR') : 'N/A')
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      align: 'right',
      render: (v) => `$${Number(v || 0).toLocaleString()}`
    },
    {
      title: 'Pagado',
      dataIndex: 'monto_pagado',
      key: 'monto_pagado',
      align: 'right',
      render: (v) => `$${Number(v || 0).toLocaleString()}`
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (v) => estadoCuotaTag(v)
    },
    {
      title: 'Comprobante',
      key: 'comprobante',
      render: (_, cuota) => {
        const p = cuota.pago;
        return p?.numero_comprobante ? <Text>{p.numero_comprobante}</Text> : <Text type="secondary">-</Text>;
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, cuota) => {
        const p = cuota.pago;
        if (!p) return <Text type="secondary">-</Text>;

        const filename = `${p.numero_comprobante || 'comprobante'}.pdf`;
        return (
          <Space>
            <Button
              onClick={async () => {
                try {
                  const blob = await getComprobantePdf(p.id, { download: false });
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
                  const blob = await getComprobantePdf(p.id, { download: true });
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

  const collapseItems = useMemo(() => {
    return cuentas.map((cc) => {
      const reserva = cc.reserva;
      const tourNombre = reserva?.tour?.nombre || reserva?.tour_nombre || 'Reserva';
      const destinoValue = reserva?.tour?.destino || reserva?.tour_destino;
      const destino = destinoValue ? ` - ${destinoValue}` : '';

      const fechaReserva = reserva?.fecha_reserva ? new Date(reserva.fecha_reserva).toLocaleDateString('es-AR') : null;
      const descripcionValue = reserva?.tour?.descripcion || reserva?.tour_descripcion || reserva?.descripcion;
      const header = (
        <Space direction="vertical" size={0}>
          <Text strong>{tourNombre}{destino}</Text>
          {fechaReserva && (
            <Text type="secondary">Fecha de reserva: {fechaReserva}</Text>
          )}
          {descripcionValue && (
            <Text type="secondary">{descripcionValue}</Text>
          )}
          <Text type="secondary">
            Total: ${Number(cc.monto_total || 0).toLocaleString()} | Pendiente: ${Number(cc.saldo_pendiente || 0).toLocaleString()}
          </Text>
        </Space>
      );

      return {
        key: String(cc.id),
        label: header,
        children: (
          <>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={cc.cuotas || []}
              pagination={false}
            />
            {/* Adjuntos de la reserva */}
            {reserva?.id && (
              <MisAdjuntosReserva reservaId={reserva.id} />
            )}
          </>
        )
      };
    });
  }, [cuentas]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card loading={loading}>
        <Title level={3} style={{ marginTop: 0 }}>Mi Cuenta Corriente</Title>
        {data?.cliente && (
          <Text type="secondary">
            {data.cliente.nombre} {data.cliente.apellido} ({data.cliente.email})
          </Text>
        )}
      </Card>

      {cuentas.length === 0 ? (
        <Card>
          <Text>No tenés cuentas corrientes asociadas.</Text>
        </Card>
      ) : (
        <Collapse items={collapseItems} />
      )}
    </Space>
  );
};

export default MisCuentasCorrientes;
