import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/cuotas`;

const getAuthHeaders = () => {
  try {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
};

export const registrarPagoCuota = async (id, pagoData) => {
  try {
    const response = await axios.post(
      `${API_URL}/${id}/pagar`,
      pagoData,
      { headers: { ...getAuthHeaders() }, withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error al registrar el pago:', error);
    throw error;
  }
};

export const actualizarCuota = async (id, datosActualizados) => {
  try {
    const response = await axios.put(
      `${API_URL}/${id}`,
      datosActualizados,
      { headers: { ...getAuthHeaders() }, withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error al actualizar la cuota:', error);
    throw error;
  }
};
