import Marketplace from './pages/network/Marketplace';
import Community from './pages/network/Community';
import StoreRegister from './pages/network/StoreRegister';
import StoreDashboard from './pages/network/StoreDashboard';
import MusicPlayer from './components/music/MusicPlayer';
import MusicAdmin from './pages/admin/MusicAdmin';
import AdminProducts from './pages/admin/AdminProducts';
import AdminStores from './pages/admin/AdminStores';
import PasswordRecovery from './pages/PasswordRecovery';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

import ClientHome from './pages/client/ClientHome';
import JoinGroup from './pages/JoinGroup';
import GuestDashboard from './pages/GuestDashboard';

import HomeAdmin from './pages/admin/AdminHome';
import AdminUsers from './pages/admin/AdminUsers';
import GroupsAdmin from './pages/admin/GroupsAdmin';
import CardsAdmin from './pages/admin/CardsAdmin';
import WishlistsAdmin from './pages/admin/WishlistsAdmin';
import SecretSantaAdmin from './pages/admin/SecretSantaAdmin';

import EditUser from './components/admin/users/editUser';


import ClientLayout from './components/client/ClientLayout';
import ClientCardsPage from './pages/client/ClientCardsPage';

import ClientSpacePage from './pages/client/ClientSpacePage';

import ClientGroupDetailsPage from './pages/client/ClientGroupDetailsPage';
import ClientFriendProfilePage from './pages/client/ClientFriendProfilePage';


import CardDetailPage from './pages/client/CardDetailPage';

import { authStorage } from './config/auth.storage';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: 'admin' | 'client' | 'store';
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

  if (user.role !== 'admin' && user.role !== 'client' && user.role !== 'store') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : user.role === 'store' ? '/tienda/dashboard' : '/home'}
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
    (user.role === 'admin' || user.role === 'client' || user.role === 'store')
  ) {
    return (
      <Navigate
        to={user.role === 'admin' ? '/admin' : user.role === 'store' ? '/tienda/dashboard' : '/home'}
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
      backPath={user?.role === 'admin' ? '/admin' : user?.role === 'store' ? '/tienda/dashboard' : '/home'}
    />
  );
}

export default function App() {
  return (
    <>
    <MusicPlayer/>
    <Routes>
      <Route path="/admin/products" element={<ProtectedRoute allowedRole="admin"><AdminProducts/></ProtectedRoute>}/>
      <Route element={<ClientLayout/>}>
        <Route path="/tiendas" element={<Marketplace/>}/>
        <Route path="/productos" element={<Marketplace/>}/>
        <Route path="/tiendas/productos/:productId" element={<Marketplace/>}/>
        <Route path="/tiendas/:storeId" element={<Marketplace/>}/>
        <Route path="/comunidad" element={<Community/>}/>
        <Route path="/comunidad/:userId" element={<Community/>}/>
        <Route path="/tiendas/registro" element={<PublicRoute><StoreRegister/></PublicRoute>}/>
        <Route path="/tienda/dashboard" element={<ProtectedRoute allowedRole="store"><StoreDashboard/></ProtectedRoute>}/>
      </Route>
      <Route path="/forgot-password" element={<PasswordRecovery/>}/>
      <Route path="/reset-password" element={<PasswordRecovery reset/>}/>
      <Route path="/admin/music" element={<ProtectedRoute allowedRole="admin"><MusicAdmin/></ProtectedRoute>}/>
      {/* Portada accesible con o sin sesión */}
      <Route path="/" element={<Home />} />

      {/* Vista pública: el enlace permite abrir una tarjeta sin iniciar sesión. */}
      <Route element={<ClientLayout />}>
        <Route
          path="/tarjetas/:cardId"
          element={<CardDetailPage publicView />}
        />
      </Route>

      {/* Invitaciones y acceso sin cuenta */}
      <Route path="/groups/join/:code" element={<JoinGroup />} />
      <Route path="/guests/participation/:groupId" element={<GuestDashboard />} />

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

      
{/* ================================================= */}
{/* CLIENTE */}
{/* ================================================= */}

<Route
  path="/home"
  element={
    <ProtectedRoute allowedRole="client">
      <ClientLayout />
    </ProtectedRoute>
  }
>
  {/* Inicio del cliente */}
  <Route
    index
    element={<ClientHome />}
  />

  {/* Catálogo de tarjetas */}
  <Route
    path="cards"
    element={<ClientCardsPage />}
  />

  {/* Catálogo público de productos de las tiendas */}
  <Route
    path="products"
    element={<Marketplace />}
  />
  {/* Vista completa dentro del área privada del cliente. */}
  <Route
    path="cards/:cardId"
    element={<CardDetailPage />}
  />
  <Route
  path="mailbox"
  element={<Navigate to="/home/my-space?section=mailbox" replace />}
/>

  {/* Eventos de Amigo Secreto */}
  <Route
    path="events"
    element={<Navigate to="/home/my-space?section=events" replace />}
  />

  {/* Espacio personal: grupos y deseos */}
  <Route
    path="my-space"
    element={<ClientSpacePage />}
  />

  {/* Detalles de un grupo */}
  <Route
    path="groups/:groupId"
    element={<ClientGroupDetailsPage />}
  />

  {/* Perfil de un integrante del grupo */}
  <Route
    path="groups/:groupId/members/:memberId"
    element={<ClientFriendProfilePage />}
  />
</Route>

{/* Edición de perfil del cliente */}
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
        path="/admin/stores"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminStores />
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
        path="/admin/cards"
        element={
          <ProtectedRoute allowedRole="admin">
            <CardsAdmin />
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
        path="/admin/wishlists"
        element={
          <ProtectedRoute allowedRole="admin">
            <WishlistsAdmin />
          </ProtectedRoute>
        }
      />
    <Route
      path="/admin/secret-santa"
      element={
        <ProtectedRoute allowedRole="admin">
          <SecretSantaAdmin />
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
    </>
  );
}