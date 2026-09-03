import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar.jsx';
import { DemoSimulatorDrawer } from '../features/demo/components/DemoSimulatorDrawer.jsx';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage.jsx';
import { PaymentsPage } from '../features/payments/pages/PaymentsPage.jsx';
import { RecoveryQueuePage } from '../features/recovery/pages/RecoveryQueuePage.jsx';
import { RecoveryCasePage } from '../features/recovery/pages/RecoveryCasePage.jsx';
import { ApprovalsPage } from '../features/approvals/pages/ApprovalsPage.jsx';
import { AnalyticsPage } from '../features/analytics/pages/AnalyticsPage.jsx';
import { AuditPage } from '../features/audit/pages/AuditPage.jsx';
import { api } from '../services/api.js';

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
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center font-mono text-xs">
        <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping mr-2"></span>
        <span>Initializing RecoverAI Merchant Console...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage 
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          checkAuthAndCounts();
        }} 
      />
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
        {/* Navigation Bar */}
        <Navbar
          user={user}
          pendingApprovalsCount={pendingApprovalsCount}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/recovery" element={<RecoveryQueuePage />} />
            <Route path="/recovery/:id" element={<RecoveryCasePage />} />
            <Route 
              path="/approvals" 
              element={<ApprovalsPage onApprovalUpdated={checkAuthAndCounts} />} 
            />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Pitch Demo Simulator Drawer */}
        <DemoSimulatorDrawer
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          onRefreshData={checkAuthAndCounts}
        />
      </div>
    </Router>
  );
}
