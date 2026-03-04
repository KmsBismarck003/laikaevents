import React, { useState, useEffect } from 'react'
import './GlassBreaker.css'

// Simple crack paths for the SVG overlay
const CRACK_PATHS = [
  "M50 50 L20 20 M50 50 L80 20 M50 50 L50 10", // Initial cracks
  "M50 50 L20 20 M50 50 L80 20 M50 50 L50 10 M50 50 L80 80 M50 50 L20 80 M10 40 L30 50" // Complex cracks
]

const Spinner = ({
  size = 'medium', // 'small' | 'medium' | 'large'
  color = 'primary', // Kept for API compatibility, though GlassBreaker has its own palette
  fullScreen = false,
  text,
  progress: controlledProgress, // 0-100
  simulateProgress = false, // If true, auto-increments progress
  className = '',
  ...props
}) => {
  const [internalProgress, setInternalProgress] = useState(0)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  // Determine actual progress to use
  const progress = controlledProgress !== undefined ? controlledProgress : internalProgress

  // Accessibility check
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setIsReducedMotion(mediaQuery.matches)

    const handler = (e) => setIsReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Progress Simulation
  useEffect(() => {
    if (!simulateProgress || controlledProgress !== undefined) return

    let interval
    let current = 0

    // Simulation logic: fast start, then vary speed
    const advance = () => {
      // Random increment based on current stage
      let increment = 0
      if (current < 30) increment = Math.random() * 5 + 2 // Fast Start
      else if (current < 70) increment = Math.random() * 2 + 0.5 // Slow down mid
      else if (current < 95) increment = Math.random() * 1 + 0.2 // Crawl

      current = Math.min(current + increment, 99) // Cap at 99 until finished
      setInternalProgress(current)

      if (current < 99) {
        // Variable timing for "glitch" feel
        const nextTick = Math.random() * 200 + 50
        interval = setTimeout(advance, nextTick)
      }
    }

    advance()

    return () => clearTimeout(interval)
  }, [simulateProgress, controlledProgress])

  // Phase Calculation
  let phase = 1
  if (progress > 30) phase = 2
  if (progress > 70) phase = 3

  // Force Phase 1 for Reduced Motion
  if (isReducedMotion) phase = 1

  const isShattered = progress >= 100

  // Classes
  const containerClasses = [
    'glass-spinner',
    fullScreen && 'glass-spinner--fullscreen',
    isShattered && 'is-shattered',
    className
  ].filter(Boolean).join(' ')

  const sizeStyle = {
    transform: size === 'small' ? 'scale(0.6)' : size === 'large' ? 'scale(1.5)' : 'scale(1)'
  }

  return (
    <div
      className={containerClasses}
      data-phase={phase}
      style={fullScreen ? {} : sizeStyle}
      {...props}
    >
      <div className="glass-ring-container">
        {/* The Neon Ring */}
        <div className="glass-ring"></div>

        {/* The Core / Text */}
        <div className="glass-core">
          {Math.round(progress)}%
        </div>

        {/* Crack Overlays (Only visible in Phases 2 & 3) */}
        {!isReducedMotion && phase >= 2 && (
          <svg className="glass-cracks-svg" viewBox="0 0 100 100">
            <path
              d={phase === 2 ? CRACK_PATHS[0] : CRACK_PATHS[1]}
              className="crack-path"
            />
          </svg>
        )}
      </div>

      {text && (
        <div className="glass-text">
          {text}
        </div>
      )}
    </div>
  )
}

export default Spinner
