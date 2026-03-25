import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import EventForm from './EventForm';
import ManagerStatsCards from './components/ManagerStatsCards';
import '../../styles/manager.css';

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

const EventList = () => {
    const { user } = useAuth();
    const { success, error, warning, info } = useNotification();

    const hasPermission = (permissionKey) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (!user.permissions) return true;
        return !!user.permissions[permissionKey];
    };

    const showNotification = (message, type = 'info') => {
        if (type === 'success') success(message);
        else if (type === 'error') error(message);
        else if (type === 'warning') warning(message);
        else info(message);
    };

    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Filtros de estado
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchEvents();
        const interval = setInterval(() => fetchEvents(true), 10000); // 10s auto-refresh
        return () => clearInterval(interval);
    }, []);

    const fetchEvents = async (background = false) => {
        try {
            if (!background) setLoading(true);
            const response = await api.manager.getMyEvents();
            setEvents(response);
        } catch (error) {
            console.error('Error fetching events:', error);
            if (!background) showNotification('Error al cargar eventos', 'error');
        } finally {
            if (!background) setLoading(false);
        }
    };

    const handleCreateSuccess = (newEvent) => {
        setEvents([newEvent, ...events]);
        setShowCreateModal(false);
        showNotification('Evento creado exitosamente', 'success');
        // Opcional: navegar al detalle
        navigate(`/events/manage/${newEvent.id}`);
    };

    const handleQuickPublish = async (e, eventId) => {
        e.stopPropagation();
        try {
            await api.manager.publishEvent(eventId);
            showNotification('Evento publicado', 'success');
            // Update local state
            setEvents(events.map(ev =>
                ev.id === eventId ? { ...ev, status: 'published' } : ev
            ));
        } catch (error) {
            console.error('Error publishing:', error);
            showNotification('Error al publicar evento', 'error');
        }
    };

    // Calcular stats rápidos
    const stats = {
        total: events.length,
        published: events.filter(e => e.status === 'published').length,
        draft: events.filter(e => e.status === 'draft').length,
        totalSold: events.reduce((acc, curr) => acc + (parseInt(curr.tickets_sold) || 0), 0)
    };

    const filteredEvents = filterStatus === 'all'
        ? events
        : events.filter(e => e.status === filterStatus);

    const getStatusLabel = (status) => {
        const labels = {
            draft: 'Borrador',
            published: 'Publicado',
            cancelled: 'Cancelado',
            completed: 'Finalizado',
            sold_out: 'Agotado',
            archived: 'Archivado'
        };
        return labels[status] || status;
    };

    return (
        <div className="manager-container">
            {/* Header */}
            <div className="manager-header">
                <div className="manager-title">
                    <h1>Mis Eventos</h1>
                    <p>Gestiona y monitorea todos tus eventos desde aquí</p>
                </div>
                {hasPermission('canCreateEvents') && (
                    <div className="manager-actions">
                        <Button onClick={() => setShowCreateModal(true)} variant="primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                            Crear Nuevo Evento
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats Cards Modularizadas (Solo si tiene ADN analítico) */}
            {hasPermission('canViewEventAnalytics') && <ManagerStatsCards stats={stats} />}

            {/* Event List Table */}
            <div className="manager-table-container">
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando eventos...</div>
                ) : (
                    <table className="manager-table">
                        <thead>
                            <tr>
                                <th>Evento</th>
                                <th>Fecha</th>
                                <th>Ubicación</th>
                                <th>Estado</th>
                                <th>Tickets Vendidos</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map(event => (
                                    <tr key={event.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/events/manage/${event.id}`)}>
                                        <td>
                                            <div className="event-cell-name">{event.name}</div>
                                            <small className="text-muted">{event.category}</small>
                                        </td>
                                        <td className="event-cell-date">
                                            {new Date(event.event_date).toLocaleDateString()}
                                            <br />
                                            <small>{formatTime(event.event_time)}</small>
                                        </td>
                                        <td>{event.venue || event.location}</td>
                                        <td>
                                            <span className={`status-badge status-${event.status}`}>
                                                {getStatusLabel(event.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <strong>{event.tickets_sold}</strong> / {event.total_tickets}
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <div className="action-buttons">
                                                {hasPermission('canEditEvents') && (
                                                    <Button
                                                        size="small"
                                                        variant="outline"
                                                        onClick={() => navigate(`/events/manage/${event.id}`)}
                                                    >
                                                        Gestionar
                                                    </Button>
                                                )}
                                                {event.status === 'draft' && hasPermission('canCreateEvents') && (
                                                    <Button
                                                        size="small"
                                                        variant="primary"
                                                        onClick={(e) => handleQuickPublish(e, event.id)}
                                                        style={{ marginLeft: '0.5rem', backgroundColor: '#28a745', borderColor: '#28a745' }}
                                                    >
                                                        Publicar
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <p className="text-muted">No tienes eventos registrados aún.</p>
                                        <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                                            Crear mi primer evento
                                        </Button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Crear Nuevo Evento"
                size="large"
            >
                <EventForm onSuccess={handleCreateSuccess} />
            </Modal>
        </div>
    );
};

export default EventList;
