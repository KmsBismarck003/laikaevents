import React from 'react'
import InfoLayout from './InfoLayout'
import { Link } from 'react-router-dom'

const Soporte = () => {
  return (
    <InfoLayout title="Soporte Técnico">
      <div className="info-section">
        <p>
          En LaikaEvents nos esforzamos por ofrecerte la mejor experiencia posible, pero sabemos que a veces pueden surgir problemas técnicos.
          Aquí encontrarás soluciones a los problemas más comunes.
        </p>
      </div>

      <div className="info-section">
        <h2>Problemas de Acceso</h2>
        <h3>No puedo iniciar sesión</h3>
        <p>
          Asegúrate de que estás ingresando el correo electrónico y la contraseña correctos.
          Si has olvidado tu contraseña, puedes restablecerla haciendo clic en "¿Olvidaste tu contraseña?" en la página de inicio de sesión.
        </p>

        <h3>Mi cuenta está bloqueada</h3>
        <p>
          Si has intentado iniciar sesión demasiadas veces con credenciales incorrectas, tu cuenta puede bloquearse temporalmente por seguridad.
          Espera unos minutos e intenta de nuevo, o contacta a soporte para desbloquearla.
        </p>
      </div>

      <div className="info-section">
        <h2>Problemas con Compras</h2>
        <h3>Mi pago fue rechazado</h3>
        <p>
          Esto puede deberse a fondos insuficientes, información incorrecta de la tarjeta o bloqueos de seguridad de tu banco.
          Te recomendamos contactar a tu banco para verificar.
        </p>

        <h3>No recibí mis boletos</h3>
        <p>
          Revisa tu carpeta de correo no deseado (spam). Si aún no los encuentras, puedes ver tus boletos en la sección "Mis Boletos" de tu perfil.
        </p>
      </div>

      <div className="info-section">
        <p>
          ¿No encuentras la solución a tu problema? <Link to="/info/contacto">Contáctanos</Link>.
        </p>
      </div>
    </InfoLayout>
  )
}

export default Soporte
