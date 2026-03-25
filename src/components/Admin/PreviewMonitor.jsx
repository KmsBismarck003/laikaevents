import React, { useState } from 'react';
import { Badge, Icon } from '../../components';
import { getImageUrl } from '../../utils/imageUtils';
import './PreviewMonitor.css';

const PreviewMonitor = ({ type, data, title = "FIELD MONITOR - LIVE FEED", onPositionSelect }) => {
    const [activeDropZone, setActiveDropZone] = useState(null);

    const handleDragOver = (e, zone) => {
        e.preventDefault();
        setActiveDropZone(zone);
    };

    const handleDragLeave = () => {
        setActiveDropZone(null);
    };

    const handleDrop = (e, zone) => {
        e.preventDefault();
        setActiveDropZone(null);
        if (onPositionSelect) {
            onPositionSelect(zone);
        }
    };

    // Mock data for formatting
    const formatDate = (date) => {
        if (!date) return 'DD/MM/YYYY';
        try {
            return new Date(date).toLocaleDateString();
        } catch (e) {
            return date;
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0
        }).format(price || 0);
    };

    const CATEGORY_INFO = {
        concert: { name: 'CONCIERTO', variant: 'primary' },
        festival: { name: 'FESTIVAL', variant: 'warning' },
        theater: { name: 'TEATRO', variant: 'info' },
        sport: { name: 'DEPORTE', variant: 'success' },
        other: { name: 'EVENTO', variant: 'secondary' }
    };

    const category = CATEGORY_INFO[data.category] || CATEGORY_INFO.other;

    return (
        <div className="preview-monitor simple">
            <div className="monitor-screen">
                <div className="monitor-content">
                    {type === 'event' && (
                        <div className="preview-event-glass" style={{ '--event-preview-bg': `url("${getImageUrl(data.image_url || data.image)}")` }}>
                            <div className="preview-glass-overlay"></div>
                            
                            <div className="preview-glass-content">
                                <div className="preview-left-pane">
                                    {/* Meta Header */}
                                    <div className="preview-glass-panel meta-header">
                                        <h2 className="preview-title">{data.name || 'NOMBRE DEL EVENTO'}</h2>
                                        <div className="preview-meta-row">
                                            <span>📅 {formatDate(data.event_date)}</span>
                                            {data.event_time && <span> • 🕐 {data.event_time} HRS</span>}
                                        </div>
                                        <div className="preview-meta-row location">
                                            <span>📍 {data.venue || data.location || 'RECINTO POR CONFIRMAR'}</span>
                                        </div>
                                    </div>

                                    {/* Poster */}
                                    <div className="preview-poster">
                                        <img src={getImageUrl(data.image_url || data.image)} alt="Poster" />
                                        <div className="preview-poster-fade"></div>
                                    </div>

                                    {/* Description */}
                                    <div className="preview-glass-panel description">
                                        <h4 className="label">DESCRIPCIÓN</h4>
                                        <p>{data.description || 'Sin descripción disponible...'}</p>
                                    </div>
                                </div>

                                <div className="preview-right-pane">
                                    <div className="preview-glass-panel purchase">
                                        <div className="preview-tabs">
                                            <span className="active">PRECIO MÁS BAJO</span>
                                        </div>
                                        <div className="preview-price-display">
                                            <span className="label">SUBTOTAL</span>
                                            <span className="amount">{formatPrice(data.price || 0)}</span>
                                        </div>
                                        <button className="preview-btn-blue" type="button">
                                            AGREGAR AL CARRITO
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {type === 'ad' && (
                        <div className="preview-ad-layout">
                            <div className="mock-home-layout">
                                <div className="mock-navbar">
                                    <div className="mock-nav-menu">
                                        <Icon name="menu" size={10} />
                                    </div>
                                </div>
                                <div className="mock-content-grid">
                                    <div
                                        className={`mock-slot side-left ${data.position === 'side_left' ? 'highlight' : ''} ${activeDropZone === 'side_left' ? 'drop-active' : ''}`}
                                        onDragOver={(e) => handleDragOver(e, 'side_left')}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'side_left')}
                                    >
                                        {data.position === 'side_left' && (
                                            <>
                                                <img src={getImageUrl(data.image_url)} alt="Preview" />
                                                <div className="mock-ad-info side">
                                                    <span className="mock-ad-title">{data.title || 'SIN TÍTULO'}</span>
                                                    <div className="mock-ad-btn">
                                                        <Icon name="arrowRight" size={8} />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {activeDropZone === 'side_left' && <div className="drop-indicator">SOLTAR</div>}
                                    </div>
                                    <div className="mock-center">
                                        <div
                                            className={`mock-slot main-banner ${data.position === 'main' ? 'highlight' : ''} ${activeDropZone === 'main' ? 'drop-active' : ''}`}
                                            onDragOver={(e) => handleDragOver(e, 'main')}
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, 'main')}
                                        >
                                            {data.position === 'main' && (
                                                <>
                                                    <img src={getImageUrl(data.image_url)} alt="Preview" />
                                                    <div className="mock-ad-info main">
                                                        <span className="mock-ad-title">{data.title || 'SIN TÍTULO'}</span>
                                                        <div className="mock-ad-btn">
                                                            <Icon name="arrowRight" size={10} />
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            {activeDropZone === 'main' && <div className="drop-indicator">SOLTAR AQUÍ</div>}
                                        </div>
                                        <div className="mock-cards">
                                            {[1, 2, 3].map(i => <div key={i} className="mock-card"></div>)}
                                        </div>
                                    </div>
                                    <div
                                        className={`mock-slot side-right ${data.position === 'side_right' ? 'highlight' : ''} ${activeDropZone === 'side_right' ? 'drop-active' : ''}`}
                                        onDragOver={(e) => handleDragOver(e, 'side_right')}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, 'side_right')}
                                    >
                                        {data.position === 'side_right' && (
                                            <>
                                                <img src={getImageUrl(data.image_url)} alt="Preview" />
                                                <div className="mock-ad-info side">
                                                    <span className="mock-ad-title">{data.title || 'SIN TÍTULO'}</span>
                                                    <div className="mock-ad-btn">
                                                        <Icon name="arrowRight" size={8} />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {activeDropZone === 'side_right' && <div className="drop-indicator">SOLTAR</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreviewMonitor;
