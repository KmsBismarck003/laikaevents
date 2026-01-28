import React from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import { NotificationProvider } from './context/NotificationContext'
import { AuthProvider } from './context/AuthContext'

// Páginas
import {
  Home,
  Login,
  Register,
  AdminDashboard,
  EventManagerDashboard,
  StaffDashboard,
  UserProfile,
  EventDetail,
  Maintenance
} from './pages'

// Componentes
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PrivateRoute from './components/PrivateRoute'
import DatabaseMonitor from './components/DatabaseMonitor'
import ErrorBoundary from './components/ErrorBoundary'

// Estilos
import './styles/globals.css'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        {/* ✅ AuthProvider DENTRO de Router */}
        <AuthProvider>
          <NotificationProvider>
            <div className='app'>
              <Navbar />
              <main className='main-content'>
                <Routes>
                  <Route path='/' element={<Home />} />
                  <Route path='/login' element={<Login />} />
                  <Route path='/register' element={<Register />} />
                  <Route path='/events/:id' element={<EventDetail />} />
                  <Route path='/maintenance' element={<Maintenance />} />

                  <Route
                    path='/admin'
                    element={
                      <PrivateRoute roles={['admin']}>
                        <AdminDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path='/admin/database-monitor'
                    element={
                      <PrivateRoute roles={['admin']}>
                        <DatabaseMonitor />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path='/gestor'
                    element={
                      <PrivateRoute roles={['admin', 'gestor']}>
                        <EventManagerDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path='/operador'
                    element={
                      <PrivateRoute roles={['admin', 'operador']}>
                        <StaffDashboard />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path='/profile'
                    element={
                      <PrivateRoute>
                        <UserProfile />
                      </PrivateRoute>
                    }
                  />

                  <Route path='*' element={<Navigate to='/' replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
