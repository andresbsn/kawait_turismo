import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const baseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;
const API_URL = `${baseUrl}/api/reportes`;

const getAuthHeaders = () => {
  try {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
};

export const getReporteFinanzas = async (filtros = {}) => {
  const response = await axios.get(`${API_URL}/finanzas`, {
    params: filtros,
    headers: { ...getAuthHeaders() },
    withCredentials: true
  });
  return response.data;
};
