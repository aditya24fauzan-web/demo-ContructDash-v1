import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Guide } from './pages/Guide';
import { Finance } from './pages/Finance';
import { Settings } from './pages/Settings';
import { TermsOfService } from './pages/TermsOfService';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { CookiePolicy } from './pages/CookiePolicy';
import { ThemeProvider } from './components/ThemeProvider';
import { TenantProvider } from './lib/tenant';

import { Onboarding } from './pages/Onboarding';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';

function ProtectedRoute({ children, blockPC = false }: { children: React.ReactNode, blockPC?: boolean }) {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (profile && profile.isOnboarded === false && profile.role === 'owner' && profile.tenantId === profile.uid) {
    return <Navigate to="/onboarding" />;
  }

  if (blockPC && profile?.role === 'pc') {
    return <Navigate to="/reports" replace />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/cookies" element={<CookiePolicy />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/register" element={user ? <Navigate to={(profile?.isOnboarded === false && profile?.role === 'owner' && profile?.tenantId === profile?.uid) ? "/onboarding" : (profile?.role === 'pc' ? "/reports" : "/dashboard")} /> : <Register />} />
      <Route path="/login" element={user ? <Navigate to={(profile?.isOnboarded === false && profile?.role === 'owner' && profile?.tenantId === profile?.uid) ? "/onboarding" : (profile?.role === 'pc' ? "/reports" : "/dashboard")} /> : <Login />} />
      <Route path="/forgot-password" element={user ? <Navigate to={(profile?.isOnboarded === false && profile?.role === 'owner' && profile?.tenantId === profile?.uid) ? "/onboarding" : (profile?.role === 'pc' ? "/reports" : "/dashboard")} /> : <ForgotPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute blockPC><Dashboard /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute blockPC><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute blockPC><ProjectDetails /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute blockPC><Finance /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute blockPC><Users /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute blockPC><Settings /></ProtectedRoute>} />
      <Route path="/guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />
    </Routes>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="sipo-ui-theme">
      <AuthProvider>
        <TenantProvider>
          <Router>
            <ScrollToTop />
            <AppRoutes />
          </Router>
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


