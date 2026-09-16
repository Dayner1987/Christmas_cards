import type { ReactNode } from 'react';
import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ClientHome from './pages/client/ClientHome';
import HomeAdmin from './pages/admin/AdminHome';
import { authStorage } from './config/auth.storage';

function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: ReactNode;
  allowedRole?: 'admin' | 'client';
}) {
  const user = authStorage.getUser();

  if (!authStorage.isAuthenticated() || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/home'}
        replace
      />
    );
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const user = authStorage.getUser();

  if (authStorage.isAuthenticated() && user) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/home'}
        replace
      />
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRole="client">
            <ClientHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <HomeAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
}