import React from 'react'
import { Link } from 'react-router-dom'
import './Footer.css'
import Icon from '../Icons'
import { useSkeletonContext } from '../../context/SkeletonContext'
import { SkeletonFooter } from '../Skeleton/Skeleton'

// Footer component with static logo assets
const Footer = () => {
  const { showSkeleton } = useSkeletonContext()
  const currentYear = new Date().getFullYear()

  if (showSkeleton) return <SkeletonFooter />

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
            <a 
              href='https://www.facebook.com/people/Laika-Club/61581326425324/' 
              target='_blank' 
              rel='noopener noreferrer' 
              aria-label='Facebook'
            >
              <Icon name="facebook" size={24} />
            </a>
            <a 
              href='https://www.instagram.com/laika__club' 
              target='_blank' 
              rel='noopener noreferrer' 
              aria-label='Instagram'
            >
              <Icon name="instagram" size={24} />
            </a>
          </div>
          <div className="footer-map-container">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3765.8222306761336!2d-99.65698299999998!3d19.290095400000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85cd89ea9f7cd297%3A0xa29b8785b09a6143!2sCentro%2C%2050000%20Toluca%20de%20Lerdo%2C%20M%C3%A9x.!5e0!3m2!1ses-419!2smx!4v1773019646399!5m2!1ses-419!2smx" 
              width="100%" 
              height="131" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación LAIKA"
            ></iframe>
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
