interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ label, value, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
        {label}
      </p>
      <p
        className="text-2xl font-bold text-gray-800 leading-tight"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {value}
      </p>
      {trend !== undefined && (
        <p
          className={[
            "text-xs font-medium mt-2",
            trendUp ? "text-green-600" : "text-red-500",
          ].join(" ")}
        >
          {trendUp ? "▲" : "▼"} {trend}
        </p>
      )}
    </div>
  );
}
