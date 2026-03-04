import React from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import '../../styles/manager.css';
import { getImageUrl } from '../../utils/imageUtils';

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

/**
 * EventCardPreview
 * Reuses the Home page Card style to show a live preview.
 */
const EventCardPreview = ({ eventData }) => {
    // Default placeholder data if fields are empty
    const {
        name = "Nombre del Evento",
        description = "Descripción breve del evento...",
        event_date,
        event_time,
        location = "Ubicación",
        price = 0,
        image_url,
        category = "concert"
    } = eventData;

    // Simulate formatting
    const formattedDate = event_date ? new Date(event_date).toLocaleDateString() : 'DD/MM/YYYY';
    const formattedTime = formatTime(event_time) || 'HH:MM';

    // Fallback image if none provided
    const displayImage = getImageUrl(image_url);

    return (
        <div className="preview-container">
            <div style={{ width: '100%', maxWidth: '350px' }}>
                <Card
                    className="event-card"
                    variant="hoverable"
                >
                    <div className="event-image-container">
                        <img
                            src={displayImage}
                            alt={name}
                            className="event-image"
                            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                        />
                        <span className="event-category-badge">
                            {category.toUpperCase()}
                        </span>
                    </div>

                    <div className="event-content" style={{ padding: '1.5rem' }}>
                        <h3 className="event-title" style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {name}
                        </h3>

                        <div className="event-meta" style={{ display: 'flex', gap: '1rem', color: '#6c757d', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            <span>📅 {formattedDate}</span>
                            <span>🕒 {formattedTime}</span>
                        </div>

                        <p className="event-location" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#495057', marginBottom: '1rem' }}>
                            📍 {location}
                        </p>

                        <p className="event-description" style={{ fontSize: '0.95rem', color: '#6c757d', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {description}
                        </p>

                        <div className="event-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <div className="event-price">
                                <span style={{ fontSize: '0.8rem', color: '#6c757d' }}>Desde</span>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000' }}>
                                    ${parseFloat(price).toFixed(2)}
                                </div>
                            </div>
                            <Button size="small">Ver Boletos</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default EventCardPreview;
