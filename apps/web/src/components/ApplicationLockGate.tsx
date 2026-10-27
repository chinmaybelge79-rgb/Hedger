import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface ApplicationLockGateProps {
  children: React.ReactNode;
}

export const ApplicationLockGate: React.FC<ApplicationLockGateProps> = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // If still checking session, show a clean dark loading indicator
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#a1a1aa', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffffff', opacity: 0.8 }} />
          <span>Verifying institutional session...</span>
        </div>
      </div>
    );
  }

  // If authenticated, render the requested workbench or task children
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // Whenever unauthenticated users attempt a task on Hedger, redirect to sign in / signup page
  const redirectTarget = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/signin?redirect=${redirectTarget}`} replace />;
};
