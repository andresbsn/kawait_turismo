import React, { useEffect } from 'react';
import { Button, Card, Col, Form, Input, Row, Select } from 'antd';

const estados = [
  { value: '', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_proceso', label: 'En Proceso' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'cancelado', label: 'Cancelado' }
];

const FiltrosCuentas = ({ onFiltrosChange, initialFiltros = {} }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!initialFiltros) return;
    const next = {
      cliente_id: initialFiltros?.cliente_id || '',
      estado: initialFiltros?.estado || ''
    };
    form.setFieldsValue(next);

    const filtrosLimpios = Object.fromEntries(
      Object.entries(next).filter(([_, v]) => v !== '')
    );
    onFiltrosChange(filtrosLimpios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiltros?.cliente_id, initialFiltros?.estado]);

  const onFinish = (values) => {
    const filtrosLimpios = Object.fromEntries(
      Object.entries(values || {}).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );
    onFiltrosChange(filtrosLimpios);
  };

  return (
    <Card>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          cliente_id: initialFiltros?.cliente_id || '',
          estado: initialFiltros?.estado || ''
        }}
      >
        <Row gutter={16} align="bottom">
          <Col xs={24} md={8}>
            <Form.Item label="ID de Cliente" name="cliente_id">
              <Input placeholder="Ej: 123" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Estado" name="estado">
              <Select
                allowClear
                placeholder="Todos"
                options={estados.filter((e) => e.value !== '').map((e) => ({ value: e.value, label: e.label }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label=" ">
              <Row gutter={8}>
                <Col span={12}>
                  <Button type="primary" htmlType="submit" block>
                    Buscar
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    block
                    onClick={() => {
                      form.resetFields();
                      onFiltrosChange({});
                    }}
                  >
                    Limpiar
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default FiltrosCuentas;
