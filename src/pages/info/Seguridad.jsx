import React from 'react'
import InfoLayout from './InfoLayout'

const Seguridad = () => {
  return (
    <InfoLayout title="Seguridad">
      <div className="info-section">
        <p>
          En LaikaEvents, la seguridad de nuestros usuarios es nuestra máxima prioridad.
          Implementamos medidas de seguridad avanzadas para proteger tus datos y asegurar transacciones seguras.
        </p>
      </div>

      <div className="info-section">
        <h2>Protección de Datos</h2>
        <p>
          Utilizamos encriptación SSL/TLS para proteger la transmisión de datos confidenciales, como la información de tu tarjeta de crédito.
          Además, cumplimos con los estándares de seguridad de la industria (PCI DSS).
        </p>
      </div>

      <div className="info-section">
        <h2>Monitoreo y Detección de Fraude</h2>
        <p>
          Contamos con sistemas de monitoreo continuo para detectar y prevenir actividades sospechosas.
          Nuestro equipo de seguridad trabaja las 24 horas para garantizar la integridad de la plataforma.
        </p>
      </div>

      <div className="info-section">
        <h2>Consejos de Seguridad para Usuarios</h2>
        <ul>
          <li>Utiliza contraseñas fuertes y únicas para tu cuenta.</li>
          <li>No compartas tu contraseña con nadie.</li>
          <li>Mantén actualizado el software de tu dispositivo.</li>
          <li>Ten cuidado con los correos electrónicos de phishing.</li>
        </ul>
      </div>

      <div className="info-section">
        <h2>Reportar un Problema de Seguridad</h2>
        <p>
          Si descubres una vulnerabilidad de seguridad o sospechas de una actividad fraudulenta, por favor contáctanos de inmediato en seguridad@laikaevents.com.
        </p>
      </div>
    </InfoLayout>
  )
}

export default Seguridad
