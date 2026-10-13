
 // src/components/client/ClientFooter.tsx

import { Link } from 'react-router-dom';
import {
  Gift,
  Heart,
  Mail,
  Users,
  CalendarHeart,
} from 'lucide-react';

export default function ClientFooter() {
  return (
    <footer className="mt-16 border-t border-red-100 bg-red-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <Link
            to="/home"
            className="inline-flex cursor-pointer items-center gap-3"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-red-600">
              <Gift size={23} />
            </span>

            <span className="text-xl font-black">
              ChristmasCards
            </span>
          </Link>

          <p className="mt-5 max-w-sm text-sm leading-7 text-red-100/75">
            Un lugar para celebrar, compartir deseos y
            conectar con las personas que hacen
            especiales tus momentos.
          </p>
        </div>

        <div>
          <h3 className="font-bold">Explorar</h3>
          <div className="mt-5 flex flex-col gap-3 text-sm text-red-100/80">
            <Link to="/home/cards" className="flex cursor-pointer items-center gap-2 hover:text-white">
              <Mail size={16} /> Tarjetas
            </Link>

            <Link to="/home/events" className="flex cursor-pointer items-center gap-2 hover:text-white">
              <CalendarHeart size={16} /> Eventos
            </Link>

            <Link to="/home/my-space" className="flex cursor-pointer items-center gap-2 hover:text-white">
              <Users size={16} /> Grupos y deseos
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-bold">Celebremos juntos</h3>

          <p className="mt-5 text-sm leading-7 text-red-100/75">
            Las mejores sorpresas nacen de compartir
            con amigos y familiares.
          </p>

          <div className="mt-4 flex items-center gap-2 text-rose-300">
            <Heart size={17} />
            <span className="text-sm font-semibold">
              Hecho para compartir
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-red-100/60">
        © {new Date().getFullYear()} ChristmasCards.
        Todos los derechos reservados.
      </div>
    </footer>
  );
}
