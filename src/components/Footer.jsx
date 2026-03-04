import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'
import Icon from './Icons'

// Footer component with static logo assets
const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='footer'>
      <div className='footer-container'>
        <div className='footer-section'>
          <img src="/logob.png" alt="LAIKA Club" className="footer-logo" />
          <p>Sistema de gestión de eventos v2.6</p>
        </div>

        <div className='footer-section'>
          <h4>Enlaces</h4>
          <ul>
            <li><Link to='/'>Inicio</Link></li>
            <li><Link to='/info/nosotros'>Quiénes Somos</Link></li>
            <li><Link to='/info/contacto'>Contacto</Link></li>
            <li><Link to='/info/faq'>Preguntas Frecuentes</Link></li>
            <li><Link to='/info/mapa-del-sitio'>Mapa del Sitio</Link></li>
          </ul>
        </div>

        <div className='footer-section'>
          <h4>Soporte & Legal</h4>
          <ul>
            <li><Link to='/ayuda'>Centro de Ayuda</Link></li>
            <li><Link to='/info/soporte'>Soporte Técnico</Link></li>
            <li><Link to='/info/devoluciones'>Devoluciones</Link></li>
            <li><Link to='/legal/terminos'>Términos y Condiciones</Link></li>
            <li><Link to='/legal/privacidad'>Política de Privacidad</Link></li>
            <li><Link to='/legal/cookies'>Política de Cookies</Link></li>
            <li><Link to='/legal/seguridad'>Seguridad</Link></li>
            <li><Link to='/info/accesibilidad'>Accesibilidad</Link></li>
          </ul>
        </div>

        <div className='footer-section'>
          <h4>Síguenos</h4>
          <div className='footer-social'>
            <a href='#' aria-label='Facebook'>
              <Icon name="facebook" size={24} />
            </a>
            <a href='#' aria-label='Twitter'>
              <Icon name="twitter" size={24} />
            </a>
            <a href='#' aria-label='Instagram'>
              <Icon name="instagram" size={24} />
            </a>
             <a href='#' aria-label='LinkedIn'>
              <Icon name="linkedin" size={24} />
            </a>
          </div>
        </div>
      </div>

      <div className='footer-bottom'>
        <p>&copy; {currentYear} LAIKA Club. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}

export default Footer
