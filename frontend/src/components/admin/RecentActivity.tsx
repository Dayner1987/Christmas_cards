import { Heart, UserPlus } from 'lucide-react';

const activities = [
  {
    text: 'María López se registró en la plataforma',
    time: 'Hace 5 minutos',
    icon: UserPlus,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    text: 'Carlos Mendoza envió una tarjeta',
    time: 'Hace 12 minutos',
    icon: Heart,
    color: 'bg-red-100 text-red-600',
  },
  {
    text: 'Ana Torres agregó una tarjeta a su lista',
    time: 'Hace 28 minutos',
    icon: Heart,
    color: 'bg-pink-100 text-pink-600',
  },
];

export default function RecentActivity() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-bold text-slate-800">
          Actividad reciente
        </h2>

        <button className="text-xs font-bold text-blue-600">
          Ver todo →
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;

          return (
            <div
              key={activity.text}
              className="flex items-center gap-3"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${activity.color}`}
              >
                <Icon size={16} />
              </div>

              <div className="flex-1">
                <p className="text-sm text-slate-700">
                  {activity.text}
                </p>
                <span className="text-xs text-slate-400">
                  {activity.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}