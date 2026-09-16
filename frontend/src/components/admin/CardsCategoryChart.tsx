import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const data = [
  { name: 'Tradicionales', value: 28, color: '#172554' },
  { name: 'Divertidas', value: 18, color: '#2563eb' },
  { name: 'Religiosas', value: 16, color: '#d4a72c' },
  { name: 'Familia', value: 14, color: '#16a34a' },
  { name: 'Amigos', value: 12, color: '#f97316' },
  { name: 'Otras', value: 12, color: '#94a3b8' },
];

export default function CardsCategoryChart() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-800">
        Tarjetas más populares
      </h2>

      <div className="flex h-64 items-center gap-3">
        <div className="h-full w-1/2">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={82}
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 text-xs">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600">
                {item.name}
              </span>
              <strong>{item.value}%</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}