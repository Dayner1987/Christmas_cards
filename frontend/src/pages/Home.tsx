//src/pages/Home.tsx
import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { Link } from 'react-router-dom';

import {
  ArrowRight,
  Check,
  ChevronRight,
  Gift,
  Heart,
  Mail,
  Menu,
  PartyPopper,
  Sparkles,
  Stars,
  Users,
  X,
} from 'lucide-react';

import { authStorage } from '../config/auth.storage';

const navigation = [
  {
    label: 'Inicio',
    href: '#inicio',
  },
  {
    label: 'Qué puedes hacer',
    href: '#funcionalidades',
  },
  {
    label: 'Cómo funciona',
    href: '#como-funciona',
  },
];

const features = [
  {
    title: 'Tarjetas con intención',
    description:
      'Elige una tarjeta y acompáñala con esas palabras que hacen especial un regalo.',
    icon: Mail,
    color: 'bg-purple-100 text-purple-700',
  },
  {
    title: 'Tus personas, juntas',
    description:
      'Organiza grupos con familiares y amigos para compartir la emoción de estas fechas.',
    icon: Users,
    color: 'bg-fuchsia-100 text-fuchsia-700',
  },
  {
    title: 'Deseos para compartir',
    description:
      'Crea tu lista de deseos y descubre pequeños detalles que alegrarían a los demás.',
    icon: Heart,
    color: 'bg-violet-100 text-violet-700',
  },
  {
    title: 'Un amigo secreto',
    description:
      'Organiza el intercambio de regalos de tu grupo y disfruta de preparar una sorpresa.',
    icon: Gift,
    color: 'bg-pink-100 text-pink-700',
  },
];

const steps = [
  {
    number: '01',
    title: 'Crea tu cuenta',
    description:
      'Regístrate y personaliza tu perfil para comenzar.',
  },
  {
    number: '02',
    title: 'Reúne a tu grupo',
    description:
      'Invita a tus personas favoritas y compartan sus deseos.',
  },
  {
    number: '03',
    title: 'Haz sonreír a alguien',
    description:
      'Envía una tarjeta o prepara un regalo con significado.',
  },
];

