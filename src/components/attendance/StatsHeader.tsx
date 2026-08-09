import { Progress } from "@/components/ui/progress";

type Props = { total: number; present: number };

export function StatsHeader({ total, present }: Props) {
  const remaining = total - present;
  const pct = total === 0 ? 0 : Math.round((present / total) * 100);

  return (
    <div
      className="rounded-3xl px-5 pt-5 pb-6 text-surface-ink-foreground shadow-float"
      style={{ backgroundImage: "var(--gradient-ink)" }}
    >
      <p className="text-xs font-semibold tracking-[0.2em] opacity-70">CODING CLUB</p>
      <h1 className="mt-1 text-2xl font-bold leading-tight">Event Attendance</h1>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: total },
          { label: "Present", value: present },
          { label: "Absent", value: remaining },
          { label: "Rate", value: `${pct}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/10 px-1.5 py-3 text-center">
            <p className="text-xl font-bold tabular-nums">{s.value}</p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide opacity-75">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Progress value={pct} className="h-2 flex-1 bg-white/15" />
        <span className="text-sm font-semibold tabular-nums">{pct}%</span>
      </div>
    </div>
  );
}
