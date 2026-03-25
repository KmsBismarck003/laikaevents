// Páginas Públicas
export { default as Home } from './Home/Home'
export { default as Login } from './Login/Login'
export { default as Register } from './Register/Register'
export { default as UserProfile } from './UserProfile/UserProfile'
export { default as EventDetail } from './EventDetail/EventDetail'
export { default as Maintenance } from './Maintenance/Maintenance'

// Dashboard de Organizador
export { default as EventManagerDashboard } from './EventManagerDashboard/EventManagerDashboard'

// Módulo de Staff
export { default as StaffDashboard } from './staff/StaffDashboard'
export { default as StaffTerminal } from './staff/StaffTerminal'
export { default as StaffHistory } from './staff/StaffHistory'
export { default as StaffIncidents } from './staff/StaffIncidents'

// Módulo de Usuario (Sub-páginas)
export { default as UserLayout } from './user/UserLayout'
export { default as UserDashboard } from './user/UserDashboard'
export { default as UserTickets } from './user/UserTickets'
export { default as UserHistory } from './user/UserHistory'
export { default as UserCart } from './user/UserCart'
export { default as Achievements } from './user/Achievements'
export { default as RefundRequest } from './user/RefundRequest'
export { default as UserWallet } from './user/UserWallet'
export { default as RefundTracker } from './user/RefundTracker'

// Módulo Admin (Consolidado)
export { default as AdminDashboard } from './admin/Dashboard/Dashboard'
export { default as WelcomePortal } from './admin/Dashboard/WelcomePortal'
export { default as AdminUsers } from './admin/Users/Users'
export { default as AdminEvents } from './admin/Events/Events'
export { default as AdminDatabase } from './admin/Database/Database'
export { default as AdminMonitoring } from './admin/Monitoring/Monitoring'
export { default as AdminLogs } from './admin/Logs/Logs'
export { default as AdminAds } from './admin/Ads/Ads'
export { default as AdminCMS } from './admin/CMS/CMS'
export { default as AdminConfig } from './admin/Config/Config'
export { default as AdminVenues } from './admin/Venues/Venues'
export { default as AdminSales } from './admin/SalesReports/SalesReports'
export { default as EmailManager } from './admin/EmailManager/EmailManager'
export { default as AuthAudit } from './admin/AuthAudit/AuthAudit'
export { default as RestoreAudit } from './admin/RestoreAudit/RestoreAudit'


// Módulo de Manager
export { default as EventList } from './manager/EventList'
export { default as ManagerEventDetail } from './manager/EventDetail'
export { default as ManagerStatsPage } from './manager/ManagerStatsPage'
export { default as ManagerAnalytics } from './manager/ManagerAnalytics'
export { default as ManagerTransactions } from './manager/ManagerTransactions'
export { default as ManagerAttendees } from './manager/ManagerAttendees'

// Otros
export { default as Checkout } from './Checkout/Checkout'
export { default as DynamicPage } from './info/DynamicPage'
export { default as UnifiedPage } from './content/UnifiedPage'
export * from './info'
