import React from 'react'
import InfoLayout from './InfoLayout'
import { Link } from 'react-router-dom'

const MapaDelSitio = () => {
  return (
    <InfoLayout title="Mapa del Sitio">
      <div className="info-section">
        <h2>General</h2>
        <ul>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/login">Iniciar Sesión</Link></li>
          <li><Link to="/register">Registrarse</Link></li>
        </ul>
      </div>

      <div className="info-section">
        <h2>Información</h2>
        <ul>
          <li><Link to="/info/nosotros">Sobre Nosotros</Link></li>
          <li><Link to="/info/ayuda">Ayuda</Link></li>
          <li><Link to="/info/faq">Preguntas Frecuentes</Link></li>
          <li><Link to="/info/contacto">Contacto</Link></li>
          <li><Link to="/info/soporte">Soporte Técnico</Link></li>
          <li><Link to="/info/devoluciones">Política de Devoluciones</Link></li>
          <li><Link to="/info/mapa-del-sitio">Mapa del Sitio</Link></li>
          <li><Link to="/info/accesibilidad">Accesibilidad</Link></li>
        </ul>
      </div>

      <div className="info-section">
        <h2>Legal</h2>
        <ul>
          <li><Link to="/legal/terminos">Términos y Condiciones</Link></li>
          <li><Link to="/legal/privacidad">Política de Privacidad</Link></li>
          <li><Link to="/legal/cookies">Política de Cookies</Link></li>
          <li><Link to="/legal/seguridad">Seguridad</Link></li>
        </ul>
      </div>
    </InfoLayout>
  )
}

export default MapaDelSitio
