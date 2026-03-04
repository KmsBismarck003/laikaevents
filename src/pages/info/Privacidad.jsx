import React from 'react'
import InfoLayout from './InfoLayout'

const Privacidad = () => {
  return (
    <InfoLayout title="Política de Privacidad">
      <div className="info-section">
        <p>
          En LaikaEvents, nos tomamos muy en serio tu privacidad. Esta política describe cómo recopilamos, utilizamos y protegemos tu información personal.
        </p>
      </div>

      <div className="info-section">
        <h2>Información que Recopilamos</h2>
        <p>
          Podemos recopilar información personal como tu nombre, dirección de correo electrónico, número de teléfono y detalles de pago cuando te registras o realizas una compra.
        </p>
      </div>

      <div className="info-section">
        <h2>Uso de la Información</h2>
        <p>
          Utilizamos tu información para procesar tus pedidos, comunicarnos contigo sobre tus compras y mejorar nuestros servicios.
          No compartimos tu información con terceros sin tu consentimiento, excepto cuando sea necesario para procesar tus transacciones.
        </p>
      </div>

      <div className="info-section">
        <h2>Seguridad</h2>
        <p>
          Implementamos medidas de seguridad para proteger tu información contra el acceso no autorizado, la alteración, la divulgación o la destrucción.
        </p>
      </div>

      <div className="info-section">
        <h2>Tus Derechos</h2>
        <p>
          Tienes derecho a acceder, corregir o eliminar tu información personal.
          Si deseas ejercer estos derechos, por favor contáctanos.
        </p>
      </div>
    </InfoLayout>
  )
}

export default Privacidad