const primaryButton =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 outline-none transition hover:from-purple-700 hover:to-fuchsia-700 focus-visible:ring-4 focus-visible:ring-purple-300';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [session, setSession] = useState(() =>
    authStorage.isAuthenticated()
      ? authStorage.getUser()
      : null,
  );

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const refreshSession = () => {
      setSession(
        authStorage.isAuthenticated()
          ? authStorage.getUser()
          : null,
      );
    };

    window.addEventListener('storage', refreshSession);
    window.addEventListener(
      'profile:updated',
      refreshSession,
    );

    return () => {
      window.removeEventListener(
        'storage',
        refreshSession,
      );

      window.removeEventListener(
        'profile:updated',
        refreshSession,
      );
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    const handleOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !headerRef.current?.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener(
      'pointerdown',
      handleOutside,
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape,
      );

      document.removeEventListener(
        'pointerdown',
        handleOutside,
      );
    };
  }, [menuOpen]);

  const hasSession =
    session?.role === 'admin' ||
    session?.role === 'client';

  const dashboardPath =
    session?.role === 'admin' ? '/admin' : '/home';

  const startPath = hasSession
    ? dashboardPath
    : '/register';

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#fcfaff] font-sans text-slate-800">
      <a
        href="#contenido"
        className="sr-only fixed left-4 top-4 z-[60] rounded-xl bg-white px-4 py-3 font-bold text-purple-800 shadow-lg focus:not-sr-only"
      >
        Saltar al contenido
      </a>

      {/* Navbar */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 border-b border-purple-100 bg-white/95 backdrop-blur-xl"
      >
        <div className="mx-auto flex min-h-[80px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            onClick={closeMenu}
            aria-label="ChristmasCards, página principal"
            className="flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-purple-200"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-200">
              <Gift size={23} aria-hidden="true" />
            </span>

            <span className="text-base font-black tracking-tight text-purple-950 sm:text-xl">
              ChristmasCards
            </span>
          </Link>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-6 lg:flex"
          >
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg py-2 text-sm font-semibold text-slate-600 outline-none transition hover:text-purple-700 focus-visible:ring-2 focus-visible:ring-purple-300"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {hasSession ? (
              <Link
                to={dashboardPath}
                className={primaryButton}
              >
                Ir a mi espacio
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-3 text-sm font-bold text-purple-800 outline-none transition hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-purple-300"
                >
                  Iniciar sesión
                </Link>

                <Link
                  to="/register"
                  className={primaryButton}
                >
                  Crear cuenta
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </>
            )}
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={
              menuOpen ? 'Cerrar menú' : 'Abrir menú'
            }
            aria-expanded={menuOpen}
            aria-controls="home-mobile-menu"
            onClick={() =>
              setMenuOpen((current) => !current)
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-purple-100 text-purple-900 outline-none transition hover:bg-purple-50 focus-visible:ring-2 focus-visible:ring-purple-400 lg:hidden"
          >
            {menuOpen ? (
              <X size={23} aria-hidden="true" />
            ) : (
              <Menu size={23} aria-hidden="true" />
            )}
          </button>
        </div>

        {menuOpen && (
          <nav
            id="home-mobile-menu"
            aria-label="Navegación móvil"
            className="max-h-[calc(100dvh-80px)] overflow-y-auto border-t border-purple-100 bg-white px-4 py-4 lg:hidden"
          >
            <div className="mx-auto max-w-7xl space-y-1">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700"
                >
                  {item.label}
                </a>
              ))}

              <div className="grid gap-3 border-t border-purple-100 pt-4">
                {hasSession ? (
                  <Link
                    to={dashboardPath}
                    onClick={closeMenu}
                    className={primaryButton}
                  >
                    Ir a mi espacio
                    <ArrowRight
                      size={17}
                      aria-hidden="true"
                    />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="rounded-xl border border-purple-200 px-4 py-3 text-center text-sm font-bold text-purple-800"
                    >
                      Iniciar sesión
                    </Link>

                    <Link
                      to="/register"
                      onClick={closeMenu}
                      className={primaryButton}
                    >
                      Crear cuenta
                      <ArrowRight
                        size={17}
                        aria-hidden="true"
                      />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="contenido">
        {/* Presentación */}
        <section
          id="inicio"
          className="relative scroll-mt-24 overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-fuchsia-400/20 blur-3xl"
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-purple-100 sm:text-sm">
                <Sparkles
                  size={16}
                  className="text-fuchsia-300"
                  aria-hidden="true"
                />
                Pequeños detalles, grandes sonrisas
              </span>

              <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                La Navidad se disfruta más
                <span className="text-fuchsia-300">
                  {' '}juntos.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-purple-100 sm:text-lg">
                Envía tarjetas, comparte deseos y organiza
                el amigo secreto con tus personas favoritas.
                Todo comienza con un detalle.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={startPath}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-purple-900 shadow-xl shadow-black/10 outline-none transition hover:bg-purple-50 focus-visible:ring-4 focus-visible:ring-fuchsia-300"
                >
                  {hasSession
                    ? 'Entrar a mi espacio'
                    : 'Crear mi cuenta'}

                  <ArrowRight
                    size={18}
                    aria-hidden="true"
                  />
                </Link>

                <a
                  href="#como-funciona"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white outline-none transition hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-purple-300"
                >
                  Descubre cómo funciona
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                  />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-purple-100 sm:text-sm">
                {[
                  'Tarjetas personales',
                  'Deseos compartidos',
                  'Sorpresas en grupo',
                ].map((text) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-2"
                  >
                    <Check
                      size={15}
                      aria-hidden="true"
                      className="text-fuchsia-300"
                    />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Composición de ejemplo hecha con Tailwind */}
            <div className="relative mx-auto w-full max-w-lg pb-6 pt-4 lg:pt-0">
              <div
                aria-hidden="true"
                className="absolute inset-8 rotate-6 rounded-[2rem] border border-white/15 bg-white/10"
              />

              <div className="relative rounded-[2rem] border border-white/20 bg-white/10 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
                <div className="rounded-3xl bg-[#fffaf5] p-6 text-center sm:p-10">
                  <div className="flex items-center justify-between text-purple-400">
                    <Stars size={23} aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-700">
                      Un detalle para ti
                    </span>
                    <Sparkles size={23} aria-hidden="true" />
                  </div>

                  <div className="mx-auto mt-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white shadow-xl shadow-purple-200 sm:h-28 sm:w-28">
                    <Gift
                      size={55}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-7 text-3xl font-black tracking-tight text-purple-950 sm:text-4xl">
                    ¡Feliz Navidad!
                  </p>

                  <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-slate-600">
                    Que nunca falten las risas, los abrazos
                    y las personas que hacen especial tu vida.
                  </p>

                  <div className="mt-7 flex items-center justify-center gap-2 text-sm font-bold text-purple-700">
                    <Heart
                      size={16}
                      aria-hidden="true"
                      className="fill-purple-100"
                    />
                    Con mucho cariño
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 px-1 text-white">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Mail size={19} aria-hidden="true" />
                  </span>

                  <div>
                    <p className="text-sm font-semibold">
                      Un mensaje puede alegrar el día
                    </p>
                    <p className="mt-1 text-xs text-purple-200">
                      Ejemplo de una tarjeta para compartir
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Funcionalidades */}
        <section
          id="funcionalidades"
          className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex rounded-full bg-purple-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-purple-700">
                Más que una tarjeta
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-purple-950 sm:text-4xl">
                Un lugar para compartir lo bonito.
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                Encuentra una forma de estar cerca, organizar
                tus planes y sorprender a quienes quieres.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm transition hover:border-purple-200 hover:shadow-lg hover:shadow-purple-900/5"
                  >
                    <span
                      className={`flex h-13 w-13 items-center justify-center rounded-2xl p-3 ${feature.color}`}
                    >
                      <Icon size={26} aria-hidden="true" />
                    </span>

                    <h3 className="mt-5 text-lg font-bold text-purple-950">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pasos */}
        <section
          id="como-funciona"
          className="scroll-mt-24 border-y border-purple-100 bg-purple-50/70 px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-purple-600">
                  Así de sencillo
                </span>

                <h2 className="mt-4 text-3xl font-black tracking-tight text-purple-950 sm:text-4xl">
                  De una idea a una sonrisa.
                </h2>

                <p className="mt-5 max-w-md text-base leading-8 text-slate-600">
                  No hace falta esperar al regalo perfecto.
                  Empieza reuniendo a tus personas favoritas
                  y deja que los detalles hagan el resto.
                </p>

                <Link
                  to={startPath}
                  className={`${primaryButton} mt-7`}
                >
                  {hasSession ? 'Ir a mi espacio' : 'Comenzar'}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>

              <div className="space-y-4">
                {steps.map((step) => (
                  <article
                    key={step.number}
                    className="flex items-start gap-4 rounded-2xl border border-purple-100 bg-white p-5 sm:gap-5 sm:p-6"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-lg font-black text-purple-700">
                      {step.number}
                    </span>

                    <div>
                      <h3 className="text-lg font-bold text-purple-950">
                        {step.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {step.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Invitación final */}
        <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-purple-950 via-purple-800 to-fuchsia-800 px-6 py-12 text-center sm:px-12 sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
            />

            <div className="relative">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-fuchsia-200">
                <PartyPopper size={32} aria-hidden="true" />
              </span>

              <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
                Haz que esta Navidad tenga algo de ti.
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-purple-100 sm:text-base">
                Una tarjeta, un deseo, una sorpresa.
                Elige cómo quieres empezar.
              </p>

              <Link
                to={startPath}
                className="mt-7 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-black text-purple-900 outline-none transition hover:bg-purple-50 focus-visible:ring-4 focus-visible:ring-fuchsia-300"
              >
                {hasSession
                  ? 'Volver a mi espacio'
                  : 'Crear mi cuenta'}

                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-violet-950 px-4 pb-6 pt-12 text-purple-100 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 pb-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white">
                  <Gift size={22} aria-hidden="true" />
                </span>

                <span className="text-lg font-black text-white">
                  ChristmasCards
                </span>
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-7 text-purple-200">
                Un espacio para compartir momentos especiales
                con familia y amigos, un detalle a la vez.
              </p>
            </div>

            <nav aria-label="Explorar">
              <h2 className="text-sm font-bold text-white">
                Explora
              </h2>

              <ul className="mt-4 space-y-3 text-sm">
                {navigation.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-purple-200 transition hover:text-white"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Acceso a la cuenta">
              <h2 className="text-sm font-bold text-white">
                Tu cuenta
              </h2>

              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    to="/login"
                    className="text-purple-200 transition hover:text-white"
                  >
                    Iniciar sesión
                  </Link>
                </li>

                <li>
                  <Link
                    to="/register"
                    className="text-purple-200 transition hover:text-white"
                  >
                    Crear cuenta
                  </Link>
                </li>

                {hasSession && (
                  <li>
                    <Link
                      to={dashboardPath}
                      className="text-purple-200 transition hover:text-white"
                    >
                      Ir a mi espacio
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs text-purple-200 sm:flex-row sm:text-left">
            <p>
              © {new Date().getFullYear()} ChristmasCards.
            </p>

            <p className="inline-flex items-center gap-1.5">
              Hecho para compartir
              <Heart
                size={13}
                aria-hidden="true"
                className="text-fuchsia-300"
              />
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}