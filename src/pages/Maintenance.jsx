import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSystem } from '../context/SystemContext'
import './Maintenance.css'
import { Icon } from '../components' // Assuming you have Icon component

const Maintenance = () => {
  const { isRestored } = useSystem()
  const navigate = useNavigate()

  useEffect(() => {
    if (isRestored) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true })
        // Could also force window.location.reload() to clear any stale state
        window.location.reload()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isRestored, navigate])

  if (isRestored) {
      return (
        <div className='maintenance-page restored'>
          <div className='maintenance-content'>
            <div className='maintenance-icon success'>✅</div>
            <h1>¡Sistema Restaurado!</h1>
            <p>
              El mantenimiento ha finalizado. Redirigiendo al inicio...
            </p>
            <div className='progress-bar'>
                <div className='progress-fill'></div>
            </div>
          </div>
        </div>
      )
  }

  return (
    <div className='maintenance-page'>
      <div className='maintenance-content'>
        <div className='maintenance-icon pulse'>🔧</div>
        <h1>Sistema en Mantenimiento</h1>
        <p>
          Estamos realizando mejoras en el sistema. <br/>
          Por favor, espera un momento.
        </p>
        <div className='maintenance-spinner'></div>
        <p className='maintenance-footer'>
           El sistema se recargará automáticamente cuando terminemos.
        </p>
      </div>
    </div>
  )
}

export default Maintenance
