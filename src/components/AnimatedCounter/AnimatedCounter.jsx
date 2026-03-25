import React, { useState, useEffect } from 'react'

/**
 * AnimatedCounter
 * Animates a number from 0 to target value.
 * Restarts every repeatInterval (default 4 seconds).
 */
const AnimatedCounter = ({ value, duration = 1500, repeatInterval = 4000 }) => {
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        let startTime
        let animationFrame

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = timestamp - startTime
            const percentage = Math.min(progress / duration, 1)

            // Easing function: easeOutExpo
            const easing = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage)
            setDisplayValue(Math.floor(easing * value))

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate)
            }
        }

        const runAnimation = () => {
            startTime = null
            animationFrame = requestAnimationFrame(animate)
        }

        // Initial run
        runAnimation()

        return () => {
            cancelAnimationFrame(animationFrame)
        }
    }, [value, duration])

    return <span>{displayValue.toLocaleString()}</span>
}

export default AnimatedCounter
