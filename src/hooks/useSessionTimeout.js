import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSystem } from '../context/SystemContext'

const EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart']

export const useSessionTimeout = () => {
  const { user, logout } = useAuth()
  const { config } = useSystem()

  // Refs to avoid re-renders / dependency loops
  const timerRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  const getTimeoutMs = () => (config.sessionTimeout || 30) * 60 * 1000

  const performLogout = useCallback(() => {
    console.warn('🕒 Session Timed Out')
    logout(true) // Redirect to login
    // Broadcast logout to other tabs
    window.localStorage.setItem('logout-event', Date.now())
  }, [logout])

  const checkActivity = useCallback(() => {
    if (!user) return

    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityRef.current
    const timeoutMs = getTimeoutMs()

    if (timeSinceLastActivity > timeoutMs) {
      performLogout()
    }
  }, [user, config.sessionTimeout, performLogout])

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    localStorage.setItem('last-activity', Date.now())
  }, [])

  // 1. Activity Listeners
  useEffect(() => {
    if (!user) return

    const handleActivity = () => {
      // Optimization: Throttle updates to localStorage?
      // For now, just update ref, and maybe LS every minute?
      // User requested robust multi-tab.
      // If we update LS on every move, it causes a lot of writes.
      // Better: Write to LS on activity only if > 5s passed?

      const now = Date.now()
      if (now - lastActivityRef.current > 5000) {
           lastActivityRef.current = now
           localStorage.setItem('last-activity', now)
      }
    }

    EVENTS.forEach(event => window.addEventListener(event, handleActivity))

    return () => {
      EVENTS.forEach(event => window.removeEventListener(event, handleActivity))
    }
  }, [user])

  // 2. Interval Check (Handles Sleep Mode & Idle)
  useEffect(() => {
    if (!user) return

    // Sync init
    const storedLast = localStorage.getItem('last-activity')
    if (storedLast) {
        const last = parseInt(storedLast, 10)
        if (last > lastActivityRef.current) {
            lastActivityRef.current = last
        }
    }

    const intervalId = setInterval(checkActivity, 1000) // Check every second

    return () => clearInterval(intervalId)
  }, [user, checkActivity])

  // 3. Multi-tab Activity Sync (Storage Event)
  useEffect(() => {
      const handleStorage = (e) => {
          if (e.key === 'last-activity' && e.newValue) {
              // Another tab was active
              const remoteActivity = parseInt(e.newValue, 10)
              if (remoteActivity > lastActivityRef.current) {
                  lastActivityRef.current = remoteActivity
              }
          }
          if (e.key === 'logout-event') {
              // Another tab logged out
              logout(true)
          }
      }

      window.addEventListener('storage', handleStorage)
      return () => window.removeEventListener('storage', handleStorage)
  }, [logout])

  return { resetTimer }
}

export default useSessionTimeout
