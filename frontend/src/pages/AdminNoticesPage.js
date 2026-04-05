import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService, publicService } from '../services/complaintService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/constants';
import './AdminNoticesPage.css';

const AdminNoticesPage = () => {
    const { user } = useAuth();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState(null);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('GENERAL');
    const [validUntil, setValidUntil] = useState('');

    // Assigned area names for info banner
    const [assignedAreaNames, setAssignedAreaNames] = useState([]);

    useEffect(() => {
        loadNotices();
        loadAssignedAreaNames();
    }, []);

    // Fetch human-readable names for all assigned geographic units
    const loadAssignedAreaNames = async () => {
        try {
            const ids = user?.assigned_geographic_unit_ids || [];
            const names = await Promise.all(
                ids.map(id => {
                    // Handle both populated objects {_id, name, type} and raw ID strings
                    if (id && typeof id === 'object' && id.name) {
                        return Promise.resolve(id.name);
                    }
                    const rawId = (id && typeof id === 'object') ? id._id : id;
                    return publicService.getGeographicHierarchy(rawId)
                        .then(res => res?.unit?.name || String(rawId))
                        .catch(() => String(rawId));
                })
            );
            setAssignedAreaNames(names);
        } catch (err) {
            console.error('Error loading assigned area names:', err);
        }
    };

    const loadNotices = async () => {
        try {
            setLoading(true);
            const response = await adminService.getAdminNotices();
            const list = response?.notices ?? response?.data ?? [];
            setNotices(Array.isArray(list) ? list : []);
        } catch (err) {
            setError('Failed to load notices');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required.');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            // Backend auto-uses admin's assigned geographic units — no geo_unit param needed
            await adminService.createNotice({
                title,
                content,
                type,
                valid_until: validUntil || undefined
            });

            // Reset form
            setTitle('');
            setContent('');
            setType('GENERAL');
            setValidUntil('');
            setShowForm(false);
            loadNotices();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post notice.');
            setLoading(false);
        }
    };

    if (loading && notices.length === 0 && !showForm) return <LoadingSpinner message="Loading notices..." />;

    const isLevel2 = Number(user?.level) === 2;

    return (
        <div className="admin-notices-page">
            <div className="page-header">
                <div>
                    <h1>Manage Notices</h1>
                    <p>Post and review official notices for your assigned jurisdictions</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : '📝 Post New Notice'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {showForm && (
                <form className="notice-form card" onSubmit={handleSubmit}>
                    <h3>Create Official Notice</h3>

                    {/* Auto-broadcast info banner — always shown */}
                    <div style={{
                        background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
                        border: '1px solid #93c5fd',
                        borderRadius: '10px',
                        padding: '0.9rem 1.1rem',
                        marginBottom: '1.25rem'
                    }}>
                        <p style={{ fontWeight: 600, color: '#1d4ed8', marginBottom: '0.35rem', fontSize: '0.9rem' }}>
                            {isLevel2 ? '📡 Auto-Broadcast to All Assigned Wards' : '📍 Notice for Your Assigned Area'}
                        </p>
                        <p style={{ fontSize: '0.82rem', color: '#374151', marginBottom: '0.45rem' }}>
                            {isLevel2
                                ? 'This notice will be visible to citizens and Level 1 officers in:'
                                : 'This notice will be posted to your assigned area:'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {assignedAreaNames.length > 0
                                ? assignedAreaNames.map((name, i) => (
                                    <span key={i} style={{
                                        background: '#dbeafe',
                                        color: '#1e40af',
                                        borderRadius: '999px',
                                        padding: '0.2rem 0.7rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 500
                                    }}>📍 {name}</span>
                                ))
                                : <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>Loading areas…</span>
                            }
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Notice title"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Type *</label>
                        <select value={type} onChange={e => setType(e.target.value)}>
                            <option value="GENERAL">General</option>
                            <option value="URGENT">Urgent</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="EVENT">Event</option>
                            <option value="ALERT">Alert</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Content *</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="What do citizens need to know?"
                            rows={4}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Valid Until (Optional)</label>
                        <input
                            type="date"
                            value={validUntil}
                            onChange={e => setValidUntil(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Posting...' : 'Post Notice'}
                    </button>
                </form>
            )}

            <div className="notices-list">
                {!showForm && notices.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📢</div>
                        <h3>No notices posted</h3>
                        <p>You haven't posted any official notices yet.</p>
                    </div>
                ) : (
                    (notices || []).map(notice => {
                        // Determine area label — L2 notices use geographic_unit_ids (multi-ward)
                        const multiAreas = notice.geographic_unit_ids?.length > 0
                            ? notice.geographic_unit_ids.map(u => u?.name || u).join(', ')
                            : null;
                        const singleArea = notice.geographic_unit_id?.name || null;
                        const areaLabel = multiAreas || singleArea || 'Assigned Area';
                        const isL2Broadcast = notice.geographic_unit_ids?.length > 0;
                        const isFromHigherLevel = notice.created_by && notice.created_by._id !== user?._id;

                        return (
                            <div key={notice._id} className="notice-card card">
                                <div className="notice-header">
                                    <span className={`status-badge ${(notice.type || 'general').toLowerCase()}`}>
                                        {notice.type}
                                    </span>
                                    {isL2Broadcast && (
                                        <span style={{
                                            fontSize: '0.72rem',
                                            background: '#dbeafe',
                                            color: '#1d4ed8',
                                            borderRadius: '999px',
                                            padding: '0.15rem 0.5rem',
                                            marginLeft: '0.4rem',
                                            fontWeight: 600
                                        }}>📡 Multi-Ward</span>
                                    )}
                                    <span className="notice-date">{formatDate(notice.createdAt)}</span>
                                </div>
                                <h3 className="notice-title">{notice.title}</h3>
                                <p className="notice-content">{notice.content}</p>
                                {isFromHigherLevel && notice.created_by?.name && (
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.3rem' }}>
                                        📋 From: {notice.created_by.name} (Level {notice.created_by.level})
                                    </p>
                                )}
                                <div className="notice-footer">
                                    <span className="geo-pill">📍 {areaLabel}</span>
                                    {notice.valid_until && (
                                        <span className="valid-pill">⏳ Valid until: {new Date(notice.valid_until).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AdminNoticesPage;
