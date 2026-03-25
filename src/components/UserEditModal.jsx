import React, { useState, useEffect, useRef } from 'react'
import { Modal, Input, Button, Icon } from './'
import api from '../services/api'
import { getImageUrl } from '../utils/imageUtils'

const UserEditModal = ({ isOpen, onClose, user, onUpdate }) => {
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: ''
    })
    const [photo, setPhoto] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const [errors, setErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (user && isOpen) {
            setForm({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone: user.phone || '',
                password: '',
                confirmPassword: '',
                role: user.role || 'usuario'
            })
            // Intentar cargar la foto del usuario
            const currentPhoto = user.avatar || user.photo_url || user.profile_photo || null
            setPhotoPreview(currentPhoto ? getImageUrl(currentPhoto) : null)
            setPhoto(null)
            setErrors({})
        }
    }, [user, isOpen])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setPhoto(file)
            const reader = new FileReader()
            reader.onloadend = () => setPhotoPreview(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const validate = () => {
        const errs = {}
        if (!form.first_name.trim()) errs.first_name = 'Nombre requerido'
        if (!form.last_name.trim()) errs.last_name = 'Apellido requerido'
        if (!form.email.trim()) errs.email = 'Email requerido'
        else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email inválido'

        if (form.password) {
            if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres'
            if (form.password !== form.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden'
        }

        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleSubmit = async (e) => {
        if (e) e.preventDefault()
        if (!validate()) return

        setSubmitting(true)
        try {
            // 1. Actualizar foto si hay una nueva (Usando endpoint ADMIN)
            if (photo) {
                await api.adminUsers.uploadPhoto(user.id, photo)
            }

            // 2. Actualizar datos base
            const { confirmPassword, ...userData } = form
            if (!userData.password) delete userData.password // No enviar password si está vacío

            await onUpdate(user.id, userData)
            onClose()
        } catch (err) {
            console.error('Error al editar usuario:', err)
        } finally {
            setSubmitting(false)
        }
    }

    const footer = (
        <div style={{ 
            display: 'flex', 
            gap: '20px', 
            justifyContent: 'flex-end', 
            width: '100%',
            padding: '24px 32px',
            borderTop: '1px solid rgba(0,0,0,0.06)'
        }}>
            <Button 
                variant="ghost" 
                onClick={onClose} 
                disabled={submitting}
                style={{ fontWeight: '700', letterSpacing: '0.05em' }}
            >
                CANCELAR
            </Button>
            <Button 
                variant="primary" 
                onClick={handleSubmit} 
                disabled={submitting}
                style={{ 
                    backgroundColor: '#1a1a1a', 
                    color: '#fff',
                    padding: '12px 24px',
                    fontWeight: '700',
                    letterSpacing: '0.05em'
                }}
            >
                {submitting ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </Button>
        </div>
    )

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="EDITAR USUARIO" 
            size="medium" 
            footer={footer}
            className="user-edit-modal-premium"
        >
            <form style={{ padding: '0 32px 32px' }}>
                {/* Sección de Foto Premium */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                    <div
                        style={{
                            width: '104px',
                            height: '104px',
                            borderRadius: '50%',
                            background: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            position: 'relative',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}
                        onClick={() => fileInputRef.current.click()}
                    >
                        {photoPreview ? (
                            <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontWeight: '900', fontSize: '14px', lineHeight: '1.1' }}>LAIKA</div>
                                    <div style={{ fontSize: '10px', letterSpacing: '1px', opacity: 0.8 }}>CLUB</div>
                                    <div style={{ color: '#000', fontSize: '8px', marginTop: '2px' }}>★★★★★</div>
                                </div>
                        )}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            width: '100%',
                            background: 'rgba(0,0,0,0.4)',
                            color: 'white',
                            fontSize: '9px',
                            fontWeight: '800',
                            textAlign: 'center',
                            padding: '4px 0',
                            letterSpacing: '1px'
                        }}>
                            EDITAR
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handlePhotoChange}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <Input
                        label="NOMBRE *"
                        name="first_name"
                        value={form.first_name}
                        onChange={handleChange}
                        error={errors.first_name}
                        required
                        fullWidth
                    />
                    <Input
                        label="APELLIDO *"
                        name="last_name"
                        value={form.last_name}
                        onChange={handleChange}
                        error={errors.last_name}
                        required
                        fullWidth
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <Input
                        label="EMAIL *"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                        fullWidth
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <Input
                        label="NUEVA CONTRASEÑA"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Dejar vacío para no cambiar"
                        error={errors.password}
                        fullWidth
                    />
                    <Input
                        label="CONFIRMAR CONTRASEÑA"
                        name="confirmPassword"
                        type="password"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repetir contraseña"
                        error={errors.confirmPassword}
                        fullWidth
                    />
                </div>

                <div>
                    <label style={{ 
                        display: 'block', 
                        fontSize: '0.7rem', 
                        fontWeight: '800', 
                        letterSpacing: '0.05em', 
                        marginBottom: '8px',
                        color: '#1a1a1a'
                    }}>
                        ROL *
                    </label>
                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="user-form-select"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: '#f8f8f8',
                            color: '#1a1a1a',
                            fontSize: '0.9rem',
                            outline: 'none'
                        }}
                    >
                        <option value="usuario">Usuario</option>
                        <option value="operador">Operador</option>
                        <option value="gestor">Gestor</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
            </form>
        </Modal>
    )
}

export default UserEditModal
