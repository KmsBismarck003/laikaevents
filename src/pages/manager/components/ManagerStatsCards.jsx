import React from 'react';
import { Card } from '../../../components';

const ManagerStatsCards = ({ stats }) => {
    return (
        <div className="manager-stats-grid">
            <div className="manager-stat-card">
                <div className="stat-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Total Eventos</span>
                    <span className="stat-value">{stats?.total || 0}</span>
                </div>
            </div>
            <div className="manager-stat-card">
                <div className="stat-icon-wrapper" style={{ color: '#28a745' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Publicados</span>
                    <span className="stat-value">{stats?.published || 0}</span>
                </div>
            </div>
            <div className="manager-stat-card">
                <div className="stat-icon-wrapper" style={{ color: '#007bff' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Tickets Vendidos</span>
                    <span className="stat-value">{stats?.totalSold || 0}</span>
                </div>
            </div>
        </div>
    );
};

export default ManagerStatsCards;
