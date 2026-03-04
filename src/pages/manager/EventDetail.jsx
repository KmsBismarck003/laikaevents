import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import Button from '../../components/Button';
import EventForm from './EventForm';
import TicketOverview from './TicketOverview';
import RevenuePanel from './RevenuePanel';
import CancelEventModal from './CancelEventModal';
import '../../styles/manager.css';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { success, error, warning, info } = useNotification();
    const showNotification = (message, type = 'info') => {
        if (type === 'success') success(message);
        else if (type === 'error') error(message);
        else if (type === 'warning') warning(message);
        else info(message);
    };


    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [showCancelModal, setShowCancelModal] = useState(false);

    useEffect(() => {
        fetchEventDetail();
        const interval = setInterval(() => fetchEventDetail(true), 10000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchEventDetail = async (background = false) => {
        try {
            if (!background) setLoading(true);
            const data = await api.manager.getEventDetail(id);
            setEvent(data);
        } catch (error) {
            console.error('Error fetching event details:', error);
            if (!background) showNotification('Error al cargar detalles del evento', 'error');
            // navigate('/events/manage');
        } finally {
            if (!background) setLoading(false);
        }
    };

    const handlePublish = async () => {
        try {
            await api.manager.publishEvent(id);
            showNotification('Evento publicado exitosamente', 'success');
            fetchEventDetail();
        } catch (error) {
            showNotification('Error al publicar evento', 'error');
        }
    };

    const handleUnpublish = async () => {
        try {
            await api.manager.unpublishEvent(id);
            showNotification('Evento despublicado (borrador)', 'success');
            fetchEventDetail();
        } catch (error) {
            showNotification('Error al despublicar evento', 'error');
        }
    };

    const handleContextAction = () => {
        if (!event) return;
        if (event.status === 'draft') handlePublish();
        else if (event.status === 'published') handleUnpublish();
    };

    if (loading) return <div className="p-8 text-center">Cargando detalles...</div>;
    if (!event) return <div className="p-8 text-center">Evento no encontrado</div>;

    return (
        <div className="manager-container">
            {/* Header */}
            <div className="manager-header">
                <div className="manager-title">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/events/manage')}
                            className="text-gray-500 hover:text-gray-800 mr-2"
                        >
                            ← Volver
                        </button>
                        <h1 className="text-2xl font-bold">{event.name}</h1>
                        <span className={`status-badge status-${event.status} ml-3`}>
                            {event.status.toUpperCase()}
                        </span>
                    </div>
                    <p className="mt-1 text-gray-500">
                        {new Date(event.event_date).toLocaleDateString()} • {event.location}
                    </p>
                </div>
                <div className="manager-actions">
                    <Button
                        variant="outline"
                        onClick={() => window.open(`/eventos/${event.id}`, '_blank')}
                    >
                        Ver en Web
                    </Button>

                    {event.status === 'draft' && (
                        <Button variant="primary" onClick={handlePublish}>
                            Publicar Evento
                        </Button>
                    )}

                    {event.status === 'published' && (
                        <Button variant="secondary" onClick={handleUnpublish}>
                            Despublicar
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="manager-tabs">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Resumen General
                </button>
                <button
                    className={`tab-button ${activeTab === 'tickets' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tickets')}
                >
                    Boletos y Accesos
                </button>
                <button
                    className={`tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('revenue')}
                >
                    Finanzas
                </button>
                <button
                    className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    Configuración
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        <div className="manager-stats-grid">
                            <div className="manager-stat-card">
                                <div className="stat-info">
                                    <span className="stat-label">Boletos Vendidos</span>
                                    <span className="stat-value">
                                        {event.ticket_summary?.sold || 0} / {event.total_tickets}
                                    </span>
                                </div>
                            </div>
                            <div className="manager-stat-card">
                                <div className="stat-info">
                                    <span className="stat-label">Ingresos Netos</span>
                                    <span className="stat-value text-green-600">
                                        ${event.revenue_summary?.net?.toLocaleString() || '0.00'}
                                    </span>
                                </div>
                            </div>
                            <div className="manager-stat-card">
                                <div className="stat-info">
                                    <span className="stat-label">Ocupación</span>
                                    <span className="stat-value">
                                        {event.ticket_summary?.sell_through_pct || 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity or Warnings could go here */}
                         {(event.status === 'cancelled') && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
                                <h3 className="font-bold">Evento Cancelado</h3>
                                <p>Motivo: {event.cancel_reason}</p>
                                <p className="text-sm mt-1">Cancelado por: {event.cancelled_by} el {new Date(event.cancelled_at).toLocaleString()}</p>
                            </div>
                        )}

                        {/* Functions List */}
                        {event.functions && event.functions.length > 0 && (
                            <div className="manager-stat-card mb-6" style={{ gridColumn: '1 / -1' }}>
                                <h3 className="font-bold text-lg mb-3">📅 Fechas Programadas</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="p-2">Fecha</th>
                                                <th className="p-2">Hora</th>
                                                <th className="p-2">Recinto</th>
                                                <th className="p-2">Ciudad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {event.functions.map((f, idx) => (
                                                <tr key={idx} className="border-b hover:bg-gray-50">
                                                    <td className="p-2">{new Date(f.date).toLocaleDateString()}</td>
                                                    <td className="p-2 text-sm">{String(f.time).substring(0, 5)}</td>
                                                    <td className="p-2">{f.venue_name || '—'}</td>
                                                    <td className="p-2 text-sm text-gray-500">{f.venue_city || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'tickets' && (
                    <TicketOverview eventId={id} />
                )}

                {activeTab === 'revenue' && (
                    <RevenuePanel eventId={id} />
                )}

                {activeTab === 'config' && (
                    <div className="config-tab">
                        <EventForm
                            event={event}
                            onSuccess={(updated) => {
                                setEvent(prev => ({ ...prev, ...updated }));
                                showNotification('Configuración actualizada', 'success');
                            }}
                        />

                        {/* Danger Zone */}
                        <div className="danger-zone">
                            <div className="danger-header">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                <h3 className="text-lg font-bold">Zona de Peligro</h3>
                            </div>
                            <p className="text-gray-600 mb-4">
                                Cancelar el evento es una acción irreversible. Se reembolsarán automáticamente todos los boletos vendidos.
                            </p>

                            {event.status !== 'cancelled' ? (
                                <Button
                                    variant="danger"
                                    onClick={() => setShowCancelModal(true)}
                                    style={{ backgroundColor: '#dc3545', color: 'white' }}
                                >
                                    Cancelar Evento de Emergencia
                                </Button>
                            ) : (
                                <Button disabled variant="outline">Evento ya cancelado</Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <CancelEventModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                eventId={id}
                onCancelSuccess={() => {
                    fetchEventDetail();
                    setActiveTab('overview');
                }}
            />
        </div>
    );
};

export default EventDetail;
