import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * SkeletonContext — UN SOLO timer compartido por TODA la app.
 */
const SkeletonContext = createContext({
    showSkeleton: true,
    startLoading: () => {},
    stopLoading: () => {}
})

export const SkeletonProvider = ({ children, minDuration = 0 }) => {
    const [timerActive, setTimerActive] = useState(true)
    const [loadingKeys, setLoadingKeys] = useState(new Set())
    const location = useLocation()

    useEffect(() => {
        // Cada vez que cambia la ruta, activamos el timer del skeleton
        setTimerActive(true)

        const timer = setTimeout(() => {
            setTimerActive(false)
        }, minDuration)

        return () => clearTimeout(timer)
    }, [location.pathname, minDuration])

    const startLoading = useCallback((key) => {
        setLoadingKeys(prev => {
            if (prev.has(key)) return prev
            const next = new Set(prev)
            next.add(key)
            return next
        })
    }, [])

    const stopLoading = useCallback((key) => {
        setLoadingKeys(prev => {
            if (!prev.has(key)) return prev
            const next = new Set(prev)
            next.delete(key)
            return next
        })
    }, [])

    const showSkeleton = timerActive || loadingKeys.size > 0

    return (
        <SkeletonContext.Provider value={{ showSkeleton, startLoading, stopLoading }}>
            {children}
        </SkeletonContext.Provider>
    )
}

export const useSkeletonContext = () => useContext(SkeletonContext)

export default SkeletonContext
