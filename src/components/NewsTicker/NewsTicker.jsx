import React, { useEffect, useState } from 'react'
import { tickerAPI } from '../../services'
import './NewsTicker.css'

const NewsTicker = ({ settings: propSettings }) => {
    const [settings, setSettings] = useState(propSettings || null)
    const [loading, setLoading] = useState(!propSettings)

    useEffect(() => {
        if (propSettings) {
            setSettings(propSettings)
            setLoading(false)
            return
        }

        const fetchSettings = async () => {
            try {
                // Cache buster for extra reliability
                const data = await tickerAPI.getSettings({ _t: Date.now() })
                if (data) {
                    setSettings(data)
                } else {
                    // Fallback to default values if data is empty/null
                    setSettings({
                        text: '🔥 PRÓXIMOS EVENTOS • ⚡ OFERTAS EXCLUSIVAS • ✨ CLUB LAIKA •',
                        backgroundColor: '#000000',
                        textColor: '#ffffff',
                        speed: 20
                    })
                }
            } catch (err) {
                console.error("Error fetching ticker settings:", err)
                // Fallback a valores por defecto solo si falla la carga
                setSettings({
                    text: '🔥 PRÓXIMOS EVENTOS • ⚡ OFERTAS EXCLUSIVAS • ✨ CLUB LAIKA •',
                    backgroundColor: '#000000',
                    textColor: '#ffffff',
                    speed: 20
                })
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [propSettings])

    if (loading || !settings) return null // No renderizar nada hasta tener los datos

    return (
        <div
            className="news-ticker-container"
            style={{
                backgroundColor: settings.backgroundColor,
                color: settings.textColor
            }}
        >
            <div
                className="news-ticker-scroll"
                style={{
                    animationDuration: `${settings.speed}s`
                }}
            >
                <span>{settings.text}</span>
                <span>{settings.text}</span>
            </div>
        </div>
    )
}

export default NewsTicker
