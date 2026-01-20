import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {
  AuthProvider,
  ThemeProvider,
  NotificationProvider,
  CartProvider
} from './context'
import { MainLayout, AuthLayout, DashboardLayout } from './layouts'
import {
  Home,
  Login,
  Register,
  UserProfile,
  AdminDashboard,
  EventManagerDashboard,
  StaffDashboard
} from './pages'
import ProtectedRoute from './components/ProtectedRoute'
import NotificationContainer from './components/NotificationContainer'
import './styles/globals.css'

import EventDetail from './pages/EventDetail' // ← AGREGAR IMPORT

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <div className='App'>
              <Routes>
                {/* Rutas de Autenticación - SIN AuthLayout anidado */}
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />

                {/* Rutas Públicas y de Usuario */}
                <Route element={<MainLayout />}>
                  <Route path='/' element={<Home />} />
                  <Route path='/event/:id' element={<EventDetail />} />{' '}
                  {/* ← AGREGAR */}
                  <Route
                    path='/profile'
                    element={
                      <ProtectedRoute>
                        <UserProfile />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Rutas de Dashboard */}
                <Route element={<DashboardLayout />}>
                  {/* Admin */}
                  <Route
                    path='/admin'
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboard />
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

              {/* Contenedor de Notificaciones */}
              <NotificationContainer />
            </div>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
