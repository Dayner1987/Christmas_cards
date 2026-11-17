
 // src/pages/Home.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Gift, Menu, X, Check } from 'lucide-react';
import { authStorage } from '../config/auth.storage';

const menu = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Qué puedes hacer', href: '#funcionalidades' },
  { label: 'Cómo funciona', href: '#como-funciona' },
];

const photos = {
  hero: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?auto=format&fit=crop&w=1200&q=85',
  cards: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=700&q=80',
  groups: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&w=700&q=80',
  wishes: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=700&q=80',
  secret: 'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?auto=format&fit=crop&w=700&q=80',
};

const features = [
  {
    title: 'Tarjetas llenas de cariño',
    text: 'Envía mensajes especiales que hagan sonreír a quienes más quieres.',
    photo: photos.cards,
  },
  {
    title: 'Grupos para compartir',
    text: 'Invita a tu familia y amigos a un espacio para celebrar juntos.',
    photo: photos.groups,
  },
  {
    title: 'Listas de deseos',
    text: 'Comparte tus ideas de regalo para que cada detalle sea acertado.',
    photo: photos.wishes,
  },
  {
    title: 'Amigo secreto',
    text: 'Organiza el sorteo y descubre de forma privada a quién sorprender.',
    photo: photos.secret,
  },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [user, setUser] = useState(() =>
    authStorage.isAuthenticated() ? authStorage.getUser() : null,
  );

  useEffect(() => {
    const refresh = () => {
      setUser(authStorage.isAuthenticated() ? authStorage.getUser() : null);
    };

    window.addEventListener('storage', refresh);
    window.addEventListener('profile:updated', refresh);

    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('profile:updated', refresh);
    };
  }, []);

  const loggedIn = user?.role === 'client' || user?.role === 'admin';
  const panel = user?.role === 'admin' ? '/admin' : '/home';
  const start = loggedIn ? panel : '/register';

  return (
    <div className="min-h-screen bg-[#fff9f5] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-red-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 font-black text-red-950"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-600 text-white">
              <Gift size={23} />
            </span>
            <span className="text-lg">ChristmasCards</span>
          </Link>

          <nav
            className="hidden items-center gap-8 lg:flex"
            aria-label="Navegación principal"
          >
            {menu.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-slate-600 hover:text-red-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            {!loggedIn && (
              <Link
                to="/login"
                className="text-sm font-bold text-red-800 hover:underline"
              >
                Iniciar sesión
              </Link>
            )}

            <Link
              to={start}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              {loggedIn ? 'Ir a mi espacio' : 'Crear cuenta'}
              <ArrowRight size={17} />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label="Abrir menú"
            className="cursor-pointer rounded-xl p-2 text-red-800 lg:hidden"
          >
            {menuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="space-y-1 border-t border-red-100 bg-white px-5 py-4 lg:hidden">
            {menu.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-semibold hover:bg-red-50"
              >
                {item.label}
              </a>
            ))}

            {!loggedIn && (
              <Link
                to="/login"
                className="block rounded-lg px-3 py-3 text-sm font-semibold text-red-700"
              >
                Iniciar sesión
              </Link>
            )}

            <Link
              to={start}
              className="block rounded-lg bg-red-600 px-3 py-3 text-center text-sm font-bold text-white"
            >
              {loggedIn ? 'Ir a mi espacio' : 'Crear cuenta'}
            </Link>
          </nav>
        )}
      </header>

      <main>
        <section
          id="inicio"
          className="bg-gradient-to-br from-[#55090d] via-[#870f1b] to-[#b51e34] text-white"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:min-h-[610px] lg:grid-cols-2 lg:py-20">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-wide text-red-100">
                Pequeños detalles, grandes sonrisas
              </span>

              <h1 className="mt-7 max-w-xl text-4xl font-black leading-tight tracking-tight sm:text-5xl xl:text-6xl">
                La Navidad se disfruta más{' '}
                <span className="text-rose-300">juntos.</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-red-100">
                Envía tarjetas, comparte deseos y organiza el amigo secreto
                con tus personas favoritas. Todo comienza con un detalle.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={start}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-red-900 transition hover:bg-rose-50"
                >
                  {loggedIn ? 'Ir a mi espacio' : 'Crear mi cuenta'}
                  <ArrowRight size={17} />
                </Link>

                <a
                  href="#como-funciona"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/20"
                >
                  Descubre cómo funciona
                  <ArrowRight size={16} />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-red-100">
                {[
                  'Tarjetas personales',
                  'Deseos compartidos',
                  'Sorpresas en grupo',
                ].map((text) => (
                  <span key={text} className="inline-flex items-center gap-1.5">
                    <Check size={15} />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] border border-white/10 bg-white/10 blur-sm" />

              <img
                src={photos.hero}
                alt="Decoración navideña con luces y regalos"
                fetchPriority="high"
                className="relative h-[340px] w-full rounded-[2rem] object-cover shadow-2xl sm:h-[480px]"
              />

              <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/25 bg-red-950/70 p-5 backdrop-blur-md">
                <p className="text-lg font-black">
                  Los mejores regalos se comparten
                </p>
                <p className="mt-1 text-sm text-red-100">
                  Un espacio para crear recuerdos con quienes más quieres.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="funcionalidades"
          className="mx-auto max-w-7xl px-5 py-20 sm:px-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
              Todo en un solo lugar
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-red-950 sm:text-4xl">
              Una Navidad para recordar
            </h2>
            <p className="mt-4 text-slate-600">
              Menos complicaciones, más momentos especiales.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group overflow-hidden rounded-3xl border border-red-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <img
                  src={feature.photo}
                  alt={feature.title}
                  loading="lazy"
                  className="h-48 w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="p-6">
                  <h3 className="text-lg font-black text-red-950">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feature.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="como-funciona"
          className="bg-white px-5 py-20 sm:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-red-600">
                Fácil y rápido
              </span>
              <h2 className="mt-3 text-3xl font-black text-red-950 sm:text-4xl">
                ¿Cómo funciona?
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                ['01', 'Crea tu cuenta', 'Personaliza tu perfil para empezar a compartir.'],
                ['02', 'Invita a tu grupo', 'Reúne a tus amigos y familiares en un mismo lugar.'],
                ['03', 'Comparte la sorpresa', 'Prepara tarjetas, deseos y el sorteo de amigo secreto.'],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="rounded-3xl border border-red-100 bg-[#fff9f5] p-8"
                >
                  <span className="text-4xl font-black text-red-200">
                    {number}
                  </span>
                  <h3 className="mt-4 text-xl font-black text-red-950">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to={start}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 font-bold text-white hover:bg-red-700"
              >
                {loggedIn ? 'Continuar a mi espacio' : 'Comenzar ahora'}
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-red-950 to-red-800 px-5 py-16 text-center text-white">
          <h2 className="text-3xl font-black sm:text-4xl">
            Los mejores momentos se viven juntos.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-red-100">
            Tu próxima celebración puede empezar hoy.
          </p>
          <Link
            to={start}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-black text-red-900 hover:bg-rose-50"
          >
            {loggedIn ? 'Mi espacio' : 'Crear cuenta'}
            <ArrowRight size={17} />
          </Link>
        </section>
      </main>

      <footer className="bg-[#3d070c] px-5 py-8 text-red-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <p className="font-black">ChristmasCards</p>
          <p className="text-sm">Regala momentos, comparte sonrisas.</p>
          <p className="text-xs text-red-200">
            © {new Date().getFullYear()} ChristmasCards
          </p>
        </div>
      </footer>
    </div>
  );
}
