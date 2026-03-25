import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSystem } from '../../context/SystemContext'
import './Maintenance.css'
import { Icon } from '../../components'

const Maintenance = () => {
  const { isRestored, isHardLocked } = useSystem()
  const navigate = useNavigate()

  useEffect(() => {
    if (isRestored && !isHardLocked) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true })
        window.location.reload()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isRestored, isHardLocked, navigate])

  if (isRestored && !isHardLocked) {
    return (
      <div className='maintenance-page restored'>
        <div className='maintenance-content'>
          <div className='maintenance-icon success'>✅</div>
          <h1>¡Sistema Restaurado!</h1>
          <p>El mantenimiento ha finalizado. Redirigiendo al inicio...</p>
          <div className='progress-bar'>
            <div className='progress-fill'></div>
          </div>
        </div>
      </div>
    )
  }

  if (isHardLocked) {
    return (
      <div className='maintenance-page lockdown'>
        <div className='maintenance-content'>
          <div className='maintenance-icon security'>🚨</div>
          <h1 style={{ color: '#FF3B30' }}>ACCESO DENEGADO</h1>
          <p style={{ fontWeight: 900, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            EL SISTEMA ESTÁ EN MANTENIMIENTO <br />
            PROTOCOLOD DE INVIERNO NIVEL 5 ACTIVADO
          </p>
          <p className='maintenance-footer' style={{ color: '#000', opacity: 0.8 }}>
            VUELVA PRONTO. ACCESO RESTRINGIDO POR SEGURIDAD NACIONAL.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='maintenance-page'>
      <div className='maintenance-content'>
        <div className='maintenance-icon'>🔧</div>
        <h1>Sistema en Mantenimiento</h1>
        <p>
          Estamos realizando mejoras en el sistema. <br />
          Por favor, espera un momento.
        </p>
        <p className='maintenance-footer'>
          El sistema se recargará automáticamente cuando terminemos.
        </p>
      </div>
    </div>
  )
}

export default Maintenance
