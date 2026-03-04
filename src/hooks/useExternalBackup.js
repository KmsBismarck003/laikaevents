import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const useExternalBackup = () => {
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedSource, setSelectedSource] = useState(null);
    const [backupDetails, setBackupDetails] = useState(null);
    const [restoreStatus, setRestoreStatus] = useState('idle'); // idle, validating, authorizing, restoring, success, error

    const fetchSources = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/external-backup/sources`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSources(response.data.sources);
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al buscar fuentes externas');
        } finally {
            setLoading(false);
        }
    }, []);

    const validateSource = useCallback(async (sourcePath, backupId) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/external-backup/validate-source`, {
                source_path: sourcePath,
                backup_id: backupId,
                password: "dummy" // Not needed for validation
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setBackupDetails(response.data.details);
                setSelectedSource({ sourcePath, backupId });
                setRestoreStatus('validating');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Error al validar fuente');
            setRestoreStatus('error');
        } finally {
            setLoading(false);
        }
    }, []);

    const executeRestore = useCallback(async (password) => {
        if (!selectedSource) return;

        setRestoreStatus('restoring');
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/external-backup/restore`, {
                source_path: selectedSource.sourcePath,
                backup_id: selectedSource.backupId,
                password: password
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setRestoreStatus('success');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Error crítico durante la restauración');
            setRestoreStatus('error');
        }
    }, [selectedSource]);

    const resetState = useCallback(() => {
        setSelectedSource(null);
        setBackupDetails(null);
        setRestoreStatus('idle');
        setError(null);
    }, []);

    return {
        sources,
        loading,
        error,
        selectedSource,
        backupDetails,
        restoreStatus,
        fetchSources,
        validateSource,
        executeRestore,
        resetState
    };
};
