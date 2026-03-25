import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/manager.css';

const RevenuePanel = ({ eventId }) => {
    const [revenueData, setRevenueData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRevenue();
        const interval = setInterval(() => fetchRevenue(true), 15000);
        return () => clearInterval(interval);
    }, [eventId]);

    const fetchRevenue = async (background = false) => {
        try {
            if (!background) setLoading(true);
            const data = await api.manager.getEventRevenue(eventId);
            setRevenueData(data);
        } catch (error) {
            console.error('Error fetching revenue:', error);
        } finally {
            if (!background) setLoading(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Cargando ingresos...</div>;
    if (!revenueData) return <div className="p-4 text-center">No hay datos financieros</div>;

    const {
        gross,
        refunded_amount,
        net,
        tickets_sold,
        tickets_refunded,
        projected_total
    } = revenueData;

    return (
        <div className="revenue-panel">
            <h3 className="text-lg font-semibold mb-4">Reporte Financiero</h3>

            <div className="revenue-detail-grid">
                {/* Main Revenue Card */}
                <div className="revenue-main-card">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Ingreso Neto Total
                    </span>
                    <div className="total-revenue-display">
                        ${net.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-gray-400">
                        Después de reembolsos y ajustes
                    </p>
                </div>

                {/* Breakdown List */}
                <div className="revenue-breakdown">
                    <div className="breakdown-item">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-600">Ventas Brutas</span>
                            <span className="text-xs text-gray-400">{tickets_sold} tickets</span>
                        </div>
                        <span className="font-bold text-gray-800">
                            +${gross.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="breakdown-item" style={{ borderLeft: '4px solid #dc3545' }}>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-red-600">Reembolsos</span>
                            <span className="text-xs text-gray-400">{tickets_refunded} tickets</span>
                        </div>
                        <span className="font-bold text-red-600">
                            -${refunded_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                    </div>

                    <div className="breakdown-item" style={{ borderLeft: '4px solid #28a745' }}>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-green-600">Proyección Total</span>
                            <span className="text-xs text-gray-400">Si se vende el 100%</span>
                        </div>
                        <span className="font-bold text-green-600">
                            ${projected_total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600">
                <p>
                    <strong>Nota:</strong> Los ingresos mostrados son brutos antes de comisiones de pasarela de pago (si aplican).
                    El ingreso neto real depositado en cuenta puede variar un 3-5% dependiendo del proveedor de pagos.
                </p>
            </div>
        </div>
    );
};

export default RevenuePanel;
