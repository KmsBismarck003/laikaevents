import React, { useState } from 'react';
import { useNotification } from '../../../context/NotificationContext';
import { authAPI } from '../../../services';
import { Button, Input, ConfirmationModal } from '../../../components';
import { Mail, Send, Eye, ShieldCheck, Users } from 'lucide-react';
import './EmailManager.css';

const EmailManager = () => {
    const [content, setContent] = useState('');
    const [testEmail, setTestEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const { success, error: showError } = useNotification();

    const handleSendTest = async () => {
        if (!testEmail) return showError('Ingresa un correo de prueba');
        setTestLoading(true);
        try {
            const res = await authAPI.testEmail(testEmail);
            if (res.status === 'success') {
                success('Correo de prueba enviado correctamente');
            } else {
                showError('Error al enviar la prueba. Verifica tu configuración SMTP.');
            }
        } catch (err) {
            showError('Falla crítica en el servicio de email');
        } finally {
            setTestLoading(false);
        }
    };

    const [isSendModalOpen, setIsSendModalOpen] = useState(false);

    const handleBroadcast = () => {
        if (!content) return showError('El contenido no puede estar vacío');
        setIsSendModalOpen(true);
    };

    const handleConfirmBroadcast = async () => {
        setIsSendModalOpen(false);
        setLoading(true);
        try {
            const res = await authAPI.broadcastAnnouncement(content);
            if (res.status === 'success') {
                success(`Campaña enviada con éxito a ${res.sent_to} usuarios`);
                setContent('');
            }
        } catch (err) {
            showError('Error al procesar el envío masivo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="email-manager-container animate-fade-in">
            <div className="admin-header">
                <h1 className="admin-title">
                    <Mail className="title-icon" />
                    Email & Marketing Hub
                </h1>
                <p className="admin-subtitle">Gestiona las comunicaciones oficiales de LAIKA Club</p>
            </div>

            <div className="email-grid">
                {/* Editor de Contenido */}
                <div className="email-editor-card">
                    <div className="card-header">
                        <Send className="card-icon" />
                        <h2>Redactar Anuncio Masivo</h2>
                    </div>
                    <div className="editor-group">
                        <label>Mensaje (Soporta HTML)</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Escribe aquí las noticias, promociones o actualizaciones..."
                            className="industrial-textarea"
                        />
                    </div>
                    <div className="editor-actions">
                        <Button
                            variant="primary"
                            onClick={handleBroadcast}
                            loading={loading}
                            fullWidth
                        >
                            <Users size={18} />
                            Enviar a todos los usuarios
                        </Button>
                    </div>
                </div>

                {/* Panel de Pruebas y Seguridad */}
                <div className="email-sidebar">
                    <div className="email-test-card">
                        <div className="card-header">
                            <ShieldCheck className="card-icon" />
                            <h2>Prueba de Conectividad</h2>
                        </div>
                        <p className="card-description">Envía un correo de prueba para verificar tu configuración SMTP.</p>
                        <div className="test-group">
                            <Input
                                placeholder="correo@ejemplo.com"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                            />
                            <Button
                                variant="outline"
                                onClick={handleSendTest}
                                loading={testLoading}
                            >
                                Enviar Prueba
                            </Button>
                        </div>
                    </div>

                    <div className="email-preview-card">
                        <div className="card-header">
                            <Eye className="card-icon" />
                            <h2>Vista Previa en Vivo</h2>
                        </div>
                        <div className="live-preview" dangerouslySetInnerHTML={{ __html: content || '<p style="color: #666; text-align: center; margin-top: 50px;">El contenido aparecerá aquí...</p>' }} />
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                onConfirm={handleConfirmBroadcast}
                title="Confirmar Envío Masivo"
                message="¿Estás completamente seguro de que deseas enviar este correo a TODOS los usuarios registrados? Esta acción no se puede detener una vez iniciada."
                confirmText="Sí, Enviar a todos"
                cancelText="Cancelar"
                variant="primary"
            />
        </div>
    );
};

export default EmailManager;
