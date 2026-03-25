import React, { useState, useEffect } from 'react';
import { Card, Icon, Badge } from '../../components';
import { managerAPI } from '../../services/managerService';
import '../../styles/manager.css';

const ManagerAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [timeRange, setTimeRange] = useState('7d');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Fetch real analytics from the API
                const response = await managerAPI.getAnalytics?.(timeRange) || {
                    revenue: [],
                    tickets: [],
                    categories: [],
                    labels: []
                };
                
                // Fallback to zeros if no data
                setData({
                    revenue: response.revenue?.length ? response.revenue : [0, 0, 0, 0, 0, 0, 0],
                    tickets: response.tickets?.length ? response.tickets : [0, 0, 0, 0, 0, 0, 0],
                    categories: response.categories?.length ? response.categories : [],
                    labels: response.labels?.length ? response.labels : ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
                });
            } catch (error) {
                console.error('Error loading analytics:', error);
                setData({
                    revenue: [0, 0, 0, 0, 0, 0, 0],
                    tickets: [0, 0, 0, 0, 0, 0, 0],
                    categories: [],
                    labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
                });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [timeRange]);

    if (loading) return null;

    // Simple Line Chart SVG
    const renderLineChart = (values, color) => {
        const max = Math.max(...values);
        const width = 100;
        const height = 40;
        const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - (v / max) * height}`).join(' ');

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="analytics-svg">
                <polyline
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    points={points}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />
            </svg>
        );
    };

    return (
        <div className="analytics-grid">
            <Card title="Rendimiento de Ventas" className="span-2">
                <div className="chart-header">
                    <div className="chart-title">
                        <h2>$ {(data?.revenue?.reduce((a, b) => a + b, 0) || 0).toLocaleString()} MXN</h2>
                        <Badge variant="success">+12.5% vs semana pasada</Badge>
                    </div>
                    <div className="chart-filters">
                        <button className={timeRange === '24h' ? 'active' : ''} onClick={() => setTimeRange('24h')}>24h</button>
                        <button className={timeRange === '7d' ? 'active' : ''} onClick={() => setTimeRange('7d')}>7d</button>
                        <button className={timeRange === '30d' ? 'active' : ''} onClick={() => setTimeRange('30d')}>30d</button>
                    </div>
                </div>
                <div className="chart-body">
                    {data?.revenue && renderLineChart(data.revenue, 'var(--primary-color)')}
                </div>
                <div className="chart-labels">
                    {data?.labels?.map(l => <span key={l}>{l}</span>)}
                </div>
            </Card>

            <Card title="Tickets por Categoría">
                <div className="pie-container">
                    {data?.categories?.length > 0 ? data.categories.map((cat, idx) => (
                        <div key={cat?.name || idx} className="pie-item">
                            <div className="pie-info">
                                <span>{cat?.name || 'Otro'}</span>
                                <strong>{cat?.value || 0}%</strong>
                            </div>
                            <div className="pie-bar-bg">
                                <div
                                    className="pie-bar-fill"
                                    style={{ width: `${cat?.value || 0}%`, backgroundColor: `hsl(${idx * 40}, 70%, 50%)` }}
                                ></div>
                            </div>
                        </div>
                    )) : <div className="text-muted text-center py-8">Sin categorías registradas</div>}
                </div>
            </Card>

            <Card title="Volumen de Boletos">
                <div className="chart-body compact">
                    {data?.tickets ? renderLineChart(data.tickets, '#fff') : <div className="text-muted text-center py-8">Sin datos de volumen</div>}
                </div>
                <div className="chart-footer">
                    <span>Total: {data?.tickets?.reduce((a, b) => a + b, 0) || 0} boletos</span>
                </div>
            </Card>
        </div>
    );
};

export default ManagerAnalytics;
