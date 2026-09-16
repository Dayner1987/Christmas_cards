import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconClassName = 'bg-blue-100 text-blue-600',
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-black text-slate-800">
            {value}
          </h3>
          <p className="mt-2 text-xs font-semibold text-emerald-600">
            {change}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}