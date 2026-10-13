
 // src/components/client/ClientLayout.tsx

import { Outlet } from 'react-router-dom';

import ClientNavbar from './ClientNavbar';
import ClientFooter from './ClientFooter';

export default function ClientLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#fff8f5] text-slate-900">
      <ClientNavbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <ClientFooter />
    </div>
  );
}
