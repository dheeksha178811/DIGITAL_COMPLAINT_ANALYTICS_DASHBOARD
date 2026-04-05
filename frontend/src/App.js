import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ComplaintsListPage from './pages/ComplaintsListPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import NewComplaintPage from './pages/NewComplaintPage';
import CommunityPage from './pages/CommunityPage';
import NoticesPage from './pages/NoticesPage';
import AdminNoticesPage from './pages/AdminNoticesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import Level2EscalationsPage from './pages/Level2EscalationsPage';
import PerformanceDashboardPage from './pages/PerformanceDashboardPage';
import OfficerScorePage from './pages/OfficerScorePage';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            {/* Citizen Routes */}
            <Route
              path="complaints"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <ComplaintsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="complaints/new"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <NewComplaintPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="complaints/:id"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <ComplaintDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="community"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <CommunityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="notices"
              element={
                <ProtectedRoute allowedRoles={['CITIZEN']}>
                  <NoticesPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="admin/complaints"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ComplaintsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/manual-escalations"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <Level2EscalationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/complaints/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ComplaintDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/notices"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminNoticesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="performance/my-score"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <OfficerScorePage selfView={true} />
                </ProtectedRoute>
              }
            />

            <Route
              path="performance/officer/:adminId"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'GOVERNMENT_ANALYST', 'SUPER_ADMIN']}>
                  <OfficerScorePage selfView={false} />
                </ProtectedRoute>
              }
            />

            {/* Common Performance Dashboard */}
            <Route
              path="performance"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'GOVERNMENT_ANALYST', 'SUPER_ADMIN']}>
                  <PerformanceDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
