import React from 'react'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='footer'>
      <div className='footer-container'>
        <div className='footer-section'>
          <h3>🐕 LAIKA Club</h3>
          <p>Sistema de gestión de eventos v2.0</p>
        </div>

        <div className='footer-section'>
          <h4>Enlaces</h4>
          <ul>
            <li>
              <a href='/'>Inicio</a>
            </li>
            <li>
              <a href='/events'>Eventos</a>
            </li>
            <li>
              <a href='/about'>Acerca de</a>
            </li>
          </ul>
        </div>

        <div className='footer-section'>
          <h4>Soporte</h4>
          <ul>
            <li>
              <a href='/help'>Ayuda</a>
            </li>
            <li>
              <a href='/contact'>Contacto</a>
            </li>
            <li>
              <a href='/terms'>Términos</a>
            </li>
          </ul>
        </div>

        <div className='footer-section'>
          <h4>Síguenos</h4>
          <div className='footer-social'>
            <a href='#' aria-label='Facebook'>
              📘
            </a>
            <a href='#' aria-label='Twitter'>
              🐦
            </a>
            <a href='#' aria-label='Instagram'>
              📷
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
