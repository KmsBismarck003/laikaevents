import React from 'react'
import useSessionTimeout from '../hooks/useSessionTimeout'

const SessionManager = () => {
    // This component purely invokes the hook to ensure it runs
    // whenever the App is mounted and within the AuthProvider/SystemProvider context.
    useSessionTimeout()
    return null
}

export default SessionManager
