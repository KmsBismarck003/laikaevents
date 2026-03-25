import { useState, useEffect } from 'react'

/**
 * useSkeleton - Hook que mantiene el estado de "cargando"
 * un mínimo de `minDuration` milisegundos aunque los datos lleguen antes.
 * 
 * @param {boolean} isLoading - Estado real de carga (del fetch/API)
 * @param {number}  minDuration - Duración mínima en ms (default: 3000)
 * @returns {boolean} showSkeleton - true mientras deba mostrarse el skeleton
 */
const useSkeleton = (isLoading, minDuration = 800) => {
    const [showSkeleton, setShowSkeleton] = useState(isLoading)
    const [startTime] = useState(() => Date.now())

    useEffect(() => {
        if (!isLoading) {
            const elapsed = Date.now() - startTime
            const remaining = Math.max(0, minDuration - elapsed)

            const timer = setTimeout(() => {
                setShowSkeleton(false)
            }, remaining)

            return () => clearTimeout(timer)
        } else {
            setShowSkeleton(true)
        }
    }, [isLoading, minDuration, startTime])

    return showSkeleton
}

export default useSkeleton
