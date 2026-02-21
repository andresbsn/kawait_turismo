import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const baseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;
const API_URL = `${baseUrl}/api/cuentas-corrientes`;

const getAuthHeaders = () => {
  try {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
};

export const getCuentasCorrientes = async (filtros = {}) => {
  try {
    const { page = 1, limit = 10, estado, cliente_id } = filtros;
    const response = await axios.get(API_URL, {
      params: { page, limit, estado, cliente_id },
      headers: { ...getAuthHeaders() },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener cuentas corrientes:', error);
    throw error;
  }
};

export const getCuentaCorrienteById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: { ...getAuthHeaders() },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener la cuenta corriente:', error);
    throw error;
  }
};

export const getCuentasByCliente = async (clienteId) => {
  try {
    const response = await axios.get(`${API_URL}/cliente/${clienteId}`, {
      headers: { ...getAuthHeaders() },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener cuentas del cliente:', error);
    throw error;
  }
};

export const updateEstadoCuenta = async (id, estado) => {
  try {
    const response = await axios.put(
      `${API_URL}/${id}/estado`,
      { estado },
      { headers: { ...getAuthHeaders() }, withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el estado de la cuenta:', error);
    throw error;
  }
};

export const getMisCuentasCorrientes = async () => {
  try {
    const response = await axios.get(`${API_URL}/mis-cuentas`, {
      headers: { ...getAuthHeaders() },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener mis cuentas corrientes:', error);
    throw error;
  }
};

export const registrarEntrega = async (cuentaId, data, archivo) => {
  try {
    let body;
    let headers = { ...getAuthHeaders() };

    if (archivo) {
      // Enviar como FormData cuando hay archivo adjunto
      body = new FormData();
      body.append('monto', data.monto);
      body.append('metodo_pago', data.metodo_pago);
      if (data.observaciones) body.append('observaciones', data.observaciones);
      if (data.extra) body.append('extra', JSON.stringify(data.extra));
      body.append('comprobante', archivo);
      // No poner Content-Type, axios lo setea automáticamente con boundary
    } else {
      body = data;
      headers['Content-Type'] = 'application/json';
    }

    const response = await axios.post(
      `${API_URL}/${cuentaId}/entrega`,
      body,
      { headers, withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error al registrar la entrega:', error);
    throw error;
  }
};

export const getPagosCuenta = async (cuentaId) => {
  try {
    const response = await axios.get(`${API_URL}/${cuentaId}/pagos`, {
      headers: { ...getAuthHeaders() },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener los pagos de la cuenta:', error);
    throw error;
  }
};

export const getComprobanteUrl = (pagoId) => {
  return `${API_URL}/pago/${pagoId}/comprobante`;
};

export const descargarComprobante = async (pagoId) => {
  try {
    const response = await axios.get(`${API_URL}/pago/${pagoId}/comprobante`, {
      headers: { ...getAuthHeaders() },
      withCredentials: true,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error al descargar el comprobante:', error);
    throw error;
  }
};

