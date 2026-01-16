// frontend/src/services/clienteService.js
import { apiClient } from '../config/api';

const clienteService = {
  /**
   * Obtiene la lista de clientes con paginación y búsqueda
   * @param {Object} params - Parámetros de consulta (page, limit, search)
   * @returns {Promise<Array>} Lista de clientes
   */
  async obtenerClientes(params = {}) {
    try {
      const response = await apiClient.get('/clientes', { params });
      return response.clientes || [];
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  },

  /**
   * Obtiene un cliente por su ID
   * @param {number|string} id - ID del cliente
   * @returns {Promise<Object>} Datos del cliente
   */
  async obtenerClientePorId(id) {
    try {
      const response = await apiClient.get(`/clientes/${id}`);
      return response;
    } catch (error) {
      console.error(`Error al obtener el cliente con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Crea un nuevo cliente
   * @param {Object} cliente - Datos del cliente a crear
   * @returns {Promise<Object>} Cliente creado
   */
  async crearCliente(cliente) {
    try {
      const response = await apiClient.post('/clientes', cliente);
      return response;
    } catch (error) {
      console.error('Error al crear el cliente:', error);
      throw error;
    }
  },

  /**
   * Actualiza un cliente existente
   * @param {number|string} id - ID del cliente a actualizar
   * @param {Object} cliente - Datos actualizados del cliente
   * @returns {Promise<Object>} Cliente actualizado
   */
  async actualizarCliente(id, cliente) {
    try {
      const response = await apiClient.put(`/clientes/${id}`, cliente);
      return response;
    } catch (error) {
      console.error(`Error al actualizar el cliente con ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un cliente
   * @param {number|string} id - ID del cliente a eliminar
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async eliminarCliente(id) {
    try {
      const response = await apiClient.delete(`/clientes/${id}`);
      return response;
    } catch (error) {
      console.error(`Error al eliminar el cliente con ID ${id}:`, error);
      throw error;
    }
  }
};

export default clienteService;
