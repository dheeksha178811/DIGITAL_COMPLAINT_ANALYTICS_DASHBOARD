import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintService, adminService } from '../services/complaintService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, getCategoryLabel } from '../utils/constants';
import './ComplaintDetailPage.css';

/** SLA display helper */
function getSLAInfo(sla_hours, createdAt, deadline, status) {
    const now = Date.now();
    const start = new Date(createdAt).getTime();
    const end = new Date(deadline).getTime();
    const totalMs = end - start;
    const elapsedMs = now - start;
    const remainingMs = end - now;
    const pct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
    const isResolved = ['RESOLVED', 'REJECTED'].includes(status);
    const isOverdue = status === 'OVERDUE' || (!isResolved && now > end);
    let barColor = '#10b981';
    if (pct > 80) barColor = '#ef4444';
    else if (pct > 55) barColor = '#f59e0b';
    const fmt = (ms) => {
        const h = Math.floor(Math.abs(ms) / 3600000);
        const m = Math.floor((Math.abs(ms) % 3600000) / 60000);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };
    const tierLabel = sla_hours <= 12 ? '⚡ Express' : sla_hours <= 24 ? '🔵 Standard' : sla_hours <= 48 ? '🟡 Extended' : '🔴 Long-term';
    return {
        pct, barColor, isOverdue, isResolved, tierLabel, slaLabel: `${sla_hours}h SLA`,
        label: isResolved ? 'Completed within SLA window' : isOverdue ? `Overdue by ${fmt(remainingMs)}` : `${fmt(remainingMs)} remaining`
    };
}

