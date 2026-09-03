import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar.jsx';
import { DemoSimulatorDrawer } from '../features/demo/components/DemoSimulatorDrawer.jsx';
import { LandingPage } from '../pages/LandingPage.jsx';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage.jsx';
import { PaymentsPage } from '../features/payments/pages/PaymentsPage.jsx';
import { RecoveryQueuePage } from '../features/recovery/pages/RecoveryQueuePage.jsx';
import { RecoveryCasePage } from '../features/recovery/pages/RecoveryCasePage.jsx';
import { ApprovalsPage } from '../features/approvals/pages/ApprovalsPage.jsx';
import { AnalyticsPage } from '../features/analytics/pages/AnalyticsPage.jsx';
import { AuditPage } from '../features/audit/pages/AuditPage.jsx';
import { api } from '../services/api.js';

// Protected Route Guard
function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Authenticated Console Shell Layout
function ConsoleShell({ user, pendingApprovalsCount, onOpenSimulator, onLogout, checkAuthAndCounts, children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Console Navbar */}
      <Navbar
        user={user}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenSimulator={onOpenSimulator}
        onLogout={onLogout}
      />

      {/* Main Console Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {children}
      </main>

      {/* Pitch Demo Simulator Drawer */}
      <DemoSimulatorDrawer
        isOpen={false}
        onClose={() => {}}
        onRefreshData={checkAuthAndCounts}
      />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  const checkAuthAndCounts = async () => {
    try {
      const authRes = await api.get('/auth/me');
      setUser(authRes.user);

      // Fetch pending approvals count for navbar badge
      const approvalsRes = await api.get('/approvals?status=PENDING&limit=1');
      setPendingApprovalsCount(approvalsRes.total || 0);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndCounts();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request failed:', err);
    } finally {
      localStorage.removeItem('recoverai_token');
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-slate-500 flex items-center justify-center font-mono text-xs">
        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping mr-2"></span>
        <span>Initializing RecoverAI Platform...</span>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage user={user} />} />

        {/* Login Page */}
        <Route 
          path="/login" 
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage 
                onLoginSuccess={(loggedInUser) => {
                  setUser(loggedInUser);
                  checkAuthAndCounts();
                }} 
              />
            )
          } 
        />

        {/* Protected Merchant Console Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <ConsoleShell
                user={user}
                pendingApprovalsCount={pendingApprovalsCount}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onLogout={handleLogout}
                checkAuthAndCounts={checkAuthAndCounts}
              >
                <DashboardPage />
              </ConsoleShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/payments"
          element={
            <ProtectedRoute user={user}>
              <ConsoleShell
                user={user}
                pendingApprovalsCount={pendingApprovalsCount}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onLogout={handleLogout}
                checkAuthAndCounts={checkAuthAndCounts}
              >
                <PaymentsPage />
              </ConsoleShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/recovery"
          element={
            <ProtectedRoute user={user}>
              <ConsoleShell
                user={user}
                pendingApprovalsCount={pendingApprovalsCount}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onLogout={handleLogout}
                checkAuthAndCounts={checkAuthAndCounts}
              >
                <RecoveryQueuePage />
              </ConsoleShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/recovery/:id"
          element={
            <ProtectedRoute user={user}>
              <ConsoleShell
                user={user}
                pendingApprovalsCount={pendingApprovalsCount}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onLogout={handleLogout}
                checkAuthAndCounts={checkAuthAndCounts}
              >
                <RecoveryCasePage />
              </ConsoleShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/approvals"
          element={
            <ProtectedRoute user={user}>
              <ConsoleShell
                user={user}
                pendingApprovalsCount={pendingApprovalsCount}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onLogout={handleLogout}
                checkAuthAndCounts={checkAuthAndCounts}
              >
                <ApprovalsPage onApprovalUpdated={checkAuthAndCounts} />
              </ConsoleShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute user={user}>
              <ConsoleShell
                user={user}
                pendingApprovalsCount={pendingApprovalsCount}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onLogout={handleLogout}
                checkAuthAndCounts={checkAuthAndCounts}
              >
                <AnalyticsPage />
              </ConsoleShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit"
          element={
            <ProtectedRoute user={user}>
              <ConsoleShell
                user={user}
                pendingApprovalsCount={pendingApprovalsCount}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onLogout={handleLogout}
                checkAuthAndCounts={checkAuthAndCounts}
              >
                <AuditPage />
              </ConsoleShell>
            </ProtectedRoute>
          }
        />

        {/* Fallback to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Simulator Drawer mounted when active */}
      {user && (
        <DemoSimulatorDrawer
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          onRefreshData={checkAuthAndCounts}
        />
      )}
    </Router>
  );
}
