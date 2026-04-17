import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, ArcElement,
    PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './AnalyticsPage.css';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, ArcElement,
    PointElement, LineElement, Title, Tooltip, Legend, Filler
);

// ── Helpers ─────────────────────────────────────────────────
const CATEGORY_LABELS = {
    WATER_SUPPLY: 'Water Supply', ELECTRICITY: 'Electricity',
    ROAD_MAINTENANCE: 'Roads', GARBAGE_COLLECTION: 'Garbage',
    STREET_LIGHTING: 'Lighting', DRAINAGE: 'Drainage',
    PUBLIC_HEALTH: 'Health', TRAFFIC: 'Traffic',
    POLLUTION: 'Pollution', ILLEGAL_CONSTRUCTION: 'Construction',
    PARKS_GARDENS: 'Parks', GENERAL: 'General'
};

const STATUS_COLORS = {
    SUBMITTED: '#3b82f6', IN_PROGRESS: '#f59e0b',
    RESOLVED: '#10b981', OVERDUE: '#ef4444', REJECTED: '#6b7280'
};

const CHART_COLORS = [
    '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'
];

const CHART_OPTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } } }
};

// ── Component ────────────────────────────────────────────────
const AnalyticsPage = () => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/analytics');
            setData(res.data.analytics);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner message="Loading analytics…" />;
    if (error) return <div className="analytics-error">⚠️ {error}</div>;
    if (!data) return null;

    const { kpi, byCategory, areaBreakdown, timeline } = data;

    // ── Status doughnut ────────────────────────────────
    const statusChart = {
        labels: ['Submitted', 'In Progress', 'Resolved', 'Overdue', 'Rejected'],
        datasets: [{
            data: [kpi.pending, kpi.inProgress, kpi.resolved, kpi.overdue, kpi.rejected],
            backgroundColor: Object.values(STATUS_COLORS),
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    // ── Category bar ───────────────────────────────────
    const catChart = {
        labels: byCategory.map(c => CATEGORY_LABELS[c._id] || c._id),
        datasets: [{
            label: 'Complaints',
            data: byCategory.map(c => c.count),
            backgroundColor: CHART_COLORS.slice(0, byCategory.length),
            borderRadius: 6,
            borderSkipped: false
        }]
    };

    // ── Area breakdown bar ─────────────────────────────
    const areaChart = {
        labels: areaBreakdown.map(a => a.name),
        datasets: [{
            label: 'Complaints',
            data: areaBreakdown.map(a => a.count),
            backgroundColor: '#6366f1',
            borderRadius: 6,
            borderSkipped: false
        }]
    };

    // ── Timeline line ──────────────────────────────────
    const lineChart = {
        labels: timeline.map(t => {
            const d = new Date(t.date);
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }),
        datasets: [{
            label: 'Complaints Filed',
            data: timeline.map(t => t.count),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.1)',
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#6366f1',
            pointRadius: 4
        }]
    };

    const levelLabel = user?.level === 3
        ? 'District Authority' : user?.level === 2
            ? 'Division Authority · All Departments' : 'Field Officer';

    const jurisdictionDesc = user?.level === 3
        ? 'All departments · entire district jurisdiction'
        : user?.level === 2
            ? 'All departments · across your assigned wards'
            : `${user?.department?.replace(/_/g, ' ')} department · your jurisdiction`;

    return (
        <div className="analytics-page">
            {/* ── Header ──────────────────────────────────── */}
            <div className="analytics-header">
                <div>
                    <h1>📊 Analytics Dashboard</h1>
                    <p>Complaint data across your jurisdiction · <strong>{levelLabel}</strong><br /><small style={{ color: '#6b7280' }}>{jurisdictionDesc}</small></p>
                </div>
                <button className="refresh-btn" onClick={fetchAnalytics}>↻ Refresh</button>
            </div>

            {/* ── KPI Cards ───────────────────────────────── */}
            <div className="kpi-grid">
                {[
                    { label: 'Total', value: kpi.total, icon: '📋', color: '#6366f1' },
                    { label: 'Resolved', value: kpi.resolved, icon: '✅', color: '#10b981' },
                    { label: 'In Progress', value: kpi.inProgress, icon: '🔧', color: '#3b82f6' },
                    { label: 'Pending', value: kpi.pending, icon: '⏳', color: '#f59e0b' },
                    { label: 'Overdue', value: kpi.overdue, icon: '⚠️', color: '#ef4444' },
                    { label: 'Resolution %', value: `${kpi.resolutionRate}%`, icon: '📈', color: '#8b5cf6' },
                ].map(card => (
                    <div key={card.label} className="kpi-card" style={{ borderTopColor: card.color }}>
                        <div className="kpi-icon">{card.icon}</div>
                        <div className="kpi-value" style={{ color: card.color }}>{card.value}</div>
                        <div className="kpi-label">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Level 3 Performance Tables (above charts) ──────────── */}
            {user?.level === 3 && (
                <>
                    {/* SLA Compliance per area */}
                    {data.slaCompliance && data.slaCompliance.length > 0 && (
                        <div className="chart-card" style={{ marginTop: '1.5rem', marginBottom: '1.5rem', maxWidth: '100%' }}>
                            <h3>⏱ SLA Compliance by Area</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginTop: '0.75rem' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb' }}>
                                        <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem', borderBottom: '2px solid #e5e7eb' }}>Area</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Resolved</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>On-Time</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Compliance %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.slaCompliance.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600 }}>{row.name}</td>
                                            <td style={{ textAlign: 'center', padding: '0.55rem' }}>{row.resolved}</td>
                                            <td style={{ textAlign: 'center', padding: '0.55rem' }}>{row.onTime}</td>
                                            <td style={{ textAlign: 'center', padding: '0.55rem' }}>
                                                <span style={{
                                                    fontWeight: 700,
                                                    color: row.compliance >= 80 ? '#10b981' : row.compliance >= 50 ? '#f59e0b' : '#ef4444'
                                                }}>{row.compliance}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Department Performance table */}
                    {data.departmentPerformance && data.departmentPerformance.length > 0 && (
                        <div className="chart-card" style={{ marginBottom: '1.5rem', maxWidth: '100%' }}>
                            <h3>🏛️ Department Performance — District-Wide</h3>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginTop: '0.75rem' }}>
                                <thead>
                                    <tr style={{ background: '#f9fafb' }}>
                                        <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem', borderBottom: '2px solid #e5e7eb' }}>Department</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Total</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Resolved</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Overdue</th>
                                        <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Resolution %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.departmentPerformance.map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600 }}>
                                                {CATEGORY_LABELS[row.category] || row.category}
                                            </td>
                                            <td style={{ textAlign: 'center', padding: '0.55rem' }}>{row.total}</td>
                                            <td style={{ textAlign: 'center', padding: '0.55rem', color: '#10b981', fontWeight: 600 }}>{row.resolved}</td>
                                            <td style={{ textAlign: 'center', padding: '0.55rem', color: row.overdue > 0 ? '#ef4444' : '#6b7280', fontWeight: row.overdue > 0 ? 700 : 400 }}>{row.overdue}</td>
                                            <td style={{ textAlign: 'center', padding: '0.55rem' }}>
                                                <span style={{
                                                    fontWeight: 700,
                                                    color: row.resolutionRate >= 70 ? '#10b981' : row.resolutionRate >= 40 ? '#f59e0b' : '#ef4444'
                                                }}>{row.resolutionRate}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ── Charts row 1 ────────────────────────────── */}
            <div className="charts-row">
                <div className="chart-card wide">
                    <h3>📅 7-Day Complaint Trend</h3>
                    <div className="chart-wrap tall">
                        <Line data={lineChart} options={{
                            ...CHART_OPTS,
                            plugins: { ...CHART_OPTS.plugins, legend: { display: false } },
                            scales: {
                                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                                x: { grid: { display: false } }
                            }
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>🔵 Status Breakdown</h3>
                    <div className="chart-wrap">
                        <Doughnut data={statusChart} options={{
                            ...CHART_OPTS,
                            cutout: '62%'
                        }} />
                    </div>
                </div>
            </div>

            {/* ── Charts row 2 ────────────────────────────── */}
            <div className="charts-row">
                <div className="chart-card">
                    <h3>🏛️ Complaints by Category</h3>
                    <div className="chart-wrap">
                        <Bar data={catChart} options={{
                            ...CHART_OPTS,
                            plugins: { ...CHART_OPTS.plugins, legend: { display: false } },
                            scales: {
                                y: { beginAtZero: true, ticks: { stepSize: 1 } },
                                x: { grid: { display: false } }
                            }
                        }} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>📍 Complaints by Area</h3>
                    {areaBreakdown.length === 0 ? (
                        <div className="no-area-data">No sub-area data available yet</div>
                    ) : (
                        <div className="chart-wrap">
                            <Bar data={areaChart} options={{
                                ...CHART_OPTS,
                                indexAxis: 'y',
                                plugins: { ...CHART_OPTS.plugins, legend: { display: false } },
                                scales: {
                                    x: { beginAtZero: true, ticks: { stepSize: 1 } }
                                }
                            }} />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Level 2 & 3 Analytics Sections ──────────── */}
            {(user?.level === 2 || user?.level === 3) && (
                <>
                    {/* Escalation Frequency per area */}
                    {data.escalationFrequency && data.escalationFrequency.some(e => e.escalations > 0) && (
                        <div className="charts-row" style={{ marginTop: '1.5rem' }}>
                            <div className="chart-card wide">
                                <h3>🔺 Escalation Frequency by Area</h3>
                                <div className="chart-wrap tall">
                                    <Bar
                                        data={{
                                            labels: data.escalationFrequency.map(e => e.name),
                                            datasets: [{
                                                label: 'Escalations',
                                                data: data.escalationFrequency.map(e => e.escalations),
                                                backgroundColor: '#f97316',
                                                borderRadius: 6,
                                                borderSkipped: false
                                            }]
                                        }}
                                        options={{
                                            ...CHART_OPTS,
                                            plugins: { ...CHART_OPTS.plugins, legend: { display: false } },
                                            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Level 2: SLA Compliance and Department Performance */}
                    {user?.level === 2 && (
                        <>
                            {/* SLA Compliance per area */}
                            {data.slaCompliance && data.slaCompliance.length > 0 && (
                                <div className="chart-card" style={{ marginTop: '1.5rem', maxWidth: '100%' }}>
                                    <h3>⏱ SLA Compliance by Area</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginTop: '0.75rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb' }}>
                                                <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem', borderBottom: '2px solid #e5e7eb' }}>Area</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Resolved</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>On-Time</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Compliance %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.slaCompliance.map((row, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600 }}>{row.name}</td>
                                                    <td style={{ textAlign: 'center', padding: '0.55rem' }}>{row.resolved}</td>
                                                    <td style={{ textAlign: 'center', padding: '0.55rem' }}>{row.onTime}</td>
                                                    <td style={{ textAlign: 'center', padding: '0.55rem' }}>
                                                        <span style={{
                                                            fontWeight: 700,
                                                            color: row.compliance >= 80 ? '#10b981' : row.compliance >= 50 ? '#f59e0b' : '#ef4444'
                                                        }}>{row.compliance}%</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Department Performance table */}
                            {data.departmentPerformance && data.departmentPerformance.length > 0 && (
                                <div className="chart-card" style={{ marginTop: '1.5rem', maxWidth: '100%' }}>
                                    <h3>🏛️ Department Performance — Division-Wide</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginTop: '0.75rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb' }}>
                                                <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem', borderBottom: '2px solid #e5e7eb' }}>Department</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Total</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Resolved</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Overdue</th>
                                                <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #e5e7eb' }}>Resolution %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.departmentPerformance.map((row, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '0.55rem 0.8rem', fontWeight: 600 }}>
                                                        {CATEGORY_LABELS[row.category] || row.category}
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '0.55rem' }}>{row.total}</td>
                                                    <td style={{ textAlign: 'center', padding: '0.55rem', color: '#10b981', fontWeight: 600 }}>{row.resolved}</td>
                                                    <td style={{ textAlign: 'center', padding: '0.55rem', color: row.overdue > 0 ? '#ef4444' : '#6b7280', fontWeight: row.overdue > 0 ? 700 : 400 }}>{row.overdue}</td>
                                                    <td style={{ textAlign: 'center', padding: '0.55rem' }}>
                                                        <span style={{
                                                            fontWeight: 700,
                                                            color: row.resolutionRate >= 70 ? '#10b981' : row.resolutionRate >= 40 ? '#f59e0b' : '#ef4444'
                                                        }}>{row.resolutionRate}%</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default AnalyticsPage;
