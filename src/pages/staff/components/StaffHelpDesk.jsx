import React, { useState } from 'react';
import { Card, Table, Button, Input, Icon, Badge } from '../../../components';
import { managerAPI } from '../../../services/managerService';
import { ticketAPI } from '../../../services/ticketService';
import { useNotification } from '../../../context/NotificationContext';

const StaffHelpDesk = ({ eventId }) => {
    const { success, error: showError } = useNotification();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            // Using managerAPI attendees for now, but filtering by query
            // In a real app, this would be a specialized search endpoint
            const allAttendees = await managerAPI.getAttendees(eventId);
            const filtered = allAttendees.filter(a => 
                (a.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (a.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (a.ticket?.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setResults(filtered);
        } catch (error) {
            showError('Error al buscar asistente');
        } finally {
            setLoading(false);
        }
    };

    const handleManualRedeem = async (ticketCode) => {
        try {
            await ticketAPI.redeem(ticketCode);
            success('Ingreso manual registrado correctamente');
            handleSearch(); // Refresh list
        } catch (error) {
            showError(error.message || 'Error al validar');
        }
    };

    const columns = [
        { key: 'name', header: 'Nombre' },
        { key: 'email', header: 'Email' },
        { key: 'ticket', header: 'Boleto' },
        { 
            key: 'status', 
            header: 'Estado',
            render: (status) => (
                <Badge variant={status === 'checked-in' ? 'success' : 'default'}>
                    {status === 'checked-in' ? 'INGRESADO' : 'PENDIENTE'}
                </Badge>
            )
        },
        {
            key: 'actions',
            header: 'Acción',
            render: (_, row) => (
                row.status !== 'checked-in' && (
                    <Button size="small" variant="success" onClick={() => handleManualRedeem(row.ticket)}>
                        Validar
                    </Button>
                )
            )
        }
    ];

    return (
        <div className="staff-help-desk">
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Input 
                    placeholder="Buscar por Nombre, Email o Código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth
                />
                <Button type="submit" variant="primary" loading={loading}>
                    <Icon name="search" size={16} />
                </Button>
            </form>

            <Table 
                columns={columns}
                data={results}
                emptyMessage="Realiza una búsqueda para ver resultados"
                hoverable
            />
        </div>
    );
};

export default StaffHelpDesk;
