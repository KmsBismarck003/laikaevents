import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import api from '../../services/api';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/ConfirmationModal';

const RefundRequest = () => {
    const { showNotification } = useNotification();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await api.ticket.getMyTickets();
            // Filtrar solo tickets activos
            const active = response.filter(t => t.status === 'active');
            setTickets(active);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [ticketToRefund, setTicketToRefund] = useState(null);

    const handleRequestRefund = async (ticket) => {
        try {
            // First check policy
            const policyCheck = await api.refund.checkPolicy(ticket.event_id);

            if (!policyCheck.eligible) {
                showNotification(policyCheck.reason, 'warning');
                return;
            }

            setTicketToRefund(ticket);
            setIsConfirmModalOpen(true);
        } catch (error) {
            console.error('Policy check error:', error);
            showNotification('Error al verificar elegibilidad del reembolso', 'error');
        }
    };

    const handleConfirmRefund = async () => {
        if (!ticketToRefund) return;
        const ticketId = ticketToRefund.id;

        setIsConfirmModalOpen(false);
        setProcessingId(ticketId);

        try {
            await api.refund.requestRefund(ticketId, 'Solicitud del usuario');
            showNotification('Reembolso procesado exitosamente', 'success');
            fetchTickets(); // Refresh list
        } catch (error) {
            console.error('Refund error:', error);
            showNotification(error.userMessage || 'Error al procesar reembolso', 'error');
        } finally {
            setProcessingId(null);
            setTicketToRefund(null);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando boletos...</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Solicitar Reembolso</h1>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-8 text-sm text-yellow-800">
                <strong>Política de Reembolsos:</strong>
                <ul className="list-disc ml-5 mt-2">
                    <li>Solo boletos activos (no usados).</li>
                    <li>Hasta 48 horas antes del evento.</li>
                    <li>Si el evento se cancela, el reembolso es automático (no necesitas solicitarlo aquí).</li>
                </ul>
            </div>

            {tickets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map(ticket => (
                        <Card key={ticket.id} className="p-4 flex flex-col justify-between h-full bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div>
                                <h3 className="font-bold text-lg mb-2">{ticket.event_name}</h3>
                                <p className="text-gray-500 text-sm mb-4">
                                    {new Date(ticket.event_date).toLocaleDateString()}
                                </p>
                                <div className="flex justify-between items-center text-sm mb-4">
                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                        {ticket.ticket_code}
                                    </span>
                                    <span className="font-bold text-gray-900">
                                        ${parseFloat(ticket.price).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="small"
                                onClick={() => handleRequestRefund(ticket)}
                                isLoading={processingId === ticket.id}
                                disabled={!!processingId}
                            >
                                Solicitar Reembolso
                            </Button>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
                    <p>No tienes boletos activos elegibles para reembolso.</p>
                </div>
            )}

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    setIsConfirmModalOpen(false);
                    setTicketToRefund(null);
                }}
                onConfirm={handleConfirmRefund}
                title="Confirmar Reembolso"
                message={`¿Estás seguro de solicitar el reembolso para el evento "${ticketToRefund?.event_name}"? Esta acción cancelará tu boleto inmediatamente y no se puede deshacer.`}
                confirmText="Sí, rembolsar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};

export default RefundRequest;