const STATUS_OPTIONS = [
    { value: 'ASSIGNED', label: 'Assigned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'REJECTED', label: 'Rejected' },
];

const STATUS_STEPS = ['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'];

const ComplaintDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [escalations, setEscalations] = useState([]);

    // Admin update form state
    const [newStatus, setNewStatus] = useState('');
    const [remarks, setRemarks] = useState('');

    // Escalation Modal state
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [escalateReason, setEscalateReason] = useState('REQUIRES_HIGHER_AUTHORITY');
    const [escalateNotes, setEscalateNotes] = useState('');
    const [escalating, setEscalating] = useState(false);

    const isAdmin = user?.role === 'ADMIN';
    const isCitizen = user?.role === 'CITIZEN';

    useEffect(() => {
        loadComplaint();
    }, [id]);

    const loadComplaint = async () => {
        try {
            setLoading(true);
            const res = await complaintService.getComplaint(id);
            setComplaint(res.complaint);
            setNewStatus(res.complaint.status);
            setRemarks(res.complaint.admin_remarks || '');
            // Fetch escalation history (only admins have the route; citizens silently skip)
            try {
                const escRes = await adminService.getEscalationHistory(id);
                setEscalations(escRes.escalations || []);
            } catch (_) {
                // Citizens don't have access to admin endpoint — that's fine
            }
        } catch (err) {
            setError('Failed to load complaint.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!newStatus) return;

        try {
            setUpdating(true);
            setError('');
            setSuccess('');
            const res = await adminService.updateComplaint(id, {
                status: newStatus,
                admin_remarks: remarks
            });
            setComplaint(res.complaint);
            setSuccess('Complaint updated successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update complaint.');
        } finally {
            setUpdating(false);
        }
    };

    const handleEscalate = async (e) => {
        e.preventDefault();
        if (!escalateNotes.trim()) {
            setError('Notes are required for escalation');
            return;
        }

        try {
            setEscalating(true);
            setError('');
            setSuccess('');
            const res = await adminService.escalateComplaint(id, {
                reason: escalateReason,
                notes: escalateNotes
            });
            setComplaint(res.complaint);
            setSuccess('Complaint escalated successfully!');
            setShowEscalateModal(false);
            setEscalateNotes('');

            // Reload escalation history
            const escRes = await adminService.getEscalationHistory(id);
            setEscalations(escRes.escalations || []);

            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to escalate complaint.');
        } finally {
            setEscalating(false);
        }
    };

    const getStepIndex = (status) => {
        if (status === 'REJECTED') return -1;
        return STATUS_STEPS.indexOf(status);
    };

    if (loading) return <LoadingSpinner message="Loading complaint..." />;
    if (!complaint) return (
        <div className="detail-error">
            <h2>Complaint not found</h2>
            <button onClick={() => navigate(-1)} className="btn-back">← Go Back</button>
        </div>
    );

    const stepIndex = getStepIndex(complaint.status);
    const isRejected = complaint.status === 'REJECTED';
    const isResolved = complaint.status === 'RESOLVED';

    return (
        <div className="complaint-detail-page">

            {/* ── Top bar ─────────────────────────────────────── */}
            <div className="detail-topbar">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    ← Back
                </button>
                <div className="detail-topbar-badges">
                    <StatusBadge status={complaint.status} />
                    <StatusBadge status={complaint.impact_level} type="impact" />
                </div>
            </div>

            {/* ── Main content ────────────────────────────────── */}
            <div className="detail-grid">

                {/* Left: Complaint info */}
                <div className="detail-main">
                    <div className="detail-card">
                        <h1 className="detail-title">{complaint.title}</h1>
                        <div className="detail-meta-row">
                            <span>📂 {getCategoryLabel(complaint.category)}</span>
                            <span>📅 {formatDate(complaint.createdAt)}</span>
                            <span>📍 {complaint.geographic_unit_id?.name || 'N/A'}</span>
                        </div>

                        <div className="detail-section">
                            <h3>Description</h3>
                            <p className="detail-description">{complaint.description}</p>
                        </div>

                        {complaint.image_url && (
                            <div className="detail-section">
                                <h3>Attached Image</h3>
                                <div className="complaint-image-container">
                                    <img
                                        src={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '')}${complaint.image_url}`}
                                        alt="Complaint Attachment"
                                        className="complaint-attached-img"
                                        style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '10px' }}
                                    />
                                </div>
                            </div>
                        )}

                        {complaint.location?.address && (
                            <div className="detail-section">
                                <h3>Location Details</h3>
                                <p>{complaint.location.address}</p>
                                {complaint.location.landmark && (
                                    <p className="detail-landmark">Landmark: {complaint.location.landmark}</p>
                                )}
                            </div>
                        )}

                        {/* Status Timeline */}
                        <div className="detail-section">
                            <h3>Status Timeline</h3>
                            {isRejected ? (
                                <div className="status-rejected-banner">
                                    ❌ This complaint was rejected by the officer.
                                </div>
                            ) : (
                                <div className="status-timeline">
                                    {STATUS_STEPS.map((step, idx) => (
                                        <div
                                            key={step}
                                            className={`timeline-step ${idx < stepIndex ? 'done' :
                                                idx === stepIndex ? 'active' : 'pending'
                                                }`}
                                        >
                                            <div className="timeline-dot" />
                                            <div className="timeline-label">{step.replace('_', ' ')}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Admin Feedback / Remarks — visible to both */}
                        {complaint.admin_remarks && (
                            <div className="detail-section feedback-section">
                                <h3>📋 Officer Feedback</h3>
                                <div className="feedback-box">
                                    <p>{complaint.admin_remarks}</p>
                                    {complaint.assigned_admin?.name && (
                                        <span className="feedback-by">
                                            — {complaint.assigned_admin.name}
                                            {complaint.assigned_admin.department && ` (${complaint.assigned_admin.department.replace(/_/g, ' ')})`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Resolution date */}
                        {isResolved && complaint.resolution_date && (
                            <div className="detail-section">
                                <h3>✅ Resolved On</h3>
                                <p>{formatDate(complaint.resolution_date)}</p>
                            </div>
                        )}

                        {/* ── Escalation History ─────────────────────── */}
                        {escalations.length > 0 && (
                            <div className="detail-section">
                                <h3>🔺 Escalation History</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    {escalations.map((esc, i) => (
                                        <div key={esc._id || i} style={{
                                            background: '#fff8f0',
                                            border: '1px solid #fed7aa',
                                            borderLeft: '4px solid #f97316',
                                            borderRadius: '8px',
                                            padding: '0.75rem 1rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#c2410c' }}>
                                                    Level {esc.from_level} → Level {esc.to_level}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                    {formatDate(esc.createdAt)}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    background: esc.reason === 'SLA_BREACH' ? '#fee2e2' : '#e0f2fe',
                                                    color: esc.reason === 'SLA_BREACH' ? '#dc2626' : '#0369a1',
                                                    borderRadius: '999px',
                                                    padding: '0.1rem 0.55rem',
                                                    fontSize: '0.72rem',
                                                    fontWeight: 600,
                                                    marginBottom: '0.35rem'
                                                }}>
                                                    {esc.reason === 'SLA_BREACH' ? '⏱ SLA Breach' :
                                                        esc.reason === 'MANUAL' ? '✋ Manual' :
                                                            esc.reason === 'REQUIRES_HIGHER_AUTHORITY' ? '📈 Requires Higher Authority' :
                                                                esc.reason === 'RESOURCE_UNAVAILABLE' ? '🛑 Resource Unavailable' :
                                                                    esc.reason === 'COMPLEX_ISSUE' ? '🧩 Complex Issue' :
                                                                        esc.reason === 'JURISDICTION_CHANGE' ? '🗺️ Jurisdiction Change' :
                                                                            esc.reason}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '0.25rem' }}>
                                                {esc.from_admin?.name && (
                                                    <span>From: <strong>{esc.from_admin.name}</strong> (L{esc.from_admin.level})</span>
                                                )}
                                                {esc.to_admin?.name && (
                                                    <span style={{ marginLeft: '0.75rem' }}>→ To: <strong>{esc.to_admin.name}</strong> (L{esc.to_admin.level})</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div className="detail-sidebar">

                    {/* Complaint meta info */}
                    <div className="sidebar-card">
                        <h3>Complaint Info</h3>
                        <dl className="info-list">
                            <dt>Submitted by</dt>
                            <dd>{complaint.citizen_id?.name || 'Citizen'}</dd>

                            {/* Credibility score — visible to all admins */}
                            {isAdmin && (() => {
                                const score = complaint.citizen_id?.credibility_score;
                                if (score === undefined || score === null) return null;
                                const dotColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
                                const label = score >= 70 ? 'Reliable' : score >= 40 ? 'Moderate' : 'Low';
                                return (
                                    <>
                                        <dt>Credibility Score</dt>
                                        <dd style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                background: dotColor,
                                                flexShrink: 0,
                                                boxShadow: `0 0 0 2px ${dotColor}33`
                                            }} />
                                            <span style={{ fontWeight: 700, color: dotColor }}>{score}</span>
                                            <span style={{ color: '#6b7280', fontSize: '0.82rem' }}>— {label}</span>
                                        </dd>
                                    </>
                                );
                            })()}

                            <dt>SLA</dt>
                            <dd>
                                {(() => {
                                    const sla = getSLAInfo(complaint.sla_hours, complaint.createdAt, complaint.deadline, complaint.status);
                                    return (
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{sla.tierLabel}</span>
                                                <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{sla.slaLabel}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.3rem' }}>
                                                Deadline: {formatDate(complaint.deadline)}
                                            </div>
                                            <div style={{
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                color: sla.isResolved ? '#10b981' : sla.isOverdue ? '#ef4444' : sla.pct > 55 ? '#f59e0b' : '#10b981',
                                                marginBottom: '0.35rem'
                                            }}>
                                                {sla.isOverdue ? '🔴 ' : sla.isResolved ? '✅ ' : '⏳ '}{sla.label}
                                            </div>
                                            <div style={{ height: '5px', borderRadius: '999px', background: '#e5e7eb', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${sla.isResolved ? 100 : sla.pct}%`,
                                                    background: sla.isResolved ? '#10b981' : sla.barColor,
                                                    borderRadius: '999px'
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })()}
                            </dd>

                            <dt>Votes</dt>
                            <dd>👍 {complaint.vote_count}</dd>

                            <dt>Escalation Level</dt>
                            <dd>Level {complaint.current_escalation_level}</dd>

                            {complaint.assigned_admin?.name && (
                                <>
                                    <dt>Assigned Officer</dt>
                                    <dd>{complaint.assigned_admin.name}</dd>
                                </>
                            )}
                        </dl>
                    </div>

                    {/* ── Observer Banner for Level 3 ─────────────── */}
                    {isAdmin && Number(user?.level) === 3 && (
                        <div style={{
                            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                            border: '1px solid #fbbf24',
                            borderRadius: '10px',
                            padding: '0.85rem 1.1rem',
                            marginBottom: '1rem',
                            fontSize: '0.85rem',
                            color: '#92400e',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.6rem'
                        }}>
                            <span style={{ fontSize: '1.1rem' }}>👁</span>
                            <div>
                                <strong>Observer Mode</strong>
                                <br />
                                District Analyst — read-only access. You can view complaint details and analytics but cannot modify complaints.
                            </div>
                        </div>
                    )}

                    {/* ── Admin Update Panel ─────────────────────── */}
                    {isAdmin && !isResolved && !isRejected && Number(user?.level) !== 3 && Number(user?.level) >= (complaint.current_escalation_level || 1) && (
                        <div className="sidebar-card update-card">
                            <h3>Update Complaint</h3>

                            {error && <div className="alert-error">{error}</div>}
                            {success && <div className="alert-success">{success}</div>}

                            <form onSubmit={handleUpdate}>
                                <div className="form-group">
                                    <label>Change Status</label>
                                    <select
                                        value={newStatus}
                                        onChange={e => setNewStatus(e.target.value)}
                                    >
                                        {STATUS_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Feedback / Remarks for Citizen</label>
                                    <textarea
                                        value={remarks}
                                        onChange={e => setRemarks(e.target.value)}
                                        placeholder="Explain what action was taken, why it was rejected, or current progress..."
                                        rows={5}
                                        maxLength={1000}
                                    />
                                    <small className="char-hint">{remarks.length} / 1000</small>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary full-width"
                                    disabled={updating}
                                >
                                    {updating ? 'Updating...' : '💾 Save Update'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Escalate Panel for Level 1 Officers */}
                    {isAdmin && Number(user?.level) === 1 && !isResolved && !isRejected && complaint.current_escalation_level === 1 && (
                        <div className="sidebar-card">
                            <h3>Escalate Complaint</h3>
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
                                If you are unable to resolve this within your authority, escalate it to the Level 2 Divisional Administrator.
                            </p>
                            <button
                                className="btn-primary full-width"
                                style={{ background: '#f59e0b', color: '#fff', border: 'none' }}
                                onClick={() => setShowEscalateModal(true)}
                            >
                                🔺 Escalate to Level 2
                            </button>
                        </div>
                    )}

                    {/* Admin resolved / rejected — show final state */}
                    {isAdmin && (isResolved || isRejected) && (
                        <div className={`sidebar-card final-card ${isResolved ? 'resolved' : 'rejected'}`}>
                            <h3>{isResolved ? '✅ Complaint Resolved' : '❌ Complaint Rejected'}</h3>
                            <p>{isResolved
                                ? 'This complaint has been resolved. No further updates needed.'
                                : 'This complaint has been rejected.'}
                            </p>
                        </div>
                    )}

                    {/* Citizen view — only see status message */}
                    {isCitizen && (
                        <div className="sidebar-card citizen-status-card">
                            <h3>Your Complaint Status</h3>
                            <div className={`citizen-status-display status-${complaint.status.toLowerCase()}`}>
                                {complaint.status === 'SUBMITTED' && '🕐 Your complaint has been submitted and is awaiting review.'}
                                {complaint.status === 'ASSIGNED' && '📌 Your complaint has been assigned to a field officer.'}
                                {complaint.status === 'IN_PROGRESS' && '🔧 An officer is actively working on your complaint.'}
                                {complaint.status === 'RESOLVED' && '✅ Your complaint has been resolved!'}
                                {complaint.status === 'REJECTED' && '❌ Your complaint was rejected. See officer feedback below.'}
                                {complaint.status === 'OVERDUE' && '⚠️ Resolution is overdue — this has been escalated.'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Escalate Modal */}
            {showEscalateModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: '#fff', padding: '2rem', borderRadius: '12px',
                        width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1f2937' }}>Escalate Complaint</h2>
                        <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            You are escalating this complaint to a Level 2 authority. Please provide a reason and detailed notes.
                        </p>

                        <form onSubmit={handleEscalate}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Reason</label>
                                <select
                                    value={escalateReason}
                                    onChange={e => setEscalateReason(e.target.value)}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                >
                                    <option value="REQUIRES_HIGHER_AUTHORITY">Requires higher authority</option>
                                    <option value="RESOURCE_UNAVAILABLE">Resource unavailable</option>
                                    <option value="COMPLEX_ISSUE">Complex issue</option>
                                    <option value="JURISDICTION_CHANGE">Jurisdiction change</option>
                                    <option value="MANUAL">Other (Manual)</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Notes (Mandatory)</label>
                                <textarea
                                    value={escalateNotes}
                                    onChange={e => setEscalateNotes(e.target.value)}
                                    placeholder="Provide detailed explanation for the required escalation..."
                                    rows={4}
                                    required
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowEscalateModal(false)}
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
                                    disabled={escalating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}
                                    disabled={escalating}
                                >
                                    {escalating ? 'Escalating...' : 'Submit Escalation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintDetailPage;
