import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetails } from './pages/ProjectDetails';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Guide } from './pages/Guide';
import { Finance } from './pages/Finance';

function ProtectedRoute({ children, blockPC = false }: { children: React.ReactNode, blockPC?: boolean }) {
  const { user, profile, loading } = useAuth();

  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={profile?.role === 'pc' ? "/reports" : "/"} /> : <Login />} />
      <Route path="/" element={<ProtectedRoute blockPC><Dashboard /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute blockPC><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute blockPC><ProjectDetails /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute blockPC><Finance /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute blockPC><Users /></ProtectedRoute>} />
      <Route path="/guide" element={<ProtectedRoute><Guide /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

