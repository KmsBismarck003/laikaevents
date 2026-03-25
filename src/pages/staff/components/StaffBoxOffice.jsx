import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Icon, Badge, Table } from '../../../components';
import { eventAPI } from '../../../services/eventService';
import { ticketAPI } from '../../../services/ticketService';
import { useNotification } from '../../../context/NotificationContext';

const StaffBoxOffice = ({ eventId }) => {
    const { success, error: showError } = useNotification();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedSection, setSelectedSection] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId) return;
            setLoading(true);
            try {
                const data = await eventAPI.getById(eventId);
                setEvent(data);
            } catch (err) {
                showError('Error al cargar datos del evento');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    const handleSale = async () => {
        if (!selectedSection) return showError('Selecciona una sección');
        
        setIsProcessing(true);
        try {
            // Simplified sale for staff (assuming cash/external payment)
            const saleData = {
                event_id: eventId,
                section_id: selectedSection.id,
                quantity: parseInt(quantity),
                payment_method: 'cash_onsite',
                is_staff_sale: true
            };
            
            await ticketAPI.purchase(saleData);
            success('Venta completada exitosamente. Los boletos se han impreso/enviado.');
            setQuantity(1);
            setSelectedSection(null);
        } catch (err) {
            showError('Error al procesar la venta');
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) return <div>Cargando Taquilla...</div>;
    if (!event) return <div>Selecciona un evento para operar la taquilla</div>;

    return (
        <div className="staff-box-office">
            <div className="box-office-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem' }}>
                <Card title="Selección de Lugares">
                    <div className="sections-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {event.sections?.map(section => (
                            <div 
                                key={section.id} 
                                className={`section-selector-card ${selectedSection?.id === section.id ? 'active' : ''}`}
                                onClick={() => setSelectedSection(section)}
                                style={{ 
                                    padding: '1rem', 
                                    borderRadius: '12px', 
                                    border: selectedSection?.id === section.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    background: selectedSection?.id === section.id ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--bg-secondary)'
                                }}
                            >
                                <div style={{ fontWeight: 'bold' }}>{section.name}</div>
                                <div style={{ color: 'var(--primary-color)', fontSize: '1.1rem', margin: '0.4rem 0' }}>
                                    ${section.price?.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    {section.available_seats || 0} disponibles
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Resumen de Venta">
                    <div className="sale-summary-content">
                        <div className="summary-item mb-4">
                            <label className="label-premium">Cantidad</label>
                            <Input 
                                type="number" 
                                min="1" 
                                max="10" 
                                value={quantity} 
                                onChange={e => setQuantity(e.target.value)} 
                            />
                        </div>
                        
                        {selectedSection && (
                            <div className="total-box mt-6" style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Subtotal:</span>
                                    <span>${(selectedSection.price * quantity).toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                    <span>TOTAL:</span>
                                    <span>${(selectedSection.price * quantity).toLocaleString()} MXN</span>
                                </div>
                            </div>
                        )}

                        <div className="mt-8">
                            <Button 
                                variant="primary" 
                                fullWidth 
                                size="large" 
                                disabled={!selectedSection} 
                                loading={isProcessing}
                                onClick={handleSale}
                            >
                                <Icon name="shopping-cart" className="mr-2" />
                                FINALIZAR VENTA (EFECTIVO)
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default StaffBoxOffice;
