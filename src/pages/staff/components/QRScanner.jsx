import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import '../StaffDashboard.css'
import { Button } from '../../../components'

const QRScanner = ({ onScanSuccess, onScanFailure }) => {
  const [scanError, setScanError] = useState(null)
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const [cameras, setCameras] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState(null)
  const [isScanning, setIsScanning] = useState(false)

  const scannerRef = useRef(null)
  const scannerContainerId = "qr-reader-container"

  // Función para iniciar el escáner
  const startScanner = useCallback(async (cameraId) => {
    if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId)
    }

    try {
        setScanError(null)
        await scannerRef.current.start(
            cameraId,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            },
            (decodedText, decodedResult) => {
                // Success callback
                console.log("✅ QR Code detected", decodedText)
                if (onScanSuccess) onScanSuccess(decodedText)
            },
            (errorMessage) => {
                // Error callback (scanning...)
            }
        )
        setIsScanning(true)
    } catch (err) {
        console.error("Error starting scanner", err)
        setScanError(`No se pudo iniciar la cámara: ${err.message || err}`)
        setIsScanning(false)
    }
  }, [onScanSuccess])

  // Obtener cámaras y permisos al montar
  useEffect(() => {
    let mounted = true

    const getCameras = async () => {
        try {
            const devices = await Html5Qrcode.getCameras()
            if (mounted) {
                if (devices && devices.length) {
                    setCameras(devices)
                    // Prefer back camera
                    const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('trasera'))
                    const cameraId = backCamera ? backCamera.id : devices[0].id
                    setSelectedCameraId(cameraId)

                    // Auto-start
                    startScanner(cameraId)
                } else {
                    setScanError("No se encontraron cámaras disponibles.")
                }
            }
        } catch (err) {
            console.error("Error getting cameras", err)
            if (mounted) {
                setScanError("Error al acceder a la cámara. Asegúrate de dar permisos.")
            }
        }
    }

    getCameras()

    return () => {
        mounted = false
        if (scannerRef.current) {
            if (scannerRef.current.isScanning) {
                 scannerRef.current.stop().then(() => {
                     scannerRef.current.clear()
                 }).catch(err => console.error("Failed to stop scanner", err))
            } else {
                scannerRef.current.clear()
            }
        }
    }
  }, [startScanner])

  const handleRetry = () => {
       if (selectedCameraId) {
           startScanner(selectedCameraId)
       } else {
           window.location.reload() // Fallback drástico si no hay camaras detectadas
       }
  }

  return (
    <div className="qr-scanner-container">
      <div id={scannerContainerId} style={{ width: '100%', maxWidth: '500px', margin: '0 auto', minHeight: '300px', background: '#000' }}></div>

      {scanError && (
          <div className="scanner-error-container">
            <p className="error-text">{scanError}</p>
            <Button size="small" variant="secondary" onClick={handleRetry}>Reintentar</Button>
          </div>
      )}

      {!isScanning && !scanError && <p>Iniciando cámara...</p>}

      {cameras.length > 1 && (
         <div className="camera-select">
             <select
                onChange={(e) => {
                    const id = e.target.value
                    setSelectedCameraId(id)
                    if (scannerRef.current && scannerRef.current.isScanning) {
                        scannerRef.current.stop().then(() => startScanner(id))
                    } else {
                        startScanner(id)
                    }
                }}
                value={selectedCameraId || ''}
             >
                 {cameras.map(cam => (
                     <option key={cam.id} value={cam.id}>{cam.label || `Cámara ${cam.id}`}</option>
                 ))}
             </select>
         </div>
      )}

      <p className="scanner-instruction">Apunta la cámara al código QR del boleto</p>
    </div>
  )
}

export default QRScanner
