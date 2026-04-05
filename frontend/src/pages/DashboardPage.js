import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { publicService } from '../services/complaintService';
import api from '../services/api';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import './DashboardPage.css';

const NOTICE_TYPE_ICONS = {
  URGENT: '🚨',
  ALERT: '⚠️',
  MAINTENANCE: '🔧',
  EVENT: '📅',
  GENERAL: 'ℹ️',
};

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [adminAnalytics, setAdminAnalytics] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Scroll to notices when navigated via sidebar Notices link (#notices hash)
  useEffect(() => {
    if (location.hash === '#notices' && !loading) {
      const el = document.getElementById('notices-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, loading]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      if (user?.role === 'CITIZEN') {
        // Load public stats + notices for citizen's area (including parent areas)
        const [statsRes, noticesRes] = await Promise.all([
          publicService.getPublicStats(),
          user?.geographic_unit_id
            ? publicService.getPublicNotices(user.geographic_unit_id)
            : Promise.resolve({ notices: [] })
        ]);
        setStats(statsRes.stats);
        setNotices(noticesRes.notices || []);
      } else if (user?.role === 'ADMIN') {
        // Load real analytics from admin endpoint for all admin levels
        const res = await api.get('/admin/analytics');
        setAdminAnalytics(res.data.analytics);
      } else {
        // Load public stats as fallback
        const response = await publicService.getPublicStats();
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const renderCitizenDashboard = () => (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}!</h1>
        <p>Track and manage your civic complaints</p>
      </div>

      <div className="stats-grid">
        <Card title="Total Complaints" value={stats?.total || 0} icon="📊" color="#3b82f6" />
        <Card title="Resolved" value={stats?.resolved || 0} icon="✅" color="#10b981" />
        <Card title="Pending" value={stats?.pending || 0} icon="⏳" color="#f59e0b" />
        <Card title="Overdue" value={stats?.overdue || 0} icon="⚠️" color="#ef4444" />
      </div>

      {user?.credibility_score !== undefined && (
        <div className="credibility-section">
          <h2>Your Credibility Score</h2>
          <div className="credibility-card">
            <div className="credibility-score">{user.credibility_score}</div>
            <p className="credibility-message">
              {user.credibility_score >= 100 ? '🏆 Champion Citizen!' :
                user.credibility_score >= 60 ? '🌟 Excellent standing!' :
                  user.credibility_score >= 30 ? '👍 Good standing' :
                    user.credibility_score >= 10 ? '📈 Fair standing' :
                      '⚠️ Low credibility — ensure valid complaints'}
            </p>

            {/* Metrics legend */}
            <div className="credibility-metrics">
              <h4>How you earn points</h4>
              <div className="metrics-grid">
                <div className="metric-row positive">
                  <span className="metric-icon">✅</span>
                  <span className="metric-label">Complaint resolved</span>
                  <span className="metric-value">+10</span>
                </div>
                <div className="metric-row positive">
                  <span className="metric-icon">👍</span>
                  <span className="metric-label">Your complaint gets upvoted</span>
                  <span className="metric-value">+5</span>
                </div>
                <div className="metric-row positive">
                  <span className="metric-icon">🗳️</span>
                  <span className="metric-label">You upvote a community complaint</span>
                  <span className="metric-value">+1</span>
                </div>
                <div className="metric-row negative">
                  <span className="metric-icon">❌</span>
                  <span className="metric-label">Complaint rejected / false info</span>
                  <span className="metric-value">−10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-cards">
          <Link to="/complaints/new" className="action-card primary">
            <span className="action-icon">➕</span>
            <span className="action-label">File New Complaint</span>
          </Link>
          <Link to="/complaints" className="action-card">
            <span className="action-icon">📋</span>
            <span className="action-label">View My Complaints</span>
          </Link>
        </div>
      </div>

      {/* ── Notices for Citizen's Area ─────────────────────────────── */}
      <div className="notices-section" id="notices-section">
        <h2>📢 Official Notices for Your Area</h2>
        {notices.length === 0 ? (
          <div className="no-notices">
            <span>✅ No active notices for your area right now.</span>
          </div>
        ) : (
          <div className="citizen-notices-list">
            {notices.map(notice => (
              <div
                key={notice._id}
                className={`citizen-notice-card notice-type-${(notice.type || 'GENERAL').toLowerCase()}`}
              >
                <div className="citizen-notice-header">
                  <span className="citizen-notice-badge">
                    {NOTICE_TYPE_ICONS[notice.type] || 'ℹ️'} {notice.type}
                  </span>
                  <span className="citizen-notice-area">
                    📍 {notice.geographic_unit_id?.name || 'Your Area'}
                  </span>
                </div>
                <h3 className="citizen-notice-title">{notice.title}</h3>
                <p className="citizen-notice-content">{notice.content}</p>
                <div className="citizen-notice-footer">
                  {notice.created_by?.name && (
                    <span className="citizen-notice-by">By: {notice.created_by.name}</span>
                  )}
                  {notice.valid_until && (
                    <span className="citizen-notice-until">
                      Valid until: {new Date(notice.valid_until).toLocaleDateString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderAdminDashboard = () => {
    const kpi = adminAnalytics?.kpi || {};
    const areaBreakdown = adminAnalytics?.areaBreakdown || [];
    const isLevel2 = user?.level === 2;

    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>
            Level {user?.level} Officer{' '}
            {isLevel2
              ? '— All Departments · Division Authority'
              : `— ${user?.department?.replace(/_/g, ' ')}`}
          </p>
        </div>

        {/* KPI Cards from real analytics */}
        <div className="stats-grid">
          <Card title="Total Complaints" value={kpi.total ?? '—'} icon="📊" color="#3b82f6" />
          <Card title="Resolved" value={kpi.resolved ?? '—'} icon="✅" color="#10b981" subtitle={`${kpi.resolutionRate ?? 0}% rate`} />
          <Card title="In Progress" value={kpi.inProgress ?? '—'} icon="🔧" color="#8b5cf6" />
          <Card title="Overdue" value={kpi.overdue ?? '—'} icon="⚠️" color="#ef4444" />
        </div>

        {/* Area breakdown for Level 2 */}
        {areaBreakdown.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#1f2937' }}>
              📍 Complaints by Assigned Ward
            </h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {areaBreakdown.map((area) => (
                <div
                  key={area.name}
                  style={{
                    background: '#f5f3ff',
                    border: '1px solid #c4b5fd',
                    borderRadius: '10px',
                    padding: '0.75rem 1.25rem',
                    minWidth: '150px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#6366f1' }}>{area.count}</div>
                  <div style={{ fontSize: '0.82rem', color: '#374151', marginTop: '0.2rem' }}>{area.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-cards">
            {/* Level 3 officers don't access complaints list — analytics only */}
            {user?.level !== 3 && (
              <Link to="/admin/complaints" className="action-card primary">
                <span className="action-icon">📋</span>
                <span className="action-label">{isLevel2 ? 'Overdue Complaints' : 'Manage Complaints'}</span>
              </Link>
            )}
            <Link to="/admin/notices" className="action-card">
              <span className="action-icon">📢</span>
              <span className="action-label">Post Notice</span>
            </Link>
            <Link to="/admin/analytics" className="action-card">
              <span className="action-icon">📈</span>
              <span className="action-label">Full Analytics</span>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return user?.role === 'CITIZEN' ? renderCitizenDashboard() : renderAdminDashboard();
};

export default DashboardPage;

