import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Icon, Input, Badge, Modal } from '../../components';
import { managerAPI } from '../../services/managerService';
import { useNotification } from '../../context/NotificationContext';
import '../../styles/manager.css';

const ManagerAttendees = ({ eventId = null }) => {
    const { success, error: showError } = useNotification();
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCourtesyModal, setShowCourtesyModal] = useState(false);
    const [courtesyData, setCourtesyData] = useState({ name: '', email: '', sectionId: '' });
    const [isIssuing, setIsIssuing] = useState(false);

    useEffect(() => {
        const fetchAttendees = async () => {
            setLoading(true);
            try {
                // If no eventId passed, it might be and general view (needs backend support)
                const response = await managerAPI.getAttendees?.(eventId) || [];
                setAttendees(Array.isArray(response) ? response : []);
            } catch (error) {
                console.error('Error fetching attendees:', error);
                setAttendees([]);
            } finally {
                setLoading(false);
            }
        };
        if (eventId) fetchAttendees();
    }, [eventId]);

    const handleCourtesySubmit = async (e) => {
        e.preventDefault();
        if (!eventId) return showError('Debes seleccionar un evento primero');
        
        setIsIssuing(true);
        try {
            await managerAPI.issueCourtesy(eventId, courtesyData);
            success('Cortesía generada exitosamente. Se ha enviado al correo del invitado.');
            setShowCourtesyModal(false);
            setCourtesyData({ name: '', email: '', sectionId: '' });
            
            // Refresh list
            const response = await managerAPI.getAttendees(eventId);
            setAttendees(response);
        } catch (error) {
            showError('Error al generar cortesía. Verifica los datos.');
        } finally {
            setIsIssuing(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['Nombre', 'Email', 'Boleto', 'Puerta', 'Hora Ingreso', 'Estado'];
        const csvRows = attendees.map(a => [
            a.name,
            a.email,
            a.ticket,
            a.entry,
            a.time,
            a.status
        ].join(','));

        const csvContent = [headers.join(','), ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `asistentes_evento_${eventId || 'general'}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const columns = [
        { key: 'name', header: 'Asistente' },
        { key: 'email', header: 'Email' },
        { key: 'ticket', header: 'Boleto' },
        { key: 'entry', header: 'Puerta' },
        { key: 'time', header: 'Hora Ingreso' },
        {
            key: 'status',
            header: 'Estado',
            render: (val) => (
                <Badge variant={val === 'checked-in' ? 'success' : 'default'}>
                    {val === 'checked-in' ? 'INGRESADO' : 'PENDIENTE'}
                </Badge>
            )
        }
    ];

    const filtered = attendees.filter(a => {
        const name = a?.name?.toLowerCase() || '';
        const email = a?.email?.toLowerCase() || '';
        const ticket = a?.ticket?.toLowerCase() || '';
        const searchLower = search.toLowerCase();
        
        return name.includes(searchLower) ||
               email.includes(searchLower) ||
               ticket.includes(searchLower);
    });

    return (
        <Card title="Gestor de Asistentes">
            <div className="table-actions" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <Input
                    placeholder="Buscar por nombre, email o boleto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                />
                <Button variant="primary" onClick={exportToCSV}>
                    <Icon name="download" size={16} className="mr-2" />
                    Exportar XLSX/CSV
                </Button>
                <Button variant="outline" onClick={() => setShowCourtesyModal(true)}>
                    <Icon name="star" size={16} className="mr-2" />
                    Generar Cortesía
                </Button>
            </div>

            <Table
                columns={columns}
                data={filtered}
                hoverable
                emptyMessage="No se encontraron asistentes"
            />

            {/* Modal de Cortesía */}
            <Modal
                isOpen={showCourtesyModal}
                onClose={() => setShowCourtesyModal(false)}
                title="GENERAR CORTESÍA (VIP GUEST)"
                size="medium"
            >
                <form onSubmit={handleCourtesySubmit} className="courtesy-form">
                    <div className="form-group mb-4">
                        <label className="label-premium">NOMBRE COMPLETO DEL INVITADO</label>
                        <Input 
                            value={courtesyData.name}
                            onChange={e => setCourtesyData({...courtesyData, name: e.target.value})}
                            placeholder="Ej. Juan Pérez"
                            required
                        />
                    </div>
                    <div className="form-group mb-4">
                        <label className="label-premium">CORREO ELECTRÓNICO</label>
                        <Input 
                            type="email"
                            value={courtesyData.email}
                            onChange={e => setCourtesyData({...courtesyData, email: e.target.value})}
                            placeholder="ejemplo@correo.com"
                            required
                        />
                        <p className="text-xs text-silver mt-1">El boleto digital se enviará a esta dirección.</p>
                    </div>
                    <div className="modal-footer mt-6" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button type="button" variant="outline" onClick={() => setShowCourtesyModal(false)}>CANCELAR</Button>
                        <Button type="submit" variant="primary" loading={isIssuing}>
                            <Icon name="check" size={16} className="mr-2" />
                            CONFIRMAR Y EMITIR
                        </Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
};

export default ManagerAttendees;
