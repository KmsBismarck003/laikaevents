import React, { useState, useEffect } from 'react';
import { ticketAPI } from '../../services/api';
import './UserTickets.css'; // Reusamos estilos

const UserHistory = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            const allTickets = await ticketAPI.getMyTickets();
            const historyTickets = allTickets.filter(t => t.status === 'used' || t.status === 'expired' || t.status === 'cancelled');
            setTickets(historyTickets);
        } catch (error) {
            console.error("Error fetching history", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Cargando historial...</div>;

    return (
        <div className="user-history-page">
            <h2 className="mb-4">Historial de Eventos 📜</h2>

            {tickets.length === 0 ? (
                <div className="empty-state">
                    <p>No tienes eventos pasados.</p>
                </div>
            ) : (
                <div className="tickets-grid">
                    {tickets.map(ticket => (
                        <div key={ticket.id} className="ticket-card history-item" style={{ opacity: 0.8 }}>
                            <div className="ticket-header" style={{ background: '#636e72' }}>
                                <span className="ticket-type">{ticket.ticketType || 'GENERAL'}</span>
                                <span className="ticket-status">{ticket.status.toUpperCase()}</span>
                            </div>
                            <div className="ticket-body">
                                <h3>{ticket.eventName}</h3>
                                <p className="ticket-date">📅 {new Date(ticket.date).toLocaleDateString()}</p>
                                <p className="ticket-location">📍 {ticket.location}</p>
                                <div className="ticket-code-preview">
                                    <small>Código: {ticket.ticketCode}</small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserHistory;
