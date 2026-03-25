import React from 'react';
import { Card, Badge } from '../../../components';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const StaffHistoryList = ({ history = [] }) => {
    return (
        <Card title="Historial Reciente" className="history-card">
            {history.length === 0 ? (
                <div className="empty-history">
                    <p>No hay verificaciones recientes</p>
                </div>
            ) : (
                <div className="history-list">
                    {history.map((scan, index) => (
                        <div key={index} className="history-item">
                            <div className="history-icon">
                                {scan.status === 'valid' ? <CheckCircle size={24} color="#000000" /> :
                                    scan.status === 'used' ? <AlertTriangle size={24} color="#404040" /> :
                                        <XCircle size={24} color="#000000" />}
                            </div>
                            <div className="history-info">
                                <strong>{scan.ticketCode}</strong>
                                <p>{scan.eventName || 'Desconocido'}</p>
                                <small>{new Date(scan.scannedAt).toLocaleTimeString()}</small>
                            </div>
                            <Badge variant={
                                scan.status === 'valid' ? 'success' :
                                    scan.status === 'used' ? 'warning' : 'danger'
                            }>
                                {scan.status === 'valid' ? 'Válido' :
                                    scan.status === 'used' ? 'Usado' : 'Inválido'}
                            </Badge>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};

export default StaffHistoryList;
