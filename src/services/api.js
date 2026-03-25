/**
 * API Service - Puente central modularizado
 */
import api from './index';

export const {
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
  manager: managerAPI,
  venue: venueAPI,
  stats: statsAPI,
  achievements: achievementsAPI,
  analytics: analyticsAPI,
  ticker: tickerAPI
} = api;

export default api;
