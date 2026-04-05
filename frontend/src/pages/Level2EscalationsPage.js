import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/complaintService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, getCategoryLabel } from '../utils/constants';
import './Level2EscalationsPage.css';

const formatReason = (r) => {
    if (!r) return '';
    if (r === 'SLA_BREACH') return '⏱ SLA Breach';
    if (r === 'MANUAL') return '✋ Manual';
    if (r === 'REQUIRES_HIGHER_AUTHORITY') return '📈 Requires Higher Authority';
    if (r === 'RESOURCE_UNAVAILABLE') return '🛑 Resource Unavailable';
    if (r === 'COMPLEX_ISSUE') return '🧩 Complex Issue';
    if (r === 'JURISDICTION_CHANGE') return '🗺️ Jurisdiction Change';
    return r;
};

const Level2EscalationsPage = () => {
    const [escalations, setEscalations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadEscalations();
    }, []);

    const loadEscalations = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await adminService.getManualEscalations();
            setEscalations(res.escalations || []);
        } catch (err) {
            setError('Failed to load manual escalations.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading escalated issues..." />;

    return (
        <div className="escalations-page">
            <div className="page-header">
                <h1>🔺 Manually Escalated Issues</h1>
                <p className="page-subtitle">Issues escalated to you by Level 1 Field Officers requiring higher-level intervention.</p>
            </div>

            {error && <div className="alert-error">{error}</div>}

            {!loading && !error && escalations.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">✅</div>
                    <h3>No Escalated Issues</h3>
                    <p>You have no pending manually escalated issues from Level 1 officers at this time.</p>
                </div>
            ) : (
                <div className="escalations-grid">
                    {escalations.map((esc) => {
                        const complaint = esc.complaint_id;
                        if (!complaint) return null;

                        return (
                            <div key={esc._id} className="escalation-card">
                                {/* ── Complaint Meta Header ── */}
                                <div className="esc-card-header">
                                    <div className="esc-card-title-row">
                                        <h3 className="esc-complaint-title" onClick={() => navigate(`/admin/complaints/${complaint._id}`)}>
                                            {complaint.title}
                                        </h3>
                                        <StatusBadge status={complaint.status} />
                                    </div>
                                    <div className="esc-card-meta">
                                        <span className="esc-meta-item">📁 {getCategoryLabel(complaint.category)}</span>
                                        <span className="esc-meta-item">📍 {complaint.geographic_unit_id?.name || 'Unknown Area'}</span>
                                        <span className="esc-meta-item">⏳ Deadline: {formatDate(complaint.deadline)}</span>
                                    </div>
                                </div>

                                {/* ── Escalation Details block ── */}
                                <div className="esc-details-block">
                                    <div className="esc-reason-badge">{formatReason(esc.reason)}</div>
                                    <div className="esc-notes">
                                        <strong>Level 1 Notes:</strong> "{esc.notes}"
                                    </div>
                                    <div className="esc-footer-row">
                                        <div className="esc-from-admin">
                                            Escalated by: <strong>{esc.from_admin?.name}</strong> {esc.from_admin?.designation ? `(${esc.from_admin.designation})` : ''}
                                        </div>
                                        <div className="esc-time">
                                            {formatDate(esc.createdAt)}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Actions ── */}
                                <div className="esc-card-actions">
                                    <button
                                        className="btn-esc-view"
                                        onClick={() => navigate(`/admin/complaints/${complaint._id}`)}
                                    >
                                        View & Action Complaint ➔
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Level2EscalationsPage;
