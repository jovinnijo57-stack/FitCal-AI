import { motion } from "framer-motion";

type Props = {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  color?: string;
};

export function ProgressRing({
  value,
  max,
  size = 180,
  stroke = 14,
  label,
  sub,
  color = "var(--color-primary)",
}: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / Math.max(1, max)));
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-muted)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center px-1 overflow-hidden">
        <div className="flex items-baseline justify-center gap-1 flex-nowrap whitespace-nowrap scale-[0.85] sm:scale-100 transition-transform">
          {label && (
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              {label}
            </span>
          )}
          {sub && (
            <span className="text-[11px] sm:text-xs uppercase tracking-wider text-primary-foreground/90 font-semibold">
              {sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function MacroBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground/80">{label}</span>
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">{Math.round(value)}</span> / {max}g
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
