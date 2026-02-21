import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Upload, Select, message, Tooltip, Space, Tag } from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined, FilePdfOutlined, FileImageOutlined, FileOutlined } from '@ant-design/icons';
import { bookingService } from '../../../config/api';
import dayjs from 'dayjs';

const { Option } = Select;

const ReservaAdjuntos = ({ reservaId }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAttachments(reservaId);
      setAttachments(data || []);
    } catch (error) {
      console.error('Error al cargar adjuntos:', error);
      message.error('No se pudieron cargar los archivos adjuntos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reservaId) {
      fetchAttachments();
    }
  }, [reservaId]);

  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;

    if (!selectedType) {
      message.error('Por favor selecciona el tipo de documento antes de subirlo');
      onError('Tipo de documento no seleccionado');
      return;
    }

    try {
      setUploading(true);
      await bookingService.uploadAttachment(reservaId, file, selectedType);
      message.success(`${file.name} subido correctamente`);
      onSuccess('Ok');
      fetchAttachments();
      // setSelectedType(null); // Opcional: mantener el tipo seleccionado para subir más del mismo
    } catch (error) {
      console.error('Error al subir archivo:', error);
      message.error(`${file.name} falló al subir.`);
      onError({ error });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (atchId) => {
    try {
      await bookingService.deleteAttachment(reservaId, atchId);
      message.success('Archivo eliminado');
      fetchAttachments();
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      message.error('Error al eliminar el archivo');
    }
  };

  const handleDownload = async (atch) => {
    try {
      await bookingService.downloadAttachment(reservaId, atch.id, atch.nombre_archivo);
    } catch (error) {
      console.error('Error al descargar:', error);
      message.error('Error al descargar el archivo');
    }
  };

  const getIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return <FilePdfOutlined style={{ color: 'red' }} />;
    if (mimeType?.includes('image')) return <FileImageOutlined style={{ color: 'blue' }} />;
    return <FileOutlined />;
  };

  const columns = [
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (text) => {
        const colors = {
          presupuesto: 'blue',
          voucher: 'green',
          ticket_aereo: 'cyan',
          asistencia_viajero: 'orange',
          factura: 'purple',
          liquidacion_reserva: 'red',
          otro: 'default'
        };
        const labels = {
          presupuesto: 'Presupuesto',
          voucher: 'Voucher',
          ticket_aereo: 'Ticket Aéreo',
          asistencia_viajero: 'Asistencia al Viajero',
          factura: 'Factura',
          liquidacion_reserva: 'Liquidación Reserva',
          otro: 'Otro'
        };
        return <Tag color={colors[text] || 'default'}>{labels[text] || text}</Tag>;
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
        </Space>
      )
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
            <Tooltip title="Descargar">
                <Button 
                    icon={<DownloadOutlined />} 
                    size="small" 
                    onClick={() => handleDownload(record)} 
                />
            </Tooltip>
            <Tooltip title="Eliminar">
                <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    size="small" 
                    onClick={() => handleDelete(record.id)} 
                />
            </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Card title="Documentación Adjunta" style={{ marginTop: 20 }}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          style={{ width: 200 }}
          placeholder="Selecciona tipo de archivo"
          onChange={setSelectedType}
          value={selectedType}
        >
          <Option value="presupuesto">Presupuesto</Option>
          <Option value="voucher">Vouchers</Option>
          <Option value="ticket_aereo">Ticket Aéreo</Option>
          <Option value="asistencia_viajero">Asistencia al Viajero</Option>
          <Option value="factura">Facturas</Option>
          <Option value="liquidacion_reserva">Liquidación Reserva</Option>
          <Option value="otro">Otro</Option>
        </Select>

        <Upload
            customRequest={handleUpload}
            showUploadList={false}
            disabled={!selectedType}
        >
            <Button icon={<UploadOutlined />} loading={uploading} disabled={!selectedType}>
                Subir Archivo
            </Button>
        </Upload>
        
        {!selectedType && <span style={{ color: '#999', fontSize: '12px' }}>Selecciona un tipo para habilitar la subida</span>}
      </Space>

      <Table 
        columns={columns} 
        dataSource={attachments} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 5 }}
      />
    </Card>
  );
};

export default ReservaAdjuntos;
