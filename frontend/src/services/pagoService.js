import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/pagos`;

const getAuthHeaders = () => {
  try {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
};

export const getComprobantePdf = async (pagoId, { download = false } = {}) => {
  const response = await axios.get(`${API_URL}/comprobante/${pagoId}`, {
    params: download ? { download: 'true' } : {},
    responseType: 'blob',
    headers: { ...getAuthHeaders() },
    withCredentials: true
  });

  return response.data;
};
