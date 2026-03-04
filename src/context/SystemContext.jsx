import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const SystemContext = createContext(null)

export const SystemProvider = ({ children }) => {
  const { user } = useAuth()
  const [config, setConfig] = useState({
    maintenanceMode: false,
    sessionTimeout: 30, // Default
    registrationEnabled: true
  })

  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [isRestored, setIsRestored] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState(Date.now())

  // Polling Strategy
  // Maintenance Active -> Poll every 10s
  // Normal -> Poll every 60s
  const getPollInterval = () => (maintenanceMode ? 10000 : 60000)

  const checkStatus = useCallback(async () => {
    try {
      // We use the full config endpoint as it's lightweight (in-memory backend)
      // and we need sessionTimeout anyway.
      const sysConfig = await api.config.getConfig()

      const newMaintenanceMode = sysConfig.maintenanceMode || sysConfig.maintenance_mode || false

      // Check for restoration (Transition True -> False)
      if (maintenanceMode && !newMaintenanceMode) {
        setIsRestored(true)
        // Auto-hide restored message after 5s or handle in UI
      }

      setMaintenanceMode(newMaintenanceMode)
      setConfig({
        maintenanceMode: newMaintenanceMode,
        sessionTimeout: sysConfig.sessionTimeout || sysConfig.session_timeout || 30,
        registrationEnabled: sysConfig.registrationEnabled !== false
      })

      setLastCheck(Date.now())

    } catch (error) {
      console.error('System Check Failed:', error)
      // Don't change state on error to avoid flickering,
      // but maybe strict mode would want to assume worst?
      // For now, keep last known state.
    } finally {
      setIsLoading(false)
    }
  }, [maintenanceMode])

  // Initial Load
  useEffect(() => {
    checkStatus()
  }, [])

  // Poll Loop
  useEffect(() => {
    const intervalId = setInterval(checkStatus, getPollInterval())
    return () => clearInterval(intervalId)
  }, [getPollInterval, checkStatus])

  // Context Value
  const value = {
    config,
    maintenanceMode,
    isRestored,
    isLoading,
    lastCheck,
    refreshConfig: checkStatus
  }

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
}

export const useSystem = () => {
  const context = useContext(SystemContext)
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider')
  }
  return context
}

export default SystemContext
