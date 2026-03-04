import React, { useState, useEffect } from 'react';
import { ticketAPI, achievementsAPI } from '../../services/api';
import './UserTickets.css';
import TicketTemplate from '../../components/tickets/TicketTemplate';

const UserTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [hasPremium, setHasPremium] = useState(false);

    useEffect(() => {
        fetchTickets();
        checkPremium();
    }, []);

    const fetchTickets = async () => {
        try {
            const allTickets = await ticketAPI.getMyTickets();
            const activeTickets = allTickets.filter(t => t.status === 'active' || t.status === 'confirmed');
            setTickets(activeTickets);
        } catch (error) {
            console.error("Error fetching tickets", error);
        } finally {
            setLoading(false);
        }
    };

    const checkPremium = async () => {
        try {
            const result = await achievementsAPI.hasPremiumTicket();
            setHasPremium(result.has_premium);
        } catch (e) {
            // Fail silently - achievements module may not be available
        }
    };

    if (loading) return <div className="p-4 text-center">Cargando tus boletos...</div>;

    return (
        <div className="user-tickets-page">
            <h2 className="mb-4">
                Mis Boletos Activos {hasPremium ? '✨' : '🎟️'}
                {hasPremium && <span className="premium-label">PREMIUM</span>}
            </h2>

            {tickets.length === 0 ? (
                <div className="empty-state">
                    <p>No tienes boletos activos en este momento.</p>
                </div>
            ) : (
                <div className="tickets-grid">
                    {tickets.map(ticket => (
                        <div
                            key={ticket.id}
                            className={`ticket-card ${hasPremium ? 'premium-ticket' : ''}`}
                            onClick={() => setSelectedTicket(ticket)}
                        >
                            {hasPremium && <div className="premium-shine" />}
                            <div className="ticket-header">
                                <span className="ticket-type">
                                    {hasPremium ? '⭐ VIP' : (ticket.ticketType || 'GENERAL')}
                                </span>
                                <span className="ticket-status active">ACTIVO</span>
                            </div>
                            <div className="ticket-body">
                                <h3>{ticket.eventName}</h3>
                                <p className="ticket-date">📅 {new Date(ticket.date).toLocaleDateString()}</p>
                                <p className="ticket-location">📍 {ticket.location || 'Ubicacion por confirmar'}</p>
                                <div className="ticket-code-preview">
                                    <small>Codigo: {ticket.ticketCode}</small>
                                </div>
                            </div>
                            <div className="ticket-footer">
                                <button className="view-qr-btn">Ver QR</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* QR Modal */}
            {selectedTicket && (
                <div className="qr-modal-overlay" onClick={() => setSelectedTicket(null)}>
                    <div className={`qr-modal-wrapper ${hasPremium ? 'premium-modal' : ''}`} onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setSelectedTicket(null)}>×</button>
                        <TicketTemplate ticket={selectedTicket} />
                        {hasPremium && (
                            <div className="premium-ticket-badge">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                LAIKA PREMIUM
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserTickets;
