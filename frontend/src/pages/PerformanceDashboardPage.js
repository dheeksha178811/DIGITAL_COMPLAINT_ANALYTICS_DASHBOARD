import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { performanceService } from '../services/performanceService';
import LoadingSpinner from '../components/LoadingSpinner';
import './PerformanceDashboardPage.css';

const PerformanceDashboardPage = () => {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const res = await performanceService.getBulkPerformance();
            setMetrics(res.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load performance metrics.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColorClass = (score) => {
        if (score >= 75) return 'score-green';
        if (score >= 50) return 'score-yellow';
        return 'score-red';
    };

    const renderSingleCard = (item) => {
        if (!item) return null;
        return (
            <div className="perf-card" key={item.adminId || 'self'}>
                <div className="perf-card-header" style={{ cursor: 'pointer' }} onClick={() => navigate(`/performance/officer/${item.adminId}`)}>
                    <div className="perf-avatar">{item.adminName?.charAt(0) || 'U'}</div>
                    <div>
                        <h3>{item.adminName || 'Unknown Admin'}</h3>
                        <p className="perf-designation">
                            {item.department || ''} {item.level ? `| Level ${item.level}` : ''}
                        </p>
                    </div>
                    <div className={`perf-badge ${getScoreColorClass(item.performanceScore)}`}>
                        {item.performanceScore}%
                    </div>
                </div>

                <div className="perf-stats-grid">
                    <div className="perf-stat">
                        <span className="perf-stat-label">Total</span>
                        <span className="perf-stat-val">{item.totalComplaints}</span>
                    </div>
                    <div className="perf-stat">
                        <span className="perf-stat-label">Resolved</span>
                        <span className="perf-stat-val">{item.resolvedComplaints}</span>
                    </div>
                    <div className="perf-stat">
                        <span className="perf-stat-label">Avg Time</span>
                        <span className="perf-stat-val">{item.avgResolutionTimeHours} <small>hrs</small></span>
                    </div>
                    <div className="perf-stat">
                        <span className="perf-stat-label">SLA %</span>
                        <span className="perf-stat-val">{item.slaCompliance}%</span>
                    </div>
                    <div className="perf-stat">
                        <span className="perf-stat-label">Esc. Caused</span>
                        <span className="perf-stat-val text-red">{item.escalations}</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <LoadingSpinner message="Calculating performance metrics..." />;

    const items = Array.isArray(metrics) ? metrics : [];

    // Sort state
    // metrics are already sorted by score from backend!

    return (
        <div className="perf-dashboard">
            <div className="perf-header">
                <h1>🏆 Officer Performance Hub</h1>
                <p>Comprehensive tracking of resolution efficiency across administrative tiers.</p>
            </div>

            {error && <div className="perf-error">{error}</div>}

            {!error && items.length === 0 && (
                <div className="perf-empty">No performance data generated yet.</div>
            )}

            {!error && items.length > 0 && (
                <>
                    {/* Top Performers Cards */}
                    <div className="perf-top-section">
                        <h2 className="perf-section-title">Top Performers</h2>
                        <div className="perf-cards-container">
                            {items.slice(0, 3).map(renderSingleCard)}
                        </div>
                    </div>

                    {/* Simple CSS Bar Chart for Visual Comparison */}
                    <div className="perf-chart-section">
                        <h2 className="perf-section-title">Performance Index Graph</h2>
                        <div className="css-bar-chart">
                            {items.slice(0, 10).map((item, idx) => (
                                <div className="bar-wrapper" key={idx}>
                                    <div className="bar-label">{item.adminName?.split(' ')[0]}</div>
                                    <div className={`bar-fill ${getScoreColorClass(item.performanceScore)}`} style={{ width: `${item.performanceScore}%` }}>
                                        {item.performanceScore}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="perf-table-section">
                        <h2 className="perf-section-title">Detailed Metrics Registry</h2>
                        <div className="perf-table-container">
                            <table className="perf-table">
                                <thead>
                                    <tr>
                                        <th>Officer</th>
                                        <th>Level / Dept</th>
                                        <th>Total</th>
                                        <th>Resolved</th>
                                        <th>Avg Time (Hrs)</th>
                                        <th>SLA %</th>
                                        <th>Escalations</th>
                                        <th>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.adminId} style={{ cursor: 'pointer' }} onClick={() => navigate(`/performance/officer/${item.adminId}`)}>
                                            <td className="font-semibold" style={{ color: '#2563eb' }}>{item.adminName}</td>
                                            <td>{item.level ? `L${item.level}` : '-'} | {item.department || '-'}</td>
                                            <td>{item.totalComplaints}</td>
                                            <td>{item.resolvedComplaints}</td>
                                            <td>{item.avgResolutionTimeHours}</td>
                                            <td>
                                                <span className={item.slaCompliance < 50 ? 'text-red' : 'text-green'}>
                                                    {item.slaCompliance}%
                                                </span>
                                            </td>
                                            <td className={item.escalations > 0 ? 'text-bold-red' : ''}>{item.escalations}</td>
                                            <td>
                                                <div className={`perf-badge-small ${getScoreColorClass(item.performanceScore)}`}>
                                                    {item.performanceScore}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PerformanceDashboardPage;
