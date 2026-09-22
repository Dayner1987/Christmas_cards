import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import ClientHome from './pages/client/ClientHome';

import HomeAdmin from './pages/admin/AdminHome';
import AdminUsers from './pages/admin/AdminUsers';
import GroupsAdmin from './pages/admin/GroupsAdmin';

import EditUser from './components/admin/users/editUser';

import { authStorage } from './config/auth.storage';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: 'admin' | 'client';
}

interface PublicRouteProps {
  children: ReactNode;
}

function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const user = authStorage.getUser();

  if (!authStorage.isAuthenticated() || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin' && user.role !== 'client') {
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

function PublicRoute({ children }: PublicRouteProps) {
  const user = authStorage.getUser();

  if (
    authStorage.isAuthenticated() &&
    user &&
    (user.role === 'admin' || user.role === 'client')
  ) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : '/home'}
        replace
      />
    );
  }

  return <>{children}</>;
}

// Perfil compartido para el MobileNavbar.
// El botón "Volver" respeta el rol de la sesión.
function MyProfilePage() {
  const user = authStorage.getUser();

  return (
    <EditUser
      backPath={user?.role === 'admin' ? '/admin' : '/home'}
    />
  );
}

export default function App() {
  return (
    <Routes>
      {/* Portada accesible con o sin sesión */}
      <Route path="/" element={<Home />} />

      {/* Autenticación */}
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

      {/* Perfil compartido: administrador y cliente */}
      <Route
        path="/perfil/editar"
        element={
          <ProtectedRoute>
            <MyProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Cliente */}
      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRole="client">
            <ClientHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/home/perfil/editar"
        element={
          <ProtectedRoute allowedRole="client">
            <EditUser backPath="/home" />
          </ProtectedRoute>
        }
      />

      {/* Administrador */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <HomeAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/groups"
        element={
          <ProtectedRoute allowedRole="admin">
            <GroupsAdmin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/perfil/editar"
        element={
          <ProtectedRoute allowedRole="admin">
            <EditUser backPath="/admin" />
          </ProtectedRoute>
        }
      />

      {/* Rutas inexistentes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}