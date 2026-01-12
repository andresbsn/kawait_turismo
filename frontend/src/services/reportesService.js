import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/reportes`;

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
