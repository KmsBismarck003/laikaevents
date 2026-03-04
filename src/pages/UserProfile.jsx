import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Button,
  Input,
  Badge,
  Table,
  Alert,
  Spinner,
  Icon
} from '../components'
import api from '../services/api'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import './UserProfile.css'

const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:8000'

const UserProfile = () => {
  const { success, error: showError } = useNotification()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef(null)
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    profilePhoto: ''
  })
  const [purchases, setPurchases] = useState([])
  const [achievements] = useState([
    {
      id: 1,
      name: 'Primer Evento',
      description: 'Asististe a tu primer evento',
      icon: 'sparkles',
      unlocked: true
    },
    {
      id: 2,
      name: 'Fan de la Musica',
      description: 'Asiste a 5 conciertos',
      icon: 'music',
      unlocked: false
    },
    {
      id: 3,
      name: 'Explorador',
      description: 'Visita eventos de 3 categorias diferentes',
      icon: 'map',
      unlocked: false
    },
    {
      id: 4,
      name: 'VIP',
      description: 'Compra 10 boletos en total',
      icon: 'star',
      unlocked: false
    }
  ])

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const profileResponse = await api.user.getProfile()

      setProfileData({
        firstName:
          profileResponse.firstName || profileResponse.first_name || '',
        lastName: profileResponse.lastName || profileResponse.last_name || '',
        email: profileResponse.email || '',
        phone: profileResponse.phone || '',
        birthDate: profileResponse.birthDate || profileResponse.birth_date || '',
        profilePhoto: profileResponse.profile_photo || profileResponse.profilePhoto || ''
      })

      try {
        const ticketsResponse = await api.ticket.getMyTickets()

        const purchasesData = ticketsResponse.map(ticket => ({
          id: ticket.id,
          eventName: ticket.event?.name || ticket.eventName || 'Evento',
          date: ticket.event?.date || ticket.event?.event_date || ticket.date,
          tickets: 1,
          total: ticket.price || 0,
          status: ticket.status === 'active' ? 'confirmed' : ticket.status,
          ticketCode:
            ticket.ticket_code || ticket.ticketCode || `TKT-${ticket.id}`
        }))

        setPurchases(purchasesData)
      } catch {
        setPurchases([])
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error)
      showError('Error al cargar informacion del perfil')

      if (currentUser) {
        setProfileData({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          phone: currentUser.phone || '',
          birthDate: '',
          profilePhoto: ''
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
      const response = await api.user.updateProfile({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        email: profileData.email,
        phone: profileData.phone,
        birth_date: profileData.birthDate
      })

      setAlert({ type: 'success', message: 'Perfil actualizado exitosamente' })
      success('Perfil actualizado')
    } catch (error) {
      const errorMsg = error.message || 'Error al actualizar el perfil'
      setAlert({ type: 'error', message: errorMsg })
      showError(errorMsg)
    }
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar en frontend
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      showError('Formato no permitido. Usa JPG, PNG o WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showError('La imagen no debe superar 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const response = await api.user.uploadPhoto(file)
      setProfileData(prev => ({ ...prev, profilePhoto: response.photo_url }))
      success('Foto de perfil actualizada')
    } catch (error) {
      const errorMsg = error.message || 'Error al subir la foto'
      showError(errorMsg)
    } finally {
      setUploadingPhoto(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async () => {
    try {
      await api.user.deletePhoto()
      setProfileData(prev => ({ ...prev, profilePhoto: '' }))
      success('Foto de perfil eliminada')
    } catch (error) {
      showError('Error al eliminar la foto')
    }
  }

  const handleChangePassword = async () => {
    showError('Funcion de cambio de contrasena no implementada aun')
  }

  const getInitials = () => {
    const f = profileData.firstName?.[0] || ''
    const l = profileData.lastName?.[0] || ''
    return (f + l).toUpperCase() || 'U'
  }

  const getPhotoUrl = () => {
    if (!profileData.profilePhoto) return null
    if (profileData.profilePhoto.startsWith('http')) return profileData.profilePhoto
    return `${API_HOST}${profileData.profilePhoto}`
  }

  const purchaseColumns = [
    { key: 'eventName', header: 'Evento', sortable: true },
    {
      key: 'date',
      header: 'Fecha',
      render: value =>
        value ? new Date(value).toLocaleDateString('es-MX') : '-'
    },
    { key: 'ticketCode', header: 'Codigo' },
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

  const photoUrl = getPhotoUrl()

  return (
    <div className='user-profile'>
      <div className='profile-header'>
        <div className='profile-avatar-container'>
          <div className='profile-avatar' onClick={handlePhotoClick} title='Cambiar foto de perfil'>
            {uploadingPhoto ? (
              <div className='avatar-loading'>
                <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className='spin-icon'>
                  <path d='M21 12a9 9 0 1 1-6.219-8.56' />
                </svg>
              </div>
            ) : photoUrl ? (
              <img src={photoUrl} alt='Foto de perfil' className='avatar-image' />
            ) : (
              <span className='avatar-initials'>{getInitials()}</span>
            )}
            <div className='avatar-overlay'>
              <Icon name="camera" size={20} className="text-white" />
            </div>
          </div>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept='image/jpeg,image/png,image/webp'
            style={{ display: 'none' }}
          />
          {profileData.profilePhoto && (
            <button className='remove-photo-btn' onClick={handleDeletePhoto} title='Eliminar foto'>
              <Icon name="trash" size={14} />
            </button>
          )}
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
          <Card title='Informacion Personal'>
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
                label='Telefono'
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
                  Cambiar Contrasena
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'purchases' && (
          <Card title='Historial de Compras'>
            <div className='purchases-stats'>
              <div className='stat-box'>
                <span className='stat-icon'>
                  <Icon name="ticket" size={24} />
                </span>
                <div>
                  <p className='stat-label'>Total de Boletos</p>
                  <h3 className='stat-value'>{purchases.length}</h3>
                </div>
              </div>
              <div className='stat-box'>
                <span className='stat-icon'>
                  <Icon name="dollarSign" size={24} />
                </span>
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
                let isUnlocked = achievement.unlocked

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
                    <div className='achievement-icon'>
                      <Icon name={achievement.icon} size={24} />
                    </div>
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
