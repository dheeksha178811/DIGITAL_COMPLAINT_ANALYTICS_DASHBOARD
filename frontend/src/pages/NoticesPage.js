import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { publicService } from '../services/complaintService';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../utils/constants';
import './NoticesPage.css';

const TYPE_META = {
    URGENT: { color: '#ef4444', bg: '#fef2f2', icon: '🚨' },
    ALERT: { color: '#f59e0b', bg: '#fffbeb', icon: '⚠️' },
    MAINTENANCE: { color: '#3b82f6', bg: '#eff6ff', icon: '🔧' },
    EVENT: { color: '#8b5cf6', bg: '#f5f3ff', icon: '📅' },
    GENERAL: { color: '#10b981', bg: '#f0fdf4', icon: 'ℹ️' },
    INFORMATION: { color: '#10b981', bg: '#f0fdf4', icon: 'ℹ️' },
    WARNING: { color: '#f59e0b', bg: '#fffbeb', icon: '⚠️' },
    EMERGENCY: { color: '#ef4444', bg: '#fef2f2', icon: '🚨' },
};

const NoticesPage = () => {
    const { user } = useAuth();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        loadNotices();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadNotices = async () => {
        try {
            setLoading(true);
            setError(null);
            // Extract the ID string from the geographic_unit_id (could be object or string)
            const geoId = user?.geographic_unit_id?._id || user?.geographic_unit_id;
            const response = await publicService.getPublicNotices(geoId);
            setNotices(response?.notices || []);
        } catch (err) {
            setError('Failed to load notices. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = filter === 'ALL'
        ? notices
        : notices.filter(n => n.type === filter);

    const typeOptions = ['ALL', 'URGENT', 'ALERT', 'MAINTENANCE', 'EVENT', 'GENERAL'];

    if (loading) return <LoadingSpinner message="Loading notices..." />;

    return (
        <div className="notices-page">
            {/* Page Header */}
            <div className="notices-header">
                <div>
                    <h1>📢 Official Notices</h1>
                    <p>Government notifications for your area</p>
                </div>
                <button className="refresh-btn" onClick={loadNotices} title="Refresh">
                    ↻ Refresh
                </button>
            </div>

            {/* Filter Pills */}
            <div className="notice-filters">
                {typeOptions.map(opt => (
                    <button
                        key={opt}
                        className={`filter-pill ${filter === opt ? 'active' : ''}`}
                        onClick={() => setFilter(opt)}
                    >
                        {opt === 'ALL' ? 'All' : opt.charAt(0) + opt.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {error && <div className="error-banner">{error}</div>}

            {/* Notices List */}
            {filtered.length === 0 ? (
                <div className="empty-notices">
                    <div className="empty-icon">📭</div>
                    <h3>No notices found</h3>
                    <p>
                        {filter !== 'ALL'
                            ? `No ${filter.toLowerCase()} notices at this time.`
                            : 'There are no active notices for your area right now.'}
                    </p>
                </div>
            ) : (
                <div className="notices-grid">
                    {filtered.map(notice => {
                        const meta = TYPE_META[notice.type] || TYPE_META.GENERAL;
                        const isExpiringSoon = notice.valid_until &&
                            new Date(notice.valid_until) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

                        // Determine area label (L2 notices broadcast to multiple wards)
                        const areaLabel = notice.geographic_unit_ids?.length > 0
                            ? notice.geographic_unit_ids.map(u => u?.name || u).join(' · ')
                            : notice.geographic_unit_id?.name || 'Your Area';

                        return (
                            <div
                                key={notice._id}
                                className="notice-card"
                                style={{ borderLeft: `4px solid ${meta.color}`, background: meta.bg }}
                            >
                                <div className="notice-card-header">
                                    <div className="notice-type-badge" style={{ color: meta.color }}>
                                        {meta.icon} {notice.type}
                                    </div>
                                    {isExpiringSoon && (
                                        <span className="expiring-badge">⏰ Expiring soon</span>
                                    )}
                                    <span className="notice-date">{formatDate(notice.createdAt)}</span>
                                </div>

                                <h3 className="notice-title">{notice.title}</h3>
                                <p className="notice-body">{notice.content}</p>

                                <div className="notice-card-footer">
                                    <span className="area-tag">📍 {areaLabel}</span>
                                    {notice.valid_until && (
                                        <span className="validity-tag" style={{ color: isExpiringSoon ? '#ef4444' : '#6b7280' }}>
                                            ⏳ Until {new Date(notice.valid_until).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>

                                {notice.created_by?.name && (
                                    <div className="notice-authority">
                                        🏛️ {notice.created_by.name}
                                        {notice.created_by.designation ? ` — ${notice.created_by.designation}` : ''}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default NoticesPage;
