import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ManagerStatsCards from './components/ManagerStatsCards';
import { useNotification } from '../../context/NotificationContext';
import { PermissionWall } from '../../components';
import '../../styles/manager.css';

const ManagerStatsPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { error } = useNotification();

    useEffect(() => {
        const fetchStatsData = async () => {
            try {
                const response = await api.manager.getMyEvents();
                setEvents(response);
            } catch (err) {
                error('Error al cargar estadísticas');
            } finally {
                setLoading(false);
            }
        };
        fetchStatsData();
    }, [error]);

    const stats = {
        total: events.length,
        published: events.filter(e => e.status === 'published').length,
        draft: events.filter(e => e.status === 'draft').length,
        totalSold: events.reduce((acc, curr) => acc + (parseInt(curr.tickets_sold) || 0), 0)
    };

    if (loading) return <div className="p-8 text-center text-white">Cargando métricas...</div>;

    return (
        <PermissionWall permission="canViewStats" label="Estadísticas de Gestión">
        <div className="manager-container">
            <div className="manager-header">
                <div className="manager-title">
                    <h1>Estadísticas de Gestión</h1>
                    <p>Rendimiento general de tus eventos y ventas</p>
                </div>
            </div>

            <ManagerStatsCards stats={stats} />

            <div className="mt-8">
                {/* Aquí podrías añadir un gráfico de ventas en el futuro */}
                <div className="manager-stat-card" style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                    <p className="text-muted">Espacio reservado para Gráfica de Tendencia de Ventas (Próximamente)</p>
                </div>
            </div>
        </div>
        </PermissionWall>
    );
};

export default ManagerStatsPage;
