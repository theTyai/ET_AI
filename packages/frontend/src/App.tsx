import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Copilot } from './pages/Copilot';
import { DocumentLibrary } from './pages/DocumentLibrary';
import { KnowledgeGraph } from './pages/KnowledgeGraph';
import { EquipmentPassport } from './pages/EquipmentPassport';
import { ComplianceRadar } from './pages/ComplianceRadar';
import { FieldScanner } from './pages/FieldScanner';
import { MaintenanceIntel } from './pages/MaintenanceIntel';
import { LessonsLearned } from './pages/LessonsLearned';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#0D1220',
            color: '#F8FAFC',
            border: '1px solid rgba(56,80,140,0.35)',
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#0D1220' },
          },
          error: {
            iconTheme: { primary: '#F43F5E', secondary: '#0D1220' },
          },
        }} 
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/copilot"
          element={
            <ProtectedRoute>
              <Copilot />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentLibrary />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kg"
          element={
            <ProtectedRoute>
              <KnowledgeGraph />
            </ProtectedRoute>
          }
        />

        <Route
          path="/compliance"
          element={
            <ProtectedRoute>
              <ComplianceRadar />
            </ProtectedRoute>
          }
        />

        {/* /maintenance routes to MaintenanceIntel (RCA + Work Orders) */}
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <MaintenanceIntel />
            </ProtectedRoute>
          }
        />

        {/* Equipment passport accessible via /equipment/:tag */}
        <Route
          path="/equipment/:tag?"
          element={
            <ProtectedRoute>
              <EquipmentPassport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scanner"
          element={
            <ProtectedRoute>
              <FieldScanner />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lessons"
          element={
            <ProtectedRoute>
              <LessonsLearned />
            </ProtectedRoute>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
