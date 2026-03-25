/**
 * Services - Punto de entrada para todos los servicios de API
 */

import { authAPI } from './authService';
import { userAPI } from './userService';
import { eventAPI } from './eventService';
import { ticketAPI, paymentAPI, refundAPI } from './ticketService';
import { databaseAPI, monitoringAPI, logsAPI, adminUsersAPI, restoreAuditAPI, configAPI } from './adminService';
import { pagesAPI, adsAPI, notificationAPI, tickerAPI } from './contentService';
import { managerAPI, venueAPI } from './managerService';
import { statsAPI, achievementsAPI, analyticsAPI } from './miscService';

// Exportar servicios individuales
export {
  authAPI,
  userAPI,
  eventAPI,
  ticketAPI,
  paymentAPI,
  refundAPI,
  databaseAPI,
  monitoringAPI,
  logsAPI,
  adminUsersAPI,
  restoreAuditAPI,
  configAPI,
  pagesAPI,
  adsAPI,
  notificationAPI,
  tickerAPI,
  managerAPI,
  venueAPI,
  statsAPI,
  achievementsAPI,
  analyticsAPI
};

// Objeto API consolidado para retrocompatibilidad
const api = {
  auth: authAPI,
  user: userAPI,
  event: eventAPI,
  ticket: ticketAPI,
  payment: paymentAPI,
  refund: refundAPI,
  database: databaseAPI,
  monitoring: monitoringAPI,
  logs: logsAPI,
  adminUsers: adminUsersAPI,
  restoreAudit: restoreAuditAPI,
  config: configAPI,
  pages: pagesAPI,
  ads: adsAPI,
  notification: notificationAPI,
  ticker: tickerAPI,
  manager: managerAPI,
  venue: venueAPI,
  stats: statsAPI,
  achievements: achievementsAPI,
  analytics: analyticsAPI
};

export default api;

// Exportar configuraciones de base de datos
export { MYSQL_CONFIG, MONGODB_CONFIG } from './database.config';
