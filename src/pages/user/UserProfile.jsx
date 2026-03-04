import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, Alert, Spinner } from '../../components';
import api from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/Icons';
import './User.css';

const UserProfile = () => {
    const { success, error: showError } = useNotification();
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: ''
    });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const profileResponse = await api.user.getProfile();
            setProfileData({
                firstName: profileResponse.firstName || profileResponse.first_name || '',
                lastName: profileResponse.lastName || profileResponse.last_name || '',
                email: profileResponse.email || '',
                phone: profileResponse.phone || '',
                birthDate: profileResponse.birthDate || profileResponse.birth_date || ''
            });
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            showError('Error al cargar información del perfil');
            if (currentUser) {
                setProfileData({
                    firstName: currentUser.firstName || '',
                    lastName: currentUser.lastName || '',
                    email: currentUser.email || '',
                    phone: currentUser.phone || '',
                    birthDate: ''
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        try {
            await api.user.updateProfile({
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                email: profileData.email,
                phone: profileData.phone,
                birth_date: profileData.birthDate
            });
            success('Perfil actualizado correctamente');
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            showError(error.message || 'Error al actualizar el perfil');
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="user-profile-settings">
            <div className="flex items-center mb-4 gap-2">
                <h2 className="mb-0">Editar Perfil</h2>
                <Icon name="edit" size={24} className="text-primary" />
            </div>
            <Card>
                <div className="profile-form-grid" style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input
                            label="Nombre"
                            name="firstName"
                            value={profileData.firstName}
                            onChange={handleInputChange}
                            fullWidth
                        />
                        <Input
                            label="Apellido"
                            name="lastName"
                            value={profileData.lastName}
                            onChange={handleInputChange}
                            fullWidth
                        />
                    </div>

                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        fullWidth
                        disabled
                        helperText="El email no se puede modificar"
                    />

                    <Input
                        label="Teléfono"
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        fullWidth
                    />

                    <Input
                        label="Fecha de Nacimiento"
                        type="date"
                        name="birthDate"
                        value={profileData.birthDate}
                        onChange={handleInputChange}
                        fullWidth
                    />

                    <div className="form-actions mt-4" style={{ display: 'flex', gap: '1rem' }}>
                        <Button variant="primary" onClick={handleSaveProfile}>
                            Guardar Cambios
                        </Button>
                        <Button variant="secondary" onClick={() => alert("Función no disponible")}>
                            Cambiar Contraseña
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default UserProfile;
