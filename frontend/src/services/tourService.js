import { apiClient } from '../config/api';

const tourService = {
  async obtenerTours(params = {}) {
    try {
      const response = await apiClient.get('/tours', { params });
      return response.data || [];
    } catch (error) {
      console.error('Error al obtener tours:', error);
      throw error;
    }
  },

  async obtenerTourPorId(id) {
    try {
      console.log(`[tourService] 🔄 Solicitando tour con ID: ${id}`);
      const response = await apiClient.get(`/tours/${id}`);
      console.log('response entera', response);
      
      console.log('[tourService] 📥 Respuesta del servidor:', {
        status: response.status,
        data: response.data
      });
      
      if (!response.data) {
        console.error('[tourService] ❌ La respuesta del servidor está vacía');
        throw new Error('No se recibieron datos del servidor');
      }
      
      if (!response.data.success) {
        const errorMsg = response.data.message || 'Error al obtener el tour';
        console.error('[tourService] ❌ Error en la respuesta:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!response.data.tour) {
        console.error('[tourService] ❌ No se encontraron datos del tour en la respuesta');
        throw new Error('No se encontraron datos del tour');
      }
      
      const tour = response.data.tour;
      
      // Asegurarse de que todos los campos necesarios estén presentes
      const tourCompleto = {
        id: tour.id,
        nombre: tour.nombre || '',
        descripcion: tour.descripcion || '',
        destino: tour.destino || '',
        fechaInicio: tour.fechaInicio || null,
        fechaFin: tour.fechaFin || null,
        precio: tour.precio || 0,
        cupoMaximo: tour.cupoMaximo || 1,
        estado: tour.estado || 'disponible',
        activo: tour.activo !== undefined ? tour.activo : true,
        imagenUrl: tour.imagenUrl || null,
        itinerario: tour.itinerario || '',
        createdAt: tour.createdAt,
        updatedAt: tour.updatedAt
      };
      
      console.log(`[tourService] ✅ Tour ${tourCompleto.id} cargado correctamente`);
      console.log('[tourService] 📊 Datos del tour formateados:', tourCompleto);
      
      return tourCompleto;
    } catch (error) {
      console.error(`[tourService] Error al obtener el tour con ID ${id}:`, error);
      if (error.response) {
        console.error('[tourService] Detalles del error del servidor:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      throw error;
    }
  },

  async crearTour(tour) {
    try {
      const response = await apiClient.post('/tours', tour);
      return response.data;
    } catch (error) {
      console.error('Error al crear el tour:', error);
      throw error;
    }
  },

  async actualizarTour(id, tour) {
    try {
      const response = await apiClient.put(`/tours/${id}`, tour);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el tour con ID ${id}:`, error);
      throw error;
    }
  },

  async eliminarTour(id) {
    try {
      const response = await apiClient.delete(`/tours/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el tour con ID ${id}:`, error);
      throw error;
    }
  },

  // Función para formatear fechas para los inputs de tipo date
  formatearFechaParaInput(fecha) {
    if (!fecha) return '';
    
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
  },
  
  // Función para formatear fechas para mostrar al usuario
  formatearFecha(fecha, incluirHora = false) {
    if (!fecha) return '';
    
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '';
    
    const opciones = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires'
    };
    
    if (incluirHora) {
      opciones.hour = '2-digit';
      opciones.minute = '2-digit';
    }
    
    return date.toLocaleDateString('es-AR', opciones);
  }
};

export default tourService;
