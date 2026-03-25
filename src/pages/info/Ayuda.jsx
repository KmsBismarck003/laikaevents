import React from 'react'
import InfoLayout from './InfoLayout'
import { Link } from 'react-router-dom'

const Ayuda = () => {
  return (
    <InfoLayout title="Centro de Ayuda">
      <div className="info-section">
        <p>
          Bienvenido al Centro de Ayuda de LaikaEvents. Aquí encontrarás recursos para resolver tus dudas y aprovechar al máximo nuestra plataforma.
        </p>
      </div>

      <div className="info-section">
        <h3>¿Necesitas asistencia inmediata?</h3>
        <p>
          Si tienes un problema urgente con tu compra o acceso a un evento, por favor contáctanos directamente.
        </p>
        <Link to="/info/contacto" className="btn-link">Ir a Contacto</Link>
      </div>

      <div className="info-section">
        <h3>Temas Populares</h3>
        <ul>
          <li><Link to="/info/faq">Preguntas Frecuentes</Link></li>
          <li><Link to="/info/devoluciones">Política de Devoluciones</Link></li>
          <li><Link to="/info/soporte">Soporte Técnico</Link></li>
        </ul>
      </div>

      <div className="info-section">
        <h3>Guías de Usuario</h3>
        <ul>
          <li>Cómo comprar un boleto</li>
          <li>Cómo transferir boletos a un amigo</li>
          <li>Cómo acceder al evento con tu boleto digital</li>
        </ul>
      </div>
    </InfoLayout>
  )
}

export default Ayuda
