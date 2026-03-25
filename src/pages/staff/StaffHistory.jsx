import React, { useState, useEffect } from 'react'
import StaffHistoryList from './components/StaffHistoryList'
import StaffStats from './components/StaffStats'
import './StaffDashboard.css'

const StaffHistory = () => {
    const [scanHistory, setScanHistory] = useState([])

    useEffect(() => {
        const savedHistory = localStorage.getItem('staff_scan_history')
        if (savedHistory) {
            try {
                setScanHistory(JSON.parse(savedHistory))
            } catch (e) {
                console.error('Error parsing scan history', e)
            }
        }
    }, [])

    return (
        <div className="staff-dashboard">
            <div className="dashboard-header">
                <h1>Historial de Verificaciones</h1>
                <p>Resumen de actividad de la sesión actual</p>
            </div>

            <StaffStats history={scanHistory} />

            <div style={{ marginTop: '2rem' }}>
                <StaffHistoryList history={scanHistory} />
            </div>
        </div>
    )
}

export default StaffHistory;
