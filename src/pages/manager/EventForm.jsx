import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import api, { venueAPI } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import EventCardPreview from './EventCardPreview';

const formatTime = (time) => {
    if (!time) return '';
    const str = String(time);
    if (str.includes(':')) return str.substring(0, 5);
    if (!isNaN(time)) {
        const totalSec = parseInt(time, 10);
        const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
        const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    }
    return '';
};

const EventForm = ({ event = null, onSuccess }) => {
    const { success, error, warning } = useNotification();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [venues, setVenues] = useState([]);

    // Form state defaults
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'concert',
        event_date: '',
        event_time: '',
        location: '',
        venue: '',
        venue_id: '',
        total_tickets: 100,
        price: 0,
        image_url: '',
        map_url: '',
        seat_map_url: ''
    });

    const [functions, setFunctions] = useState([]);
    const [newFunction, setNewFunction] = useState({ date: '', time: '', venue_id: '' });

    // Load Venues
    useEffect(() => {
        const loadVenues = async () => {
            try {
                const data = await venueAPI.getAll('active');
                setVenues(data);
            } catch (err) {
                console.error("Error loading venues", err);
            }
        };
        loadVenues();
    }, []);

    // Initialize if editing
    useEffect(() => {
        if (event) {
            setFormData({
                name: event.name || '',
                description: event.description || '',
                category: event.category || 'concert',
                event_date: event.event_date ? event.event_date.split('T')[0] : '',
                event_time: event.event_time ? formatTime(event.event_time) : '',
                location: event.location || '',
                venue: event.venue || '',
                venue_id: event.venue_id || '', // If backend sends it
                total_tickets: event.total_tickets || 100,
                price: event.price || 0,
                image_url: event.image_url || ''
            });

            if (event.functions && Array.isArray(event.functions)) {
                setFunctions(event.functions.map(f => ({
                    date: f.date.split('T')[0],
                    time: formatTime(f.time),
                    venue_id: f.venue_id
                })));
            }
        }
    }, [event]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVenueChange = (e) => {
        const venueId = e.target.value;
        const selected = venues.find(v => String(v.id) === String(venueId));

        if (selected) {
            setFormData(prev => ({
                ...prev,
                venue_id: venueId,
                venue: selected.name,
                location: selected.city
            }));
            // Update new function venue default as well
            setNewFunction(prev => ({ ...prev, venue_id: venueId }));
        } else {
            setFormData(prev => ({ ...prev, venue_id: '', venue: '', location: '' }));
        }
    };

    const handleAddFunction = () => {
        if (!newFunction.date || !newFunction.time || !newFunction.venue_id) {
            warning('Fecha, hora y recinto son requeridos para agregar una función');
            return;
        }
        setFunctions(prev => [...prev, { ...newFunction, tempId: Date.now() }]);
        setNewFunction({ ...newFunction, date: '', time: '' }); // Keep venue
    };

    const handleRemoveFunction = (index) => {
        setFunctions(prev => prev.filter((_, i) => i !== index));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const res = await api.manager.uploadImage(file);
            setFormData(prev => ({ ...prev, image_url: res.url }));
            success('Imagen subida correctamente');
        } catch (err) {
            console.error(err);
            error('Error al subir imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Logic: populate main date/time from first function if not set, or override
            const payload = { ...formData };

            if (functions.length > 0) {
                // Sort functions by date/time
                const sortedFuncs = [...functions].sort((a, b) => {
                    const dateA = new Date(a.date + 'T' + (a.time.length === 5 ? a.time + ':00' : a.time));
                    const dateB = new Date(b.date + 'T' + (b.time.length === 5 ? b.time + ':00' : b.time));
                    return dateA - dateB;
                });
                payload.functions = sortedFuncs.map(f => ({
                    ...f,
                    venue_id: parseInt(f.venue_id) // Ensure ID is int
                }));

                // Force main event date to be the first function's date
                payload.event_date = sortedFuncs[0].date;
                payload.event_time = sortedFuncs[0].time;

                // If no venue set on main, take first function's venue (logic already in backend, but good to have here)
            }

            if (!payload.name || !payload.event_date || !payload.price) {
                warning('Por favor completa los campos obligatorios');
                setLoading(false);
                return;
            }

            if (payload.venue_id) payload.venue_id = parseInt(payload.venue_id);
            if (payload.price) payload.price = parseFloat(payload.price);
            if (payload.total_tickets) payload.total_tickets = parseInt(payload.total_tickets);

            let result;
            if (event) {
                // Update
                result = await api.manager.updateEvent(event.id, payload);
                success('Evento actualizado correctamente');
            } else {
                // Create
                result = await api.manager.createEvent(payload);
                success('Evento creado correctamente');
            }

            if (onSuccess) onSuccess(result);

        } catch (err) {
            console.error('Error saving event:', err);
            error(err.userMessage || 'Error al guardar el evento');
        } finally {
            setLoading(false);
        }
    };

    const getVenueName = (id) => venues.find(v => String(v.id) === String(id))?.name || 'Desconocido';

    return (
        <div className="event-form-container">
            <div className="manager-form-grid">
                {/* Left Column: Form Fields */}
                <div className="form-inputs">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-4">
                            <Input
                                label="Nombre del Evento *"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ej. Concierto de Rock"
                                required
                            />
                        </div>

                        {/* Venue Selection */}
                        <div className="form-group mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recinto Principal</label>
                            <select
                                name="venue_id"
                                value={formData.venue_id}
                                onChange={handleVenueChange}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                            >
                                <option value="">-- Seleccionar Recinto --</option>
                                {venues.map(v => (
                                    <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-row grid grid-cols-2 gap-4 mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                                >
                                    <option value="concert">Concierto</option>
                                    <option value="sport">Deporte</option>
                                    <option value="theater">Teatro</option>
                                    <option value="festival">Festival</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <Input
                                    label="Ubicación (Ciudad) *"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Ej. CDMX o Puebla"
                                />
                            </div>
                        </div>

                        {/* Functions / Scheduling Section */}
                        <div className="form-group mb-6 p-4 border rounded bg-gray-50" style={{ border: '1px solid #eee', background: '#f9fafb', borderRadius: '8px', padding: '1rem' }}>
                            <label className="block text-sm font-bold text-gray-700 mb-3">Fechas y Funciones</label>

                            {functions.length > 0 && (
                                <ul className="mb-4 space-y-2">
                                    {functions.map((f, idx) => (
                                        <li key={f.tempId || idx} className="flex justify-between items-center bg-white p-2 rounded border text-sm" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', background: '#fff', border: '1px solid #ddd', padding: '0.5rem' }}>
                                            <span>
                                                📅 <strong>{f.date}</strong> ⏰ {f.time} 📍 {getVenueName(f.venue_id)}
                                            </span>
                                            <button type="button" onClick={() => handleRemoveFunction(idx)} className="text-red-500 hover:text-red-700">❌</button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="add-function-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                                <div className="form-group">
                                    <label className="text-xs">Fecha</label>
                                    <input type="date" value={newFunction.date} onChange={e => setNewFunction({ ...newFunction, date: e.target.value })} className="w-full p-1 border rounded" />
                                </div>
                                <div className="form-group">
                                    <label className="text-xs">Hora</label>
                                    <input type="time" value={newFunction.time} onChange={e => setNewFunction({ ...newFunction, time: e.target.value })} className="w-full p-1 border rounded" />
                                </div>
                                <div className="form-group">
                                    <label className="text-xs">Recinto</label>
                                    <select value={newFunction.venue_id} onChange={e => setNewFunction({ ...newFunction, venue_id: e.target.value })} className="w-full p-1 border rounded">
                                        <option value="">Seleccionar</option>
                                        {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <Button type="button" size="small" variant="secondary" onClick={handleAddFunction}>➕ Agregar</Button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">* La primera fecha será la principal del evento.</p>
                        </div>


                        <div className="form-row grid grid-cols-2 gap-4 mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <Input
                                    label="Precio del Boleto *"
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <Input
                                    label="Total Boletos *"
                                    name="total_tickets"
                                    type="number"
                                    min="1"
                                    value={formData.total_tickets}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                                placeholder="Detalles del evento..."
                            ></textarea>
                        </div>

                        <div className="form-group mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-3">Imagen del Evento (Vector Preview)</label>

                            <div
                                className="image-upload-dropzone"
                                style={{
                                    border: '2px dashed #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    background: '#f8fafc',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onClick={() => document.getElementById('event-image-upload').click()}
                            >
                                <input
                                    id="event-image-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ display: 'none' }}
                                    disabled={uploading}
                                />

                                {formData.image_url ? (
                                    <div className="upload-preview-overlay">
                                        <img
                                            src={formData.image_url}
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                height: '150px',
                                                objectFit: 'cover',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <div style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>
                                            Haz clic para cambiar la foto
                                        </div>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</div>
                                        <p style={{ fontWeight: '600', color: '#1e293b' }}>
                                            {uploading ? 'Subiendo...' : 'Haz clic para subir la foto del evento'}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            PNG, JPG o GIF hasta 5MB
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Direct URL input as fallback */}
                            <div style={{ marginTop: '1rem' }}>
                                <Input
                                    label="O pega una URL de imagen:"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        {/* --- GPS & MAPS --- */}
                        <div className="form-group mb-6 p-4 border rounded bg-blue-50" style={{ border: '1px solid #dbeafe', background: '#eff6ff', borderRadius: '8px', padding: '1rem' }}>
                            <label className="block text-sm font-bold text-blue-700 mb-3">📍 Ubicación y Mapas Especiales</label>
                            <div className="grid grid-cols-1 gap-4">
                                <Input 
                                    label="Google Maps URL (Embed/Directa)" 
                                    name="map_url" 
                                    value={formData.map_url} 
                                    onChange={handleChange} 
                                    placeholder="https://www.google.com/maps/embed?..." 
                                />
                                <Input 
                                    label="Mapa de Asientos URL" 
                                    name="seat_map_url" 
                                    value={formData.seat_map_url} 
                                    onChange={handleChange} 
                                    placeholder="URL de la imagen del mapa de zonas" 
                                />
                            </div>
                        </div>

                        <div className="form-actions flex justify-end gap-3" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button type="submit" variant="primary" loading={loading} disabled={uploading}>
                                {event ? 'Guardar Cambios' : 'Crear Evento'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Right Column: Live Preview */}
                <div className="preview-column">
                    <h3 className="text-lg font-semibold mb-3">Vista Previa</h3>
                    <EventCardPreview eventData={formData} />
                    <p className="text-sm text-muted text-center mt-2">
                        Así se verá tu evento en la página principal.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EventForm;
