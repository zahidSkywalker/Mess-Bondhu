import Card from '../ui/Card';

/**
 * StatsCard — Single metric display card for the dashboard.
 *
 * Props:
 *   label: string — metric name
 *   value: string — formatted display value (e.g., "৳5,000")
 *   icon: JSX — icon element
 *   color: 'baltic' | 'teal' | 'emerald' | 'amber' | 'red' | 'slate'
 *   subtitle: string — optional secondary text
 */
export default function StatsCard({ label, value, icon, color = 'baltic', subtitle }) {
  const colorMap = {
    baltic: {
      iconBg: 'bg-baltic/10',
      iconText: 'text-baltic dark:text-baltic-300',
      valueText: 'text-slate-800 dark:text-white',
    },
    teal: {
      iconBg: 'bg-teal/10',
      iconText: 'text-teal dark:text-teal-400',
      valueText: 'text-slate-800 dark:text-white',
    },
    emerald: {
      iconBg: 'bg-emerald/10',
      iconText: 'text-emerald-600 dark:text-emerald-400',
      valueText: 'text-slate-800 dark:text-white',
    },
    amber: {
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconText: 'text-amber-600 dark:text-amber-400',
      valueText: 'text-slate-800 dark:text-white',
    },
    red: {
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      iconText: 'text-red-500 dark:text-red-400',
      valueText: 'text-red-600 dark:text-red-400',
    },
    slate: {
      iconBg: 'bg-slate-100 dark:bg-slate-700',
      iconText: 'text-slate-500 dark:text-slate-400',
      valueText: 'text-slate-800 dark:text-white',
    },
  };

  const colors = colorMap[color] || colorMap.baltic;

  return (
    <Card hover={false} padding={true}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.iconBg}`}>
            <span className={colors.iconText}>{icon}</span>
          </div>
        )}

        {/* Value + Label */}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium truncate">
            {label}
          </p>
          <p className={`text-xl font-bold mt-0.5 leading-tight ${colors.valueText}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
