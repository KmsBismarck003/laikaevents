import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import {
  AuthProvider,
  useAuth,
  ThemeProvider,
  NotificationProvider,
  CartProvider,
  SystemProvider,
  SkeletonProvider
} from './context'
import { MainLayout, AuthLayout, DashboardLayout } from './layouts'
import {
  Home,
  Login,
  Register,
  UserProfile,
  UserLayout,
  UserDashboard,
  UserWallet,
  UserHistory,
  UserCart,
  Achievements,
  EventManagerDashboard,
  StaffDashboard,
  WelcomePortal,
  ManagerEventDetail,
  ManagerAnalytics,
  ManagerTransactions,
  ManagerAttendees,
  StaffIncidents,
  RefundTracker,
  Maintenance,
  Checkout
} from './pages'
import { adminRoutes, publicRoutes } from './routes'
import ProtectedRoute from './components/ProtectedRoute'
import NotificationContainer from './components/NotificationContainer'
import DatabaseMonitor from './components/DatabaseMonitor'
import SessionManager from './components/SessionManager'
import MaintenanceGuard from './components/MaintenanceGuard'
import ErrorBoundary from './components/ErrorBoundary'
import { CartModal } from './components/Cart'
import { LoadingScreen } from './components'
// Estilos globales movidos a index.js para control de precedencia

const EventDetail = lazy(() => import('./pages/EventDetail/EventDetail'))

function AppContent() {
  const { loading, loggingOut } = useAuth()

  if (loading) return <LoadingScreen />;
  if (loggingOut) return <LoadingScreen label="CERRANDO SESIÓN" status="GUARDANDO DATOS DE SESIÓN..." />;

  return (
    <div className='App'>
      <ErrorBoundary>
        <SessionManager />
        <ScrollToTop />
        <MaintenanceGuard>
          <SkeletonProvider minDuration={0}>
            <Suspense fallback={null}>
              <Routes>
                <Route path='/maintenance' element={<Maintenance />} />
                {/* ... existing routes ... */}
                {/* Rutas de Autenticación - SIN AuthLayout anidado */}
                {/* Rutas Públicas y de Usuario */}
                <Route element={<MainLayout />}>
                  {/* Rutas de Autenticación */}
                  <Route path='/login' element={<Login />} />
                  <Route path='/register' element={<Register />} />

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
                  <Route path='/checkout' element={<Checkout />} />
                  <Route path='/cart' element={<UserCart />} />
                </Route>

                {/* NUEVAS Rutas de Usuario - PROTEGIDAS CONTRA ADN FAN */}
                <Route path='/user' element={
                  <ProtectedRoute allowedRoles={['usuario']}>
                    <UserLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/user/dashboard" replace />} />
                  <Route path='dashboard' element={<UserDashboard />} />
                  <Route path='tickets' element={<UserWallet />} />
                  <Route path='history' element={<UserHistory />} />
                  <Route path='history' element={<UserHistory />} />
                  <Route path='profile' element={<UserProfile />} />
                  <Route path='achievements' element={<Achievements />} />
                  <Route path='refunds' element={<RefundTracker />} />
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



                  {/* Admin - Monitor de Base de Datos (Sistema/Específico) */}
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

                  {/* Gestor Avanzado */}
                  <Route path='/manager/analytics' element={
                    <ProtectedRoute allowedRoles={['gestor', 'admin']}>
                      <ManagerAnalytics />
                    </ProtectedRoute>
                  } />
                  <Route path='/manager/transactions' element={
                    <ProtectedRoute allowedRoles={['gestor', 'admin']}>
                      <ManagerTransactions />
                    </ProtectedRoute>
                  } />
                  <Route path='/manager/attendees' element={
                    <ProtectedRoute allowedRoles={['gestor', 'admin']}>
                      <ManagerAttendees />
                    </ProtectedRoute>
                  } />

                  {/* Operador */}
                  <Route
                    path='/staff'
                    element={
                      <ProtectedRoute allowedRoles={['operador', 'admin']}>
                        <StaffDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path='/staff/incidents'
                    element={
                      <ProtectedRoute allowedRoles={['operador', 'admin']}>
                        <StaffIncidents />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Welcome Portal - Standalone */}
                <Route
                  path='/welcome'
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'gestor', 'operador']}>
                      <WelcomePortal />
                    </ProtectedRoute>
                  }
                />

                {/* Redirect */}
                <Route path='*' element={<Navigate to='/' replace />} />
              </Routes>
            </Suspense>
          </SkeletonProvider>
        </MaintenanceGuard>
      </ErrorBoundary>

      <CartModal />
      <NotificationContainer />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SystemProvider>
          <NotificationProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </NotificationProvider>
        </SystemProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
