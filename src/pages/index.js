export { default as Home } from './Home'
export { default as Login } from './Login'
export { default as Register } from './Register'
// export { default as UserProfile } from './UserProfile' // Deprecated
export { default as EventManagerDashboard } from './EventManagerDashboard'
// export { default as StaffDashboard } from './StaffDashboard' // Old version
export { default as StaffDashboard } from './staff/StaffDashboard' // New Modular Version
export { default as EventDetail } from './EventDetail'
export { default as Maintenance } from './Maintenance'
export { default as DynamicPage } from './info/DynamicPage'
export { default as UnifiedPage } from './content/UnifiedPage'

// New User Module
export { default as UserLayout } from './user/UserLayout'
export { default as UserDashboard } from './user/UserDashboard'
export { default as UserTickets } from './user/UserTickets'
export { default as UserHistory } from './user/UserHistory'
export { default as UserCart } from './user/UserCart'
export { default as UserProfile } from './user/UserProfile'
export { default as Achievements } from './user/Achievements'
export { default as RefundRequest } from './user/RefundRequest'

// New Manager Module
export { default as EventList } from './manager/EventList'
export { default as ManagerEventDetail } from './manager/EventDetail'

// Info Pages
export * from './info'
