import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
