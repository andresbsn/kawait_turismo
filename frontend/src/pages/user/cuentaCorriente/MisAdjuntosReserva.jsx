import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Typography, message, Tooltip, Card, Empty } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileImageOutlined, FileOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { bookingService } from '../../../config/api';
import dayjs from 'dayjs';

const { Text } = Typography;

const TIPO_LABELS = {
  presupuesto: { label: 'Presupuesto', color: 'blue' },
  voucher: { label: 'Voucher', color: 'green' },
  ticket_aereo: { label: 'Ticket Aéreo', color: 'cyan' },
  asistencia_viajero: { label: 'Asistencia al Viajero', color: 'orange' },
  factura: { label: 'Factura', color: 'purple' },
  otro: { label: 'Otro', color: 'default' }
};

const getIcon = (mimeType) => {
  if (mimeType?.includes('pdf')) return <FilePdfOutlined style={{ color: '#cf1322', fontSize: 16 }} />;
  if (mimeType?.includes('image')) return <FileImageOutlined style={{ color: '#1890ff', fontSize: 16 }} />;
  return <FileOutlined style={{ fontSize: 16 }} />;
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MisAdjuntosReserva = ({ reservaId }) => {
  const [adjuntos, setAdjuntos] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarAdjuntos = async () => {
    if (!reservaId) return;
    try {
      setLoading(true);
      const data = await bookingService.getAttachments(reservaId);
      setAdjuntos(data || []);
    } catch (error) {
      console.error('Error al cargar adjuntos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAdjuntos();
  }, [reservaId]);

  const handleDownload = async (adjunto) => {
    try {
      await bookingService.downloadAttachment(reservaId, adjunto.id, adjunto.nombre_archivo);
    } catch (error) {
      message.error('Error al descargar el archivo');
    }
  };

  if (!reservaId) return null;

  const columns = [
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      width: 160,
      render: (tipo) => {
        const config = TIPO_LABELS[tipo] || { label: tipo, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      }
    },
    {
      title: 'Archivo',
      dataIndex: 'nombre_archivo',
      key: 'nombre_archivo',
      render: (text, record) => (
        <Space>
          {getIcon(record.mimetype)}
          <span>{text}</span>
          {record.size && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              ({formatSize(record.size)})
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (text) => text ? dayjs(text).format('DD/MM/YYYY HH:mm') : '-'
    },
    {
      title: '',
      key: 'acciones',
      width: 80,
      render: (_, record) => (
        <Tooltip title="Descargar">
          <Button
            type="primary"
            ghost
            icon={<DownloadOutlined />}
            size="small"
            onClick={() => handleDownload(record)}
          />
        </Tooltip>
      )
    }
  ];

  return (
    <Card
      size="small"
      title={
        <Space>
          <FolderOpenOutlined />
          <span>Documentación de la Reserva</span>
        </Space>
      }
      style={{ marginTop: 16 }}
      loading={loading}
    >
      {adjuntos.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No hay documentos adjuntos disponibles"
        />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={adjuntos}
          pagination={false}
          size="small"
        />
      )}
    </Card>
  );
};

export default MisAdjuntosReserva;
