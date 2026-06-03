import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Upload, Select, message, Tooltip, Space, Tag } from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined, FilePdfOutlined, FileImageOutlined, FileOutlined } from '@ant-design/icons';
import { bookingService } from '../../../config/api';
import dayjs from 'dayjs';

const { Option } = Select;

const TYPE_OPTIONS = [
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'voucher', label: 'Vouchers' },
  { value: 'ticket_aereo', label: 'Ticket Aéreo' },
  { value: 'asistencia_viajero', label: 'Asistencia al Viajero' },
  { value: 'factura', label: 'Facturas' },
  { value: 'liquidacion_reserva', label: 'Liquidación Reserva' },
  { value: 'otro', label: 'Otro' },
  { value: 'referencia_terrestre', label: 'Referencia Terrestre' },
  { value: 'referencia_aerea', label: 'Referencia Aérea' },
  { value: 'referencia_asistencia', label: 'Referencia Asistencia' },
];

const REFERENCE_CONFIG = {
  terrestre: {
    attachmentType: 'referencia_terrestre',
    title: 'Adjunto referencia terrestre',
  },
  aereo: {
    attachmentType: 'referencia_aerea',
    title: 'Adjunto referencia aérea',
  },
  asistencia: {
    attachmentType: 'referencia_asistencia',
    title: 'Adjunto referencia asistencia',
  },
};

const ReservaAdjuntos = ({ reservaId, referenceType = null, compact = false }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const forcedType = REFERENCE_CONFIG[referenceType]?.attachmentType || null;
  const [selectedType, setSelectedType] = useState(forcedType);

  useEffect(() => {
    setSelectedType(forcedType);
  }, [forcedType]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAttachments(reservaId);
      const lista = Array.isArray(data) ? data : [];
      setAttachments(forcedType ? lista.filter((item) => item.tipo === forcedType) : lista);
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

    const tipoSubida = selectedType || forcedType;

    if (!tipoSubida) {
      message.error('Por favor selecciona el tipo de documento antes de subirlo');
      onError('Tipo de documento no seleccionado');
      return;
    }

    try {
      setUploading(true);
      await bookingService.uploadAttachment(reservaId, file, tipoSubida);
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
          otro: 'default',
          referencia_terrestre: 'geekblue',
          referencia_aerea: 'volcano',
          referencia_asistencia: 'gold'
        };
        const labels = {
          presupuesto: 'Presupuesto',
          voucher: 'Voucher',
          ticket_aereo: 'Ticket Aéreo',
          asistencia_viajero: 'Asistencia al Viajero',
          factura: 'Factura',
          liquidacion_reserva: 'Liquidación Reserva',
          otro: 'Otro',
          referencia_terrestre: 'Referencia Terrestre',
          referencia_aerea: 'Referencia Aérea',
          referencia_asistencia: 'Referencia Asistencia'
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
    <Card
      title={forcedType ? (REFERENCE_CONFIG[referenceType]?.title || 'Adjunto de referencia') : 'Documentación Adjunta'}
      style={{ marginTop: compact ? 12 : 20 }}
      size={compact ? 'small' : 'default'}
    >
      <Space style={{ marginBottom: 16 }} wrap>
        {!forcedType && (
          <Select
            style={{ width: 240 }}
            placeholder="Selecciona tipo de archivo"
            onChange={setSelectedType}
            value={selectedType}
          >
            {TYPE_OPTIONS.map((option) => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
        )}

        <Upload
            customRequest={handleUpload}
            showUploadList={false}
            disabled={!(selectedType || forcedType)}
        >
            <Button icon={<UploadOutlined />} loading={uploading} disabled={!(selectedType || forcedType)}>
                {forcedType ? 'Subir/Reemplazar Archivo' : 'Subir Archivo'}
            </Button>
        </Upload>
        
        {!forcedType && !selectedType && <span style={{ color: '#999', fontSize: '12px' }}>Selecciona un tipo para habilitar la subida</span>}
        {forcedType && <span style={{ color: '#999', fontSize: '12px' }}>Solo se permite 1 archivo por referencia (al subir uno nuevo, reemplaza el anterior).</span>}
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
