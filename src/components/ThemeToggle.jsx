import React from 'react'
import { useTheme } from '../context/ThemeContext'
import Icon from './Icons'
import './ThemeToggle.css'

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      className="theme-toggle-float glass-effect"
      onClick={toggleTheme}
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Toggle theme"
    >
      <Icon name={isDark ? "sun" : "moon"} size={24} />
    </button>
  )
}

export default ThemeToggle
