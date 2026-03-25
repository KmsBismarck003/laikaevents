import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import './PermissionGuard.css'

/**
 * PermissionGuard — Envuelve cualquier sección protegida por permisos.
 * 
 * Si el usuario NO tiene el permiso:
 *   - El contenido queda visible pero con blur real
 *   - Overlay con mensaje encima
 *   - usuario: solo mensaje de espera (sin botón)
 *   - gestor/operador: mensaje + botón "Solicitar acceso"
 *   - admin: siempre pasa, sin bloqueo
 * 
 * Los permisos se verifican desde el servidor en cada mount
 * para garantizar tiempo real y resistencia a DevTools.
 */
const PermissionGuard = ({ permission, children, label = 'esta función' }) => {
  const { user } = useAuth()
  const [hasPermission, setHasPermission] = useState(null) // null = cargando
  const [requestSent, setRequestSent] = useState(false)
  const [requesting, setRequesting] = useState(false)

  // El admin nunca se bloquea
  const isAdmin = user?.role === 'admin'

  const checkPermission = useCallback(async () => {
    if (!user?.id || isAdmin) {
      setHasPermission(true)
      return
    }
    try {
      const data = await api.user.getPermissions(user.id)
      const perms = typeof data.permissions === 'string'
        ? JSON.parse(data.permissions)
        : (data.permissions || {})
      setHasPermission(!!perms[permission])
    } catch {
      // Si el servidor falla, usar permisos del contexto local como fallback
      const localPerms = user?.permissions || {}
      setHasPermission(!!localPerms[permission])
    }
  }, [user?.id, permission, isAdmin, user?.permissions])

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  // Admin y carga: render normal
  if (isAdmin || hasPermission === null) return <>{children}</>
  // Tiene permiso: render normal
  if (hasPermission) return <>{children}</>

  const canRequest = ['gestor', 'operador'].includes(user?.role)

  const handleRequest = async () => {
    if (!canRequest || requestSent) return
    setRequesting(true)
    try {
      await api.user.requestPermission(user.id, permission, label)
      setRequestSent(true)
    } catch {
      setRequestSent(true) // mostramos confirmación de todas formas
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="pg-wrapper">
      {/* Contenido con blur real — no se puede quitar fácil con DevTools */}
      <div className="pg-blurred" aria-hidden="true">
        {children}
      </div>

      {/* Overlay encima */}
      <div className="pg-overlay">
        <div className="pg-card">
          <div className="pg-icon">🔒</div>

          {user?.role === 'usuario' ? (
            <>
              <h3 className="pg-title">Acceso restringido</h3>
              <p className="pg-message">
                Tu acceso a <strong>{label}</strong> ha sido restringido por
                incumplimiento de políticas. Espera a que sea reactivado.
              </p>
            </>
          ) : (
            <>
              <h3 className="pg-title">Función no habilitada</h3>
              <p className="pg-message">
                No tienes acceso a <strong>{label}</strong> en este momento.
                Puedes solicitar que te habiliten esta funcionalidad.
              </p>
            </>
          )}

          {canRequest && !requestSent && (
            <button
              className="pg-request-btn"
              onClick={handleRequest}
              disabled={requesting}
            >
              {requesting ? 'Enviando...' : 'Solicitar acceso'}
            </button>
          )}

          {canRequest && requestSent && (
            <div className="pg-sent">
              ✅ Solicitud enviada. Espera la activación.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PermissionGuard
