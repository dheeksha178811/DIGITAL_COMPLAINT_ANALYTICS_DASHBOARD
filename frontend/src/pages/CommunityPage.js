import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { complaintService } from '../services/complaintService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, getCategoryLabel } from '../utils/constants';
import './CommunityPage.css';

const IMPACT_COLORS = {
    CRITICAL: '#ef4444',
    HIGH: '#f59e0b',
    MODERATE: '#3b82f6',
    LOW: '#10b981',
};

const CommunityPage = () => {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('latest');
    const [votingId, setVotingId] = useState(null);   // which complaint is being voted on
    const [votedIds, setVotedIds] = useState(new Set()); // track already-voted locally
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadComplaints = useCallback(async () => {
        if (!user?.geographic_unit_id) return;
        try {
            setLoading(true);
            // Extract the ID string from the geographic_unit_id (could be object or string)
            const geoId = user.geographic_unit_id._id || user.geographic_unit_id;
            const params = { geographic_unit_id: geoId };
            if (filter !== 'ALL') params.status = filter;
            const res = await complaintService.getAllComplaints(params);
            let list = res.complaints || [];

            // Sort
            if (sortBy === 'votes') {
                list = [...list].sort((a, b) => b.vote_count - a.vote_count);
            } else if (sortBy === 'deadline') {
                list = [...list].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
            }
            // 'latest' is default from API

            setComplaints(list);
        } catch (err) {
            console.error('Error loading community complaints:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.geographic_unit_id, filter, sortBy]);

    useEffect(() => {
        loadComplaints();
    }, [loadComplaints]);

    const handleVote = async (complaint) => {
        if (votingId) return; // debounce

        // Prevent voting on own complaint
        if (complaint.citizen_id?._id === user._id || complaint.citizen_id === user._id) {
            showToast("You can't vote on your own complaint.", 'error');
            return;
        }

        if (votedIds.has(complaint._id)) {
            showToast('You have already voted on this complaint.', 'error');
            return;
        }

        try {
            setVotingId(complaint._id);
            const res = await complaintService.voteOnComplaint(complaint._id);

            // Update counts locally for instant feedback
            setComplaints(prev =>
                prev.map(c =>
                    c._id === complaint._id
                        ? { ...c, vote_count: res.vote_count, impact_level: res.impact_level }
                        : c
                )
            );
            setVotedIds(prev => new Set([...prev, complaint._id]));
            showToast('✅ Your vote was recorded! +2 credibility earned.');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to vote.';
            if (msg.includes('already voted') || msg.includes('own complaint')) {
                setVotedIds(prev => new Set([...prev, complaint._id]));
            }
            showToast(msg, 'error');
        } finally {
            setVotingId(null);
        }
    };

    const FILTERS = [
        { value: 'ALL', label: 'All' },
        { value: 'SUBMITTED', label: 'New' },
        { value: 'IN_PROGRESS', label: 'In Progress' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'OVERDUE', label: 'Overdue' },
    ];

    if (loading) return <LoadingSpinner message="Loading community complaints..." />;

    return (
        <div className="community-page">
            {toast && (
                <div className={`community-toast ${toast.type}`}>{toast.msg}</div>
            )}

            {/* ── Header ────────────────────────────────── */}
            <div className="community-header">
                <div>
                    <h1>🏘️ Community Feed</h1>
                    <p>Complaints from your area — upvote issues that matter to you</p>
                </div>
                <div className="community-stats-pill">
                    {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} in your area
                </div>
            </div>

            {/* ── Controls ──────────────────────────────── */}
            <div className="community-controls">
                <div className="filter-bar">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            className={`filter-btn ${filter === f.value ? 'active' : ''}`}
                            onClick={() => setFilter(f.value)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <select
                    className="sort-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                >
                    <option value="latest">Sort: Latest</option>
                    <option value="votes">Sort: Most Voted</option>
                    <option value="deadline">Sort: Deadline</option>
                </select>
            </div>

            {/* ── Feed ──────────────────────────────────── */}
            {complaints.length === 0 ? (
                <div className="community-empty">
                    <div className="empty-icon">🏙️</div>
                    <h3>No complaints in your area yet</h3>
                    <p>Be the first to report an issue in your community!</p>
                    <Link to="/complaints/new" className="btn-primary-inline">File a Complaint</Link>
                </div>
            ) : (
                <div className="community-feed">
                    {complaints.map(complaint => {
                        const isOwn = (complaint.citizen_id?._id || complaint.citizen_id)?.toString() === user._id?.toString();
                        const hasVoted = votedIds.has(complaint._id);
                        const isVoting = votingId === complaint._id;
                        const canVote = !isOwn && !hasVoted && !complaint.status === 'RESOLVED';

                        return (
                            <article key={complaint._id} className="community-card">
                                {/* Vote column */}
                                <div className="vote-col">
                                    <button
                                        className={`upvote-btn ${hasVoted ? 'voted' : ''} ${isOwn ? 'disabled' : ''}`}
                                        onClick={() => !isOwn && !hasVoted && handleVote(complaint)}
                                        disabled={isOwn || hasVoted || isVoting}
                                        title={
                                            isOwn ? "Can't vote on your own complaint" :
                                                hasVoted ? 'Already voted' : 'Upvote this complaint'
                                        }
                                    >
                                        {isVoting ? (
                                            <span className="vote-spinner">⟳</span>
                                        ) : (
                                            <span className="vote-arrow">{hasVoted ? '▲' : '△'}</span>
                                        )}
                                        <span className="vote-count">{complaint.vote_count}</span>
                                    </button>

                                    {complaint.vote_count > 0 && (
                                        <span
                                            className="impact-dot"
                                            style={{ background: IMPACT_COLORS[complaint.impact_level] || '#9ca3af' }}
                                            title={`Impact: ${complaint.impact_level}`}
                                        />
                                    )}
                                </div>

                                {/* Card body */}
                                <div className="card-body">
                                    <div className="card-top">
                                        <StatusBadge status={complaint.status} />
                                        <span className="card-category">
                                            {getCategoryLabel(complaint.category)}
                                        </span>
                                        {isOwn && <span className="own-badge">Your Post</span>}
                                    </div>

                                    {complaint.image_url && (
                                        <div className="card-image-preview" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                                            <img
                                                src={`http://localhost:5000${complaint.image_url}`}
                                                alt="Complaint Preview"
                                                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                                            />
                                        </div>
                                    )}

                                    <h2 className="card-title">{complaint.title}</h2>
                                    <p className="card-excerpt">
                                        {complaint.description.length > 160
                                            ? complaint.description.substring(0, 160) + '…'
                                            : complaint.description}
                                    </p>

                                    <div className="card-footer">
                                        <span className="card-meta">📅 {formatDate(complaint.createdAt)}</span>
                                        {complaint.location?.address && (
                                            <span className="card-meta">📍 {complaint.location.address}</span>
                                        )}
                                        {complaint.citizen_id?.name && !isOwn && (
                                            <span className="card-meta">👤 {complaint.citizen_id.name}</span>
                                        )}
                                    </div>

                                    {/* Officer feedback visible in community too */}
                                    {complaint.admin_remarks && (
                                        <div className="card-feedback">
                                            📋 <em>{complaint.admin_remarks}</em>
                                        </div>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}

            {/* Credibility info banner */}
            <div className="credibility-info-bar">
                <span>💡 <strong>Upvoting earns you +2 credibility</strong> and rewards the complaint author with +1 for authentic reporting.</span>
            </div>
        </div>
    );
};

export default CommunityPage;
