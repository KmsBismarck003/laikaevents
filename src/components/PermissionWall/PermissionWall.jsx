import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import './PermissionWall.css'

/**
 * PermissionWall — Protege secciones con blur + overlay cuando el usuario no tiene permiso.
 *
 * - admin: siempre accede
 * - usuario: blur + mensaje de restricción (sin botón, sin mencionar admin)
 * - gestor/operador: blur + mensaje + botón "Solicitar acceso"
 *
 * Verifica desde el servidor en cada mount → tiempo real, resistente a DevTools.
 *
 * @param {string}  permission  - Clave del permiso (ej: 'canPurchaseTickets')
 * @param {string}  label       - Nombre amigable de la función (ej: 'Compra de Boletos')
 * @param {node}    children    - Contenido a proteger
 */
const PermissionWall = ({ permission, label = 'esta función', children }) => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [hasPermission, setHasPermission] = useState(isAdmin ? true : null)
  const [requestSent, setRequestSent] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const checkPermission = useCallback(async () => {
    if (isAdmin || !user?.id) { setHasPermission(true); return }

    try {
      const data = await api.user.getPermissions(user.id)
      const perms = typeof data.permissions === 'string'
        ? JSON.parse(data.permissions)
        : (data.permissions || {})
      setHasPermission(!!perms[permission])
    } catch {
      // Fallback a permisos locales si el servidor no responde
      const local = user?.permissions || {}
      setHasPermission(local[permission] !== undefined ? !!local[permission] : true)
    }
  }, [user?.id, permission, isAdmin, user?.permissions])

  useEffect(() => { checkPermission() }, [checkPermission])

  // Cargando: render transparente para no hacer flash
  if (hasPermission === null) return <>{children}</>
  // Tiene acceso: render normal
  if (hasPermission) return <>{children}</>

  const canRequest = ['gestor', 'operador'].includes(user?.role)

  const handleRequest = async () => {
    if (!canRequest || requestSent) return
    setRequesting(true)
    try {
      await api.user.requestPermission(permission)
    } catch { /* Confirmamos igual */ }
    finally {
      setRequestSent(true)
      setRequesting(false)
    }
  }

  return (
    <div className="pw-wrapper">
      {/* Contenido difuminado — blur real en CSS, no hidden */}
      <div className="pw-blurred" aria-hidden="true">{children}</div>

      {/* Overlay */}
      <div className="pw-overlay">
        <div className="pw-card">
          <div className="pw-lock-icon">🔒</div>

          {user?.role === 'usuario' ? (
            <>
              <h3 className="pw-title">Acceso restringido</h3>
              <p className="pw-desc">
                Tu acceso a <strong>{label}</strong> ha sido restringido por
                incumplimiento de políticas. Espera a que sea reactivado.
              </p>
            </>
          ) : (
            <>
              <h3 className="pw-title">Función no habilitada</h3>
              <p className="pw-desc">
                No tienes acceso a <strong>{label}</strong> en este momento.
                {canRequest && ' Puedes solicitar que te habiliten esta funcionalidad.'}
              </p>
            </>
          )}

          {canRequest && !requestSent && (
            <button className="pw-btn-request" onClick={handleRequest} disabled={requesting}>
              {requesting ? 'Enviando...' : '🔑 Solicitar acceso'}
            </button>
          )}

          {requestSent && (
            <div className="pw-sent">✅ Solicitud enviada. Espera la activación.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PermissionWall
