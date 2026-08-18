import {
  Gift,
  ShieldCheck,
} from 'lucide-react';

export default function HomeAdmin() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-gradient-to-r from-purple-800 to-fuchsia-700 p-10 text-white shadow-xl">
          <div className="flex items-center gap-3">
            <Gift />

            <span className="font-bold">
              ChristmasCards
            </span>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <ShieldCheck size={36} />

            <h1 className="text-4xl font-black">
              Panel administrativo
            </h1>
          </div>
        </div>
      </div>
    </main>
  );
}