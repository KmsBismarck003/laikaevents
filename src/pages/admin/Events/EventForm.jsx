import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Modal } from '../../../components'
import { Plus, Trash2, X } from 'lucide-react'
import './admin.css'
import api from '../../../services/api'
import PreviewMonitor from '../../../components/Admin/PreviewMonitor'

const EventForm = ({ event = null, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        event_date: '',
        event_time: '',
        location: '',
        venue: '',
        category: 'concert',
        price: 0,
        total_tickets: 0,
        available_tickets: 0,
        image_url: '',
        ticket_image_url: '',
        map_url: '',
        seat_map_url: '',
        status: 'draft',
        sections: [],
        rules: []
    })

    // Cargar datos si estamos editando
    useEffect(() => {
        if (event) {
            setFormData({
                ...event,
                sections: event.sections || [],
                rules: event.rules || []
            })
        }
    }, [event])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // --- Manejo de Secciones Dinámicas ---
    const addSection = () => {
        setFormData(prev => ({
            ...prev,
            sections: [...prev.sections, { name: '', price: 0, capacity: 0, available: 0, badge_text: '', color_hex: '#000000' }]
        }))
    }

    const updateSection = (idx, field, value) => {
        const newSections = [...formData.sections]
        newSections[idx][field] = value
        setFormData(prev => ({ ...prev, sections: newSections }))
    }

    const removeSection = (idx) => {
        const newSections = [...formData.sections]
        newSections.splice(idx, 1)
        setFormData(prev => ({ ...prev, sections: newSections }))
    }

    // --- Manejo de Reglas Dinámicas ---
    const addRule = () => {
        setFormData(prev => ({
            ...prev,
            rules: [...prev.rules, { title: '', icon: 'info', description: '' }]
        }))
    }

    const updateRule = (idx, field, value) => {
        const newRules = [...formData.rules]
        newRules[idx][field] = value
        setFormData(prev => ({ ...prev, rules: newRules }))
    }

    const removeRule = (idx) => {
        const newRules = [...formData.rules]
        newRules.splice(idx, 1)
        setFormData(prev => ({ ...prev, rules: newRules }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (formData.id) {
                await api.event.update(formData.id, formData)
            } else {
                await api.event.create(formData)
            }
            onSave()
            onClose()
        } catch (error) {
            console.error("Error al guardar evento:", error)
            alert("Error al guardar el evento. Revisa la consola.")
        }
    }

    return (
        <Modal isOpen={true} title={formData.id ? "Editar Evento" : "Crear Nuevo Evento"} onClose={onClose} size="large">
            <form onSubmit={handleSubmit} className="event-form-container">
                <div className="split-modal-container">
                    <div className="split-modal-form">
                        {/* --- PESTAÑA: INFORMACIÓN BÁSICA --- */}
                        <h3 className="form-section-title">Información Básica</h3>
                        <div className="form-grid">
                            <Input label="Nombre del Evento" name="name" value={formData.name} onChange={handleChange} required />
                            <Input label="Fecha (YYYY-MM-DD)" type="date" name="event_date" value={formData.event_date} onChange={handleChange} required />
                            <Input label="Hora" type="time" name="event_time" value={formData.event_time} onChange={handleChange} required />
                            <Input label="Lugar (Ciudad)" name="location" value={formData.location} onChange={handleChange} required />
                            <Input label="Recinto / Venue" name="venue" value={formData.venue} onChange={handleChange} />
                            <div className="input-group">
                                <label>Categoría</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="laika-input">
                                    <option value="concert">Concierto</option>
                                    <option value="festival">Festival</option>
                                    <option value="theater">Teatro</option>
                                    <option value="sport">Deporte</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Estado</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="laika-input">
                                    <option value="published">Publicado</option>
                                    <option value="draft">Borrador</option>
                                    <option value="cancelled">Cancelado</option>
                                </select>
                            </div>
                            <Input label="URL Imagen Evento" name="image_url" value={formData.image_url} onChange={handleChange} />
                            <Input label="URL Imagen Ticket (Marco)" name="ticket_image_url" value={formData.ticket_image_url} onChange={handleChange} placeholder="Imagen para el diseño del ticket AI" />
                        </div>

                        <Input
                            label="Descripción"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            textarea
                            rows={3}
                        />

                        {/* --- PESTAÑA: UBICACIÓN Y MAPAS --- */}
                        <h3 className="form-section-title" style={{ marginTop: '2rem' }}>Ubicación y Mapas</h3>
                        <div className="form-grid">
                            <Input label="Google Maps URL (Embed o Directa)" name="map_url" value={formData.map_url} onChange={handleChange} placeholder="Ej. https://www.google.com/maps/embed?..." />
                            <Input label="URL Mapa de Asientos (Recinto)" name="seat_map_url" value={formData.seat_map_url} onChange={handleChange} placeholder="URL de la imagen del mapa de zonas" />
                        </div>

                        <div className="form-grid triple">
                            <Input label="Precio Base Secundario ($)" type="number" name="price" value={formData.price} onChange={handleChange} required />
                            <Input label="Total Boletos" type="number" name="total_tickets" value={formData.total_tickets} onChange={handleChange} required />
                            <Input label="Boletos Disponibles" type="number" name="available_tickets" value={formData.available_tickets} onChange={handleChange} required />
                        </div>

                        <hr className="form-divider" />

                        {/* --- SECCIONES DE BOLETOS --- */}
                        <div className="form-dynamic-section">
                            <div className="dynamic-header">
                                <h3 className="form-section-title">Zonas y Boletos (Premium Layout)</h3>
                                <Button type="button" variant="outline" size="small" onClick={addSection}>
                                    <Plus size={16} /> Añadir Zona
                                </Button>
                            </div>

                            <div className="dynamic-list">
                                {formData.sections.map((sec, idx) => (
                                    <Card key={idx} className="dynamic-item">
                                        <div className="dynamic-item-top">
                                            <h4>Zona #{idx + 1}</h4>
                                            <button type="button" className="btn-icon danger" onClick={() => removeSection(idx)}><Trash2 size={16} /></button>
                                        </div>
                                        <div className="form-grid">
                                            <Input label="Nombre (ej. VIP)" value={sec.name} onChange={(e) => updateSection(idx, 'name', e.target.value)} required />
                                            <Input label="Precio ($)" type="number" value={sec.price} onChange={(e) => updateSection(idx, 'price', e.target.value)} required />
                                            <Input label="Capacidad" type="number" value={sec.capacity} onChange={(e) => updateSection(idx, 'capacity', e.target.value)} required />
                                            <Input label="Disponibles" type="number" value={sec.available} onChange={(e) => updateSection(idx, 'available', e.target.value)} required />
                                            <Input label="Etiqueta (Badge)" placeholder="Ej. PREVENTA" value={sec.badge_text} onChange={(e) => updateSection(idx, 'badge_text', e.target.value)} />
                                            <Input label="Color (Hex)" type="color" value={sec.color_hex} onChange={(e) => updateSection(idx, 'color_hex', e.target.value)} />
                                        </div>
                                    </Card>
                                ))}
                                {formData.sections.length === 0 && <p className="dynamic-empty">No hay zonas agregadas. Se usará el ticket base.</p>}
                            </div>
                        </div>

                        <hr className="form-divider" />

                        {/* --- REGLAS DE ACCESO --- */}
                        <div className="form-dynamic-section">
                            <div className="dynamic-header">
                                <h3 className="form-section-title">Reglas de Acceso (Acordeón)</h3>
                                <Button type="button" variant="outline" size="small" onClick={addRule}>
                                    <Plus size={16} /> Añadir Regla
                                </Button>
                            </div>

                            <div className="dynamic-list rules-list">
                                {formData.rules.map((rule, idx) => (
                                    <Card key={idx} className="dynamic-item">
                                        <div className="dynamic-item-top">
                                            <Input label="Título" placeholder="Ej. Límite de Edad" value={rule.title} onChange={(e) => updateRule(idx, 'title', e.target.value)} style={{ flex: 1 }} required />
                                            <div className="input-group" style={{ maxWidth: '120px', margin: '0 1rem' }}>
                                                <label>Icono</label>
                                                <select value={rule.icon} onChange={(e) => updateRule(idx, 'icon', e.target.value)} className="laika-input">
                                                    <option value="info">Info</option>
                                                    <option value="alert-triangle">Alerta</option>
                                                    <option value="user-check">Edad</option>
                                                    <option value="camera-off">Cámaras</option>
                                                    <option value="clock">Reloj</option>
                                                </select>
                                            </div>
                                            <button type="button" className="btn-icon danger" onClick={() => removeRule(idx)}><Trash2 size={16} /></button>
                                        </div>
                                        <Input label="Descripción" textarea rows={2} value={rule.description} onChange={(e) => updateRule(idx, 'description', e.target.value)} required />
                                    </Card>
                                ))}
                                {formData.rules.length === 0 && <p className="dynamic-empty">Sin reglas específicas. No se mostrará el acordeón.</p>}
                            </div>
                        </div>

                        <div className="form-actions-footer">
                            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" variant="primary">Guardar Evento</Button>
                        </div>
                    </div>

                    <div className="split-modal-preview">
                        <PreviewMonitor type="event" data={formData} />
                    </div>
                </div>
            </form>
        </Modal>
    )
}

export default EventForm
