
 // src/pages/client/ClientCardsPage.tsx

import ClientCards from '../../components/client/ClientCards';

export default function ClientCardsPage() {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-red-900 to-rose-600 px-7 py-10 text-white">
        <p className="text-sm font-bold uppercase tracking-wider text-red-100">
          Colección especial
        </p>

        <h1 className="mt-3 text-4xl font-black">
          Tarjetas navideñas
        </h1>

        <p className="mt-3 max-w-2xl text-red-100">
          Explora tarjetas creadas por nuestra comunidad
          o diseña una propia para compartir tus mejores deseos.
        </p>
      </div>

      <ClientCards />
    </div>
  );
}
