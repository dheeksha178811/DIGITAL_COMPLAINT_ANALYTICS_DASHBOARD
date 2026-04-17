import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService, adminService } from '../services/complaintService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, getCategoryLabel } from '../utils/constants';
import './ComplaintsListPage.css';

/** Returns SLA display info given sla_hours, createdAt, and deadline */
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

  let barColor = '#10b981'; // green
  if (pct > 80) barColor = '#ef4444'; // red
  else if (pct > 55) barColor = '#f59e0b'; // yellow

  const fmt = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return {
    pct,
    barColor,
    isOverdue,
    isResolved,
    label: isResolved
      ? 'Completed'
      : isOverdue
        ? `Overdue by ${fmt(Math.abs(remainingMs))}`
        : `${fmt(remainingMs)} remaining`,
    slaLabel: `${sla_hours}h SLA`
  };
}

const ComplaintsListPage = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortByVotes, setSortByVotes] = useState(null); // null | 'desc' | 'asc'

  useEffect(() => {
    loadComplaints();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const filters = filter !== 'all' ? { status: filter } : {};

      let response;
      if (user?.role === 'ADMIN') {
        response = await adminService.getAdminComplaints(filters);
      } else {
        response = await complaintService.getMyComplaints(filters);
      }

      setComplaints(response.complaints);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading complaints..." />;
  }

  let displayed = [...complaints];
  const isLevel1AdminView = user?.role === 'ADMIN' && user?.level === 1;

  if (isLevel1AdminView) {
    // Pin complaints with >= 10 votes to the top
    displayed.sort((a, b) => {
      const aPinned = a.vote_count >= 10;
      const bPinned = b.vote_count >= 10;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }

  // Apply vote sort client-side
  if (sortByVotes) {
    displayed.sort((a, b) =>
      sortByVotes === 'desc' ? b.vote_count - a.vote_count : a.vote_count - b.vote_count
    );
  }

  return (
    <div className="complaints-list-page">
      <div className="page-header">
        <div>
          <h1>
            {user?.role === 'ADMIN' 
              ? (user?.level === 2 ? 'Overdue Complaints' : 'Assigned Complaints')
              : 'My Complaints'}
          </h1>
          <p>
            {user?.role === 'ADMIN' 
              ? (user?.level === 2 
                  ? 'Overdue complaints from Level 1 officers requiring escalation' 
                  : 'Manage complaints in your jurisdiction')
              : 'Track and manage your submitted complaints'}
          </p>
        </div>
        {user?.role === 'CITIZEN' && (
          <Link to="/complaints/new" className="btn-primary">
            ➕ New Complaint
          </Link>
        )}
      </div>

      {/* Level 2 officers only see overdue - no filter needed */}
      {user?.level !== 2 && (
        <div className="filter-bar">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'SUBMITTED' ? 'active' : ''}`}
            onClick={() => setFilter('SUBMITTED')}
          >
            Submitted
          </button>
          <button
            className={`filter-btn ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => setFilter('IN_PROGRESS')}
          >
            In Progress
          </button>
          <button
            className={`filter-btn ${filter === 'RESOLVED' ? 'active' : ''}`}
            onClick={() => setFilter('RESOLVED')}
          >
            Resolved
          </button>
          <button
            className={`filter-btn ${filter === 'OVERDUE' ? 'active' : ''}`}
            onClick={() => setFilter('OVERDUE')}
          >
            Overdue
          </button>

          {/* Vote sort — available to admins (especially useful for Level 2 overview) */}
          {user?.role === 'ADMIN' && (
            <button
              className={`filter-btn ${sortByVotes ? 'active' : ''}`}
              style={{ marginLeft: 'auto' }}
              onClick={() => setSortByVotes(v => v === 'desc' ? 'asc' : v === 'asc' ? null : 'desc')}
              title="Sort by community votes"
            >
              👍 {sortByVotes === 'desc' ? 'Most Votes ↓' : sortByVotes === 'asc' ? 'Least Votes ↑' : 'Sort by Votes'}
            </button>
          )}
        </div>
      )}

      {/* Level 2 info banner */}
      {user?.level === 2 && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#92400e'
        }}>
          ⚠️ <strong>Level 2 View:</strong> Showing only overdue complaints from Level 1 officers that require your attention.
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No complaints found</h3>
          <p>{user?.role === 'ADMIN' ? 'There are no complaints matching your criteria currently.' : 'Start by filing your first complaint'}</p>
          {user?.role === 'CITIZEN' && (
            <Link to="/complaints/new" className="btn-primary">
              File Complaint
            </Link>
          )}
        </div>
      ) : (
        <div className="complaints-grid">
          {displayed.map((complaint) => {
            const isAdminView = user?.role === 'ADMIN';
            const score = complaint.citizen_id?.credibility_score;
            const credColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
            const isLevel1Admin = isAdminView && user?.level === 1;
            const thresholdReached = complaint.vote_count >= 10;
            const showVotes = !isLevel1Admin || thresholdReached;
            const credLabel = score >= 70 ? 'Reliable' : score >= 40 ? 'Moderate' : 'Low';

            return (
              <div key={complaint._id} className="complaint-card">
                <div className="complaint-card-header">
                  <StatusBadge status={complaint.status} />
                  <StatusBadge status={complaint.impact_level} type="impact" />
                  {/* Credibility score badge — visible only to Level 2 admins */}
                  {isAdminView && score !== undefined && (
                    <span style={{
                      marginLeft: 'auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: `${credColor}18`,
                      border: `1.5px solid ${credColor}`,
                      color: credColor,
                      borderRadius: '999px',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}>
                      ⭐ {score} — {credLabel}
                    </span>
                  )}
                </div>

                {complaint.image_url && (
                  <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem', overflow: 'hidden', borderRadius: '6px' }}>
                    <img
                      src={`${(process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '')}${complaint.image_url}`}
                      alt="Complaint Attachment"
                      style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}

                <h3 className="complaint-title">{complaint.title}</h3>
                <p className="complaint-description">
                  {complaint.description.substring(0, 150)}...
                </p>

                {/* Threshold Note for Level 1 Admin */}
                {isLevel1Admin && thresholdReached && (
                  <div style={{
                    margin: '0.5rem 0',
                    padding: '0.5rem',
                    background: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    color: '#b91c1c',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    ⚠️ Reached threshold of 10 votes, therefore needs attention!
                  </div>
                )}

                {/* Citizen name shown to admin */}
                {isAdminView && complaint.citizen_id?.name && (
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 0.5rem' }}>
                    👤 {complaint.citizen_id.name}
                  </p>
                )}

                {/* SLA progress bar — visible to all users */}
                {complaint.sla_hours && complaint.deadline && (() => {
                  const sla = getSLAInfo(complaint.sla_hours, complaint.createdAt, complaint.deadline, complaint.status);
                  return (
                    <div style={{ margin: '0.35rem 0 0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#9ca3af' }}>
                          ⏱ {sla.slaLabel}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: sla.isResolved ? '#10b981' : sla.isOverdue ? '#ef4444' : sla.pct > 55 ? '#f59e0b' : '#10b981'
                        }}>
                          {sla.isOverdue ? '🔴 ' : sla.isResolved ? '✅ ' : ''}{sla.label}
                        </span>
                      </div>
                      <div style={{ height: '4px', borderRadius: '999px', background: '#e5e7eb', overflow: 'hidden' }}>
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

                <div className="complaint-meta">
                  <div className="meta-item">
                    <span className="meta-label">Category:</span>
                    <span className="meta-value">{getCategoryLabel(complaint.category)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Submitted:</span>
                    <span className="meta-value">{formatDate(complaint.createdAt)}</span>
                  </div>
                  {showVotes && (
                    <div className="meta-item">
                      <span className="meta-label">Votes:</span>
                      <span className="meta-value">👍 {complaint.vote_count}</span>
                    </div>
                  )}
                </div>

                <div className="complaint-actions">
                  <Link
                    to={user?.role === 'ADMIN'
                      ? `/admin/complaints/${complaint._id}`
                      : `/complaints/${complaint._id}`}
                    className="btn-view"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComplaintsListPage;
