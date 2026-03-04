import React, { useState } from 'react'
import InfoLayout from './InfoLayout'
import { Input, Button } from '../../components'

const Contacto = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Aquí iría la lógica para enviar el formulario
    console.log('Formulario enviado:', formData)
    alert('Gracias por contactarnos. Te responderemos a la brevedad.')
  }

  return (
    <InfoLayout title="Contacto">
      <div className="info-section">
        <p>
          ¿Tienes alguna pregunta o comentario? Estamos aquí para ayudarte.
          Completa el formulario a continuación y nos pondremos en contacto contigo lo antes posible.
        </p>
      </div>

      <div className="info-section">
        <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Correo Electrónico</label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="subject" style={{ display: 'block', marginBottom: '0.5rem' }}>Asunto</label>
            <Input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Asunto de tu mensaje"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem' }}>Mensaje</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="5"
              placeholder="Escribe tu mensaje aquí..."
              style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}
              required
            ></textarea>
          </div>

          <Button type="submit" variant="primary">Enviar Mensaje</Button>
        </form>
      </div>

      <div className="info-section" style={{ marginTop: '3rem', textAlign: 'center' }}>
        <h3>Otros medios de contacto</h3>
        <p>Email: redjar481@gmail.com</p>
        <p>Teléfono: +52 (722) 239 0967</p>
        <p>Horario de atención: Lunes a Viernes de 9:00 AM a 6:00 PM</p>
      </div>
    </InfoLayout>
  )
}

export default Contacto
