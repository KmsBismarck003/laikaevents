/**
 * Services - Punto de entrada para todos los servicios de API
 */

import api from './api';

// Exportar API completa por defecto
export default api;

// Exportar servicios individuales
export {
  authAPI,
  userAPI,
  eventAPI,
  ticketAPI,
  statsAPI,
  configAPI,
  databaseAPI,
  monitoringAPI,
  notificationAPI,
  paymentAPI
} from './api';

// Exportar configuraciones de base de datos (solo referencia)
export { MYSQL_CONFIG, MONGODB_CONFIG } from './database.config';
