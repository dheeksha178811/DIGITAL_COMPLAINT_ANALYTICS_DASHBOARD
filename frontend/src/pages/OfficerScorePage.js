import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { performanceService } from '../services/performanceService';
import LoadingSpinner from '../components/LoadingSpinner';
import './OfficerScorePage.css';

const OfficerScorePage = ({ selfView }) => {
    const { adminId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Determine whose ID to fetch
    const targetId = selfView ? (user?._id || user?.id) : adminId;

    useEffect(() => {
        if (!targetId) return;
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetId]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await performanceService.getOfficerPerformance(targetId);
            setMetrics(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load officer score.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColorClass = (score) => {
        if (score >= 75) return 'score-green';
        if (score >= 50) return 'score-yellow';
        return 'score-red';
    };

    if (loading) return <LoadingSpinner message="Calculating officer score..." />;

    if (error) {
        return (
            <div className="officer-score-page">
                <button className="btn-back" onClick={() => navigate(-1)}>⬅ Back</button>
                <div className="score-error">{error}</div>
            </div>
        );
    }

    if (!metrics) return null;

    return (
        <div className="officer-score-page">
            {!selfView && (
                <button className="btn-back" onClick={() => navigate(-1)}>⬅ Back to Dashboard</button>
            )}

            <div className="score-header">
                <h1>{selfView ? '📈 My Performance Score' : `📈 Officer Score: ${metrics.adminName}`}</h1>
                <p>Detailed view of resolution efficiency and SLA adherence.</p>
            </div>

            <div className="score-main-card">
                <div className="score-card-top">
                    <div className="score-avatar">{metrics.adminName?.charAt(0) || 'U'}</div>
                    <div className="score-info">
                        <h2>{metrics.adminName}</h2>
                        <p>{metrics.department || 'N/A'} {metrics.level ? `| Level ${metrics.level}` : ''}</p>
                    </div>
                    <div className={`score-badge-large ${getScoreColorClass(metrics.performanceScore)}`}>
                        {metrics.performanceScore}%
                    </div>
                </div>

                <div className="score-stats-grid">
                    <div className="score-stat-box">
                        <span className="stat-label">Total Handled</span>
                        <span className="stat-val">{metrics.totalComplaints}</span>
                    </div>
                    <div className="score-stat-box">
                        <span className="stat-label">Resolved</span>
                        <span className="stat-val">{metrics.resolvedComplaints}</span>
                    </div>
                    <div className="score-stat-box">
                        <span className="stat-label">Avg Time</span>
                        <span className="stat-val">{metrics.avgResolutionTimeHours} <small>hrs</small></span>
                    </div>
                    <div className="score-stat-box">
                        <span className="stat-label">SLA Compliance</span>
                        <span className="stat-val">{metrics.slaCompliance}%</span>
                    </div>
                    <div className="score-stat-box">
                        <span className="stat-label">Escalations Caused</span>
                        <span className="stat-val text-red">{metrics.escalations}</span>
                    </div>
                </div>
            </div>

            <div className="score-explanation">
                <h3>How is the score calculated?</h3>
                <p>This score is mathematically normalized between 0-100 to evaluate governance efficiency fairly across the organization.</p>
                <ul>
                    <li><strong>Resolution Efficiency (+40%):</strong> Ratio of resolved complaints to total handled complaints.</li>
                    <li><strong>SLA Deadline Compliance (+40%):</strong> Percentage of complaints resolved within standard timeframe safely.</li>
                    <li><strong>Escalation Penalties (-20%):</strong> Deductions based on manually or automatically escalated complaints originating from this officer.</li>
                </ul>
            </div>
        </div>
    );
};

export default OfficerScorePage;
