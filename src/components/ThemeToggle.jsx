import React from 'react'
import { useTheme } from '../context/ThemeContext'
import Icon from './Icons'
import './ThemeToggle.css'

const ThemeToggle = ({ variant = 'float' }) => {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      className={`theme-toggle-${variant} glass-effect`}
      onClick={toggleTheme}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Toggle theme"
    >
      <Icon name={isDark ? "sun" : "moon"} size={20} />
    </button>
  )
}

export default ThemeToggle
