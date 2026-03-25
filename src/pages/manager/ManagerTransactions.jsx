import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Icon, Input } from '../../components';
import { managerAPI } from '../../services/managerService';
import '../../styles/manager.css';

const ManagerTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            setLoading(true);
            try {
                const response = await managerAPI.getTransactions?.() || [];
                setTransactions(Array.isArray(response) ? response : []);
            } catch (error) {
                console.error('Error fetching transactions:', error);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    const columns = [
        { key: 'id', header: 'ID Transacción' },
        {
            key: 'date',
            header: 'Fecha/Hora',
            render: (val) => new Date(val).toLocaleString()
        },
        { key: 'event', header: 'Evento' },
        { key: 'user', header: 'Cliente' },
        {
            key: 'amount',
            header: 'Monto',
            render: (val) => `$ ${val.toLocaleString()} MXN`
        },
        {
            key: 'status',
            header: 'Estado',
            render: (val) => (
                <Badge variant={val === 'confirmed' ? 'success' : 'warning'}>
                    {val.toUpperCase()}
                </Badge>
            )
        },
        { key: 'provider', header: 'Pasarela' }
    ];

    const filtered = transactions.filter(t => {
        const id = String(t?.id || '').toLowerCase();
        const user = t?.user?.toLowerCase() || '';
        const eventFull = t?.event?.toLowerCase() || '';
        const searchLower = search.toLowerCase();

        return id.includes(searchLower) ||
               user.includes(searchLower) ||
               eventFull.includes(searchLower);
    });

    return (
        <Card title="Auditoría de Transacciones">
            <div className="table-actions" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                <Input
                    placeholder="Buscar por ID, Cliente o Evento..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                />
                <Button variant="outline">
                    <Icon name="download" size={16} className="mr-2" />
                    Exportar CSV
                </Button>
            </div>

            <Table
                columns={columns}
                data={filtered}
                hoverable
                striped
                emptyMessage="No hay transacciones registradas"
            />
        </Card>
    );
};

export default ManagerTransactions;
