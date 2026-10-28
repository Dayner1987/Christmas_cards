import AdminSidebar from '../../components/admin/AdminSidebar';
import WishlistsContent from '../../components/admin/wishlists/WishlistsContent';

export default function WishlistsAdmin() {
  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-[#fff9f7]">
      <AdminSidebar />

      <main className="min-w-0 w-full flex-1 pt-16 lg:pt-0">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          <WishlistsContent />
        </div>
      </main>
    </div>
  );
}