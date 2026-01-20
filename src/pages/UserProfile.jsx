import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Input,
  Badge,
  Table,
  Alert,
  Spinner
} from '../components'
import api from '../services/api' // ← IMPORTAR API
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import './UserProfile.css'

const UserProfile = () => {
  const { success, error: showError } = useNotification()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: ''
  })
  const [purchases, setPurchases] = useState([])
  const [achievements] = useState([
    {
      id: 1,
      name: 'Primer Evento',
      description: 'Asististe a tu primer evento',
      icon: '🎉',
      unlocked: true
    },
    {
      id: 2,
      name: 'Fan de la Música',
      description: 'Asiste a 5 conciertos',
      icon: '🎵',
      unlocked: false
    },
    {
      id: 3,
      name: 'Explorador',
      description: 'Visita eventos de 3 categorías diferentes',
      icon: '🗺️',
      unlocked: false
    },
    {
      id: 4,
      name: 'VIP',
      description: 'Compra 10 boletos en total',
      icon: '⭐',
      unlocked: false
    }
  ])

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // ✅ OBTENER PERFIL DEL USUARIO
      console.log('📤 Obteniendo perfil del usuario...')
      const profileResponse = await api.user.getProfile()
      console.log('✅ Perfil obtenido:', profileResponse)

      setProfileData({
        firstName:
          profileResponse.firstName || profileResponse.first_name || '',
        lastName: profileResponse.lastName || profileResponse.last_name || '',
        email: profileResponse.email || '',
        phone: profileResponse.phone || '',
        birthDate: profileResponse.birthDate || profileResponse.birth_date || ''
      })

      // ✅ OBTENER BOLETOS/COMPRAS DEL USUARIO
      console.log('📤 Obteniendo boletos del usuario...')
      const ticketsResponse = await api.ticket.getMyTickets()
      console.log('✅ Boletos obtenidos:', ticketsResponse)

      // Transformar boletos a formato de compras
      const purchasesData = ticketsResponse.map(ticket => ({
        id: ticket.id,
        eventName: ticket.event?.name || ticket.eventName || 'Evento',
        date: ticket.event?.date || ticket.event?.event_date || ticket.date,
        tickets: 1, // Cada ticket es una compra
        total: ticket.price || 0,
        status: ticket.status === 'active' ? 'confirmed' : ticket.status,
        ticketCode:
          ticket.ticket_code || ticket.ticketCode || `TKT-${ticket.id}`
      }))

      setPurchases(purchasesData)
    } catch (error) {
      console.error('❌ Error al cargar datos del usuario:', error)
      showError('Error al cargar información del perfil')

      // Si hay usuario en el contexto, usar esos datos como fallback
      if (currentUser) {
        setProfileData({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          birthDate: ''
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = e => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      console.log('📤 Actualizando perfil:', profileData)

      // ✅ ACTUALIZAR PERFIL CON API REAL
      const response = await api.user.updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        birth_date: profileData.birthDate
      })

      console.log('✅ Perfil actualizado:', response)

      setAlert({ type: 'success', message: 'Perfil actualizado exitosamente' })
      success('Perfil actualizado')
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error)
      const errorMsg = error.message || 'Error al actualizar el perfil'
      setAlert({ type: 'error', message: errorMsg })
      showError(errorMsg)
    }
  }

  const handleChangePassword = async () => {
    // TODO: Implementar modal de cambio de contraseña
    showError('Función de cambio de contraseña no implementada aún')
  }

  const purchaseColumns = [
    { key: 'eventName', header: 'Evento', sortable: true },
    {
      key: 'date',
      header: 'Fecha',
      render: value =>
        value ? new Date(value).toLocaleDateString('es-MX') : '-'
    },
    { key: 'ticketCode', header: 'Código' },
    {
      key: 'total',
      header: 'Total',
      render: value => `$${(value || 0).toLocaleString('es-MX')}`
    },
    {
      key: 'status',
      header: 'Estado',
      render: value => {
        const statusMap = {
          confirmed: 'Confirmado',
          active: 'Activo',
          used: 'Usado',
          cancelled: 'Cancelado',
          refunded: 'Reembolsado'
        }

        const variantMap = {
          confirmed: 'success',
          active: 'success',
          used: 'default',
          cancelled: 'danger',
          refunded: 'warning'
        }

        return (
          <Badge variant={variantMap[value] || 'default'}>
            {statusMap[value] || value}
          </Badge>
        )
      }
    }
  ]

  if (loading) {
    return <Spinner fullScreen text='Cargando perfil...' />
  }

  return (
    <div className='user-profile'>
      <div className='profile-header'>
        <div className='profile-avatar'>
          <span className='avatar-icon'>👤</span>
        </div>
        <div className='profile-info'>
          <h1>
            {profileData.firstName} {profileData.lastName}
          </h1>
          <p>{profileData.email}</p>
          <Badge variant='primary'>Usuario</Badge>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          closable
          onClose={() => setAlert(null)}
        />
      )}

      <div className='profile-tabs'>
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Mi Perfil
        </button>
        <button
          className={`tab ${activeTab === 'purchases' ? 'active' : ''}`}
          onClick={() => setActiveTab('purchases')}
        >
          Mis Compras
        </button>
        <button
          className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Logros
        </button>
      </div>

      <div className='profile-content'>
        {activeTab === 'profile' && (
          <Card title='Información Personal'>
            <div className='profile-form'>
              <div className='form-row'>
                <Input
                  label='Nombre'
                  name='firstName'
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  fullWidth
                />
                <Input
                  label='Apellido'
                  name='lastName'
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  fullWidth
                />
              </div>

              <Input
                label='Email'
                type='email'
                name='email'
                value={profileData.email}
                onChange={handleInputChange}
                fullWidth
                disabled
                helperText='El email no se puede modificar'
              />

              <Input
                label='Teléfono'
                type='tel'
                name='phone'
                value={profileData.phone}
                onChange={handleInputChange}
                fullWidth
              />

              <Input
                label='Fecha de Nacimiento'
                type='date'
                name='birthDate'
                value={profileData.birthDate}
                onChange={handleInputChange}
                fullWidth
              />

              <div className='form-actions'>
                <Button variant='primary' onClick={handleSaveProfile}>
                  Guardar Cambios
                </Button>
                <Button variant='secondary' onClick={handleChangePassword}>
                  Cambiar Contraseña
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'purchases' && (
          <Card title='Historial de Compras'>
            <div className='purchases-stats'>
              <div className='stat-box'>
                <span className='stat-icon'>🎫</span>
                <div>
                  <p className='stat-label'>Total de Boletos</p>
                  <h3 className='stat-value'>{purchases.length}</h3>
                </div>
              </div>
              <div className='stat-box'>
                <span className='stat-icon'>💰</span>
                <div>
                  <p className='stat-label'>Gastado Total</p>
                  <h3 className='stat-value'>
                    $
                    {purchases
                      .reduce((sum, p) => sum + (p.total || 0), 0)
                      .toLocaleString('es-MX')}
                  </h3>
                </div>
              </div>
            </div>

            {purchases.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>No tienes boletos comprados</p>
                <Button
                  variant='primary'
                  onClick={() => (window.location.href = '/')}
                >
                  Ver Eventos Disponibles
                </Button>
              </div>
            ) : (
              <Table
                columns={purchaseColumns}
                data={purchases}
                sortable
                hoverable
                striped
              />
            )}
          </Card>
        )}

        {activeTab === 'achievements' && (
          <Card title='Mis Logros'>
            <div className='achievements-grid'>
              {achievements.map(achievement => {
                // Calcular si el logro debe estar desbloqueado basado en datos reales
                let isUnlocked = achievement.unlocked

                // Lógica simple de desbloqueo basada en compras
                if (achievement.id === 1 && purchases.length > 0) {
                  isUnlocked = true
                } else if (achievement.id === 4 && purchases.length >= 10) {
                  isUnlocked = true
                }

                return (
                  <div
                    key={achievement.id}
                    className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                  >
                    <div className='achievement-icon'>{achievement.icon}</div>
                    <h4 className='achievement-name'>{achievement.name}</h4>
                    <p className='achievement-description'>
                      {achievement.description}
                    </p>
                    {isUnlocked ? (
                      <Badge variant='success'>Desbloqueado</Badge>
                    ) : (
                      <Badge variant='default'>Bloqueado</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default UserProfile
