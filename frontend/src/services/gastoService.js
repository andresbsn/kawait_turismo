import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const baseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl.slice(0, -4) : rawBaseUrl;
const API_URL = `${baseUrl}/api/gastos`;

const getAuthHeaders = () => {
    try {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
        return {};
    }
};

const gastoService = {
    /**
     * Obtener todos los gastos (paginados con filtros)
     */
    async getGastos(params = {}) {
        const response = await axios.get(API_URL, {
            headers: getAuthHeaders(),
            params
        });
        return response.data;
    },

    /**
     * Obtener un gasto por ID
     */
    async getGasto(id) {
        const response = await axios.get(`${API_URL}/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Crear un nuevo gasto
     */
    async crearGasto(data) {
        const response = await axios.post(API_URL, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Actualizar un gasto
     */
    async actualizarGasto(id, data) {
        const response = await axios.put(`${API_URL}/${id}`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Marcar un gasto como pagado
     */
    async marcarPagado(id, data = {}) {
        const response = await axios.patch(`${API_URL}/${id}/pagar`, data, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Eliminar un gasto
     */
    async eliminarGasto(id) {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    },

    /**
     * Obtener resumen de gastos
     */
    async getResumen(params = {}) {
        const response = await axios.get(`${API_URL}/resumen`, {
            headers: getAuthHeaders(),
            params
        });
        return response.data;
    }
};

export default gastoService;
