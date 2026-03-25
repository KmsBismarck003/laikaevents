import React, { useState, useEffect } from 'react'
import { useNotification } from '../../context/NotificationContext'
import StaffTerminal from './StaffTerminal'
import StaffHistoryList from './components/StaffHistoryList'
import StaffStats from './components/StaffStats'
import './StaffDashboard.css'

const StaffDashboard = () => {
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
      <StaffTerminal />
      <div style={{ marginTop: '1rem' }}>
        <StaffHistoryList history={scanHistory} />
      </div>
    </div>
  )
}

export default StaffDashboard
