import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import {
  AuthProvider,
  ThemeProvider,
  NotificationProvider,
  CartProvider,
  SystemProvider
} from './context'
import { MainLayout, AuthLayout, DashboardLayout } from './layouts'
import {
  Home,
  Login,
  Register,
  UserProfile,
  UserLayout,
  UserDashboard,
  UserTickets,
  UserHistory,
  UserCart,
  Achievements,
  EventManagerDashboard,
  StaffDashboard,
  ManagerEventDetail,
  RefundRequest,
  Maintenance
} from './pages'
import { adminRoutes, publicRoutes } from './routes'
import ProtectedRoute from './components/ProtectedRoute'
import NotificationContainer from './components/NotificationContainer'
import DatabaseMonitor from './components/DatabaseMonitor'
import EventDetail from './pages/EventDetail'
import SessionManager from './components/SessionManager'
import MaintenanceGuard from './components/MaintenanceGuard'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/globals.css'
import './styles/theme.css'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SystemProvider>
          <NotificationProvider>
            <CartProvider>
              <div className='App'>
                <ErrorBoundary>
                    <SessionManager />
                    <ScrollToTop />
                    <MaintenanceGuard>
                      <Routes>
                        <Route path='/maintenance' element={<Maintenance />} />
                        {/* Rutas de Autenticación - SIN AuthLayout anidado */}
                        <Route path='/login' element={<Login />} />
                        <Route path='/register' element={<Register />} />

                {/* Rutas Públicas y de Usuario */}
                <Route element={<MainLayout />}>
                  {/* Public Routes from configuration */}
                  {publicRoutes.filter(route => route.layout === 'main').map((route, index) => {
                    const Component = route.element
                    return (
                      <Route
                        key={`public-${index}`}
                        path={route.path}
                        element={<Component />}
                      />
                    )
                  })}

                  {/* Specific routes not in publicRoutes config yet */}
                  <Route path='/event/:id' element={<EventDetail />} />
                </Route>

                {/* NUEVAS Rutas de Usuario */}
                <Route path='/user' element={
                  <ProtectedRoute>
                    <UserLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/user/dashboard" replace />} />
                  <Route path='dashboard' element={<UserDashboard />} />
                  <Route path='tickets' element={<UserTickets />} />
                  <Route path='history' element={<UserHistory />} />
                  <Route path='cart' element={<UserCart />} />
                  <Route path='profile' element={<UserProfile />} />
                  <Route path='achievements' element={<Achievements />} />
                  <Route path='refunds' element={<RefundRequest />} />
                </Route>

                {/* Redirect old profile route */}
                <Route path='/profile' element={<Navigate to="/user/profile" replace />} />

                {/* Rutas de Dashboard */}
                <Route element={<DashboardLayout />}>
                  {/* Manager Routes - Explicitly added here to ensure they work */}
                  <Route path='/events/manage/:id' element={
                    <ProtectedRoute allowedRoles={['gestor', 'admin']}>
                      <ManagerEventDetail />
                    </ProtectedRoute>
                  } />

                  {/* Rutas de Admin Dinámicas */}
                  {adminRoutes.map((route, index) => {
                    const Component = route.element
                    return (
                      <Route
                        key={index}
                        path={route.path}
                        element={
                          <ProtectedRoute allowedRoles={route.allowedRoles}>
                            <Component />
                          </ProtectedRoute>
                        }
                      />
                    )
                  })}

                  {/* Admin - Monitor de Base de Datos (Legacy/Specific) */}
                  <Route
                    path='/admin/database-monitor'
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <DatabaseMonitor />
                      </ProtectedRoute>
                    }
                  />

                  {/* Gestor */}
                  <Route
                    path='/events/manage'
                    element={
                      <ProtectedRoute allowedRoles={['gestor', 'admin']}>
                        <EventManagerDashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Operador */}
                  <Route
                    path='/staff'
                    element={
                      <ProtectedRoute allowedRoles={['operador', 'admin']}>
                        <StaffDashboard />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Redirect */}
                <Route path='*' element={<Navigate to='/' replace />} />
                </Routes>
                  </MaintenanceGuard>
                </ErrorBoundary>

              {/* Contenedor de Notificaciones */}
              <NotificationContainer />
            </div>
          </CartProvider>
        </NotificationProvider>
      </SystemProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
