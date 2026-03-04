import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/manager.css';

const TicketOverview = ({ eventId }) => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(() => fetchAnalytics(true), 10000);
        return () => clearInterval(interval);
    }, [eventId]);

    const fetchAnalytics = async (background = false) => {
        try {
            if (!background) setLoading(true);
            const data = await api.manager.getEventTickets(eventId);
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching ticket analytics:', error);
        } finally {
            if (!background) setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Cargando analytics...</div>;
    if (!analytics) return <div className="p-4 text-center">No hay datos disponibles</div>;

    const {
        sold,
        total_capacity,
        sell_through_pct,
        active,
        used,
        refunded,
        cancelled,
        available,
        recent_purchases
    } = analytics;

    return (
        <div className="ticket-overview">
            <h3 className="text-lg font-semibold mb-4">Resumen de Venta</h3>

            {/* Progress Bar */}
            <div className="ticket-progress-container">
                <div className="progress-header">
                    <span className="text-sm font-medium text-gray-500">BOLETOS VENDIDOS</span>
                    <span className="text-lg font-bold">{sold} / {total_capacity}</span>
                </div>
                <div className="progress-bar-bg">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.min(sell_through_pct, 100)}%` }}
                    ></div>
                </div>
                <div className="mt-2 text-right text-sm text-gray-500">
                    {sell_through_pct}% de ocupación
                </div>

                <div className="ticket-stats-mini-grid">
                    <div className="mini-stat">
                        <span className="mini-stat-val text-green-600">{active}</span>
                        <span className="mini-stat-label">Activos</span>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-stat-val text-blue-600">{used}</span>
                        <span className="mini-stat-label">Usados</span>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-stat-val text-yellow-600">{refunded}</span>
                        <span className="mini-stat-label">Reembolsados</span>
                    </div>
                    <div className="mini-stat">
                        <span className="mini-stat-val text-gray-600">{available}</span>
                        <span className="mini-stat-label">Disponibles</span>
                    </div>
                </div>
            </div>

            {/* Recent Purchases Table */}
            <h3 className="text-lg font-semibold mb-4">Últimas Compras</h3>
            <div className="manager-table-container">
                <table className="manager-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Cliente</th>
                            <th>Precio</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recent_purchases && recent_purchases.length > 0 ? (
                            recent_purchases.map((ticket, idx) => (
                                <tr key={idx}>
                                    <td className="font-mono text-sm">{ticket.ticket_code}</td>
                                    <td>{ticket.customer}</td>
                                    <td>${parseFloat(ticket.price).toFixed(2)}</td>
                                    <td className="text-sm text-gray-500">
                                        {new Date(ticket.purchase_date).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${ticket.status}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center p-4 text-gray-500">
                                    Aún no hay ventas registradas
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TicketOverview;
