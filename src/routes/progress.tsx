import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { getCalorieHistory, getWeightHistory } from "@/lib/mock-data";
import { useStore, useTotals } from "@/lib/store";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid } from "recharts";
import { useState } from "react";
import { clsx } from "clsx";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — PulsePeak" }] }),
  component: Progress,
});

function Progress() {
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
  const { state } = useStore();
  const totals = useTotals();

  const { profile } = state;
  const weightHistory = getWeightHistory(profile.email, profile.weightKg);
  const calorieHistory = getCalorieHistory(totals.eaten.kcal, totals.burned, profile.email);

  // Weekly: last 7 days. Monthly: last 30 days.
  const activeWeightData = tab === "weekly" ? weightHistory.slice(-7) : weightHistory.slice(-30);
  const activeCalorieData = tab === "weekly" ? calorieHistory.slice(-7) : calorieHistory.slice(-30);

  // Avg kcal
  const avgKcal = activeCalorieData.length > 0 
    ? Math.round(activeCalorieData.reduce((a, c) => a + c.eaten, 0) / activeCalorieData.length)
    : totals.eaten.kcal;

  // Active Days count
  // "according when the user marks calorie,workouts,water taken etc active days are calculated"
  const activeDaysCount = activeCalorieData.filter(d => d.eaten > 0 || d.burned > 0).length;
  const now = new Date();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const totalDays = tab === "weekly" ? 7 : daysInCurrentMonth;
  const activeDaysText = `${activeDaysCount} / ${totalDays} days`;

  // Average weight diff
  // "instead of lost make it as average weight it can be reduced or increased in weakly and monthly when it is increased show it in red colour with + sign"
  const initialWeight = activeWeightData[0]?.weight || profile.weightKg || 70;
  const currentWeight = activeWeightData.at(-1)?.weight || profile.weightKg || 70;
  const diff = currentWeight - initialWeight;
  const isGain = diff > 0;
  const diffText = diff === 0 ? "0.0 kg" : `${isGain ? "+" : ""}${diff.toFixed(1)} kg`;
  const userGoal = profile.goal || "lose";
  const isBad = userGoal === "gain" ? diff < 0 : diff > 0;
  const diffColor = diff === 0 ? "text-foreground" : (isBad ? "text-destructive" : "text-success");

  return (
    <PhoneShell>
      <ScreenHeader title="Progress" subtitle="Weekly & monthly insights" />

      {/* Tabs */}
      <div className="mx-5 mb-4 flex rounded-2xl bg-muted p-1.5 shadow-inner">
        <button
          onClick={() => setTab("weekly")}
          className={clsx(
            "flex-1 rounded-xl py-2.5 font-display text-sm font-semibold transition-all duration-300",
            tab === "weekly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Weekly
        </button>
        <button
          onClick={() => setTab("monthly")}
          className={clsx(
            "flex-1 rounded-xl py-2.5 font-display text-sm font-semibold transition-all duration-300",
            tab === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Monthly
        </button>
      </div>

      <div className="mx-5 grid grid-cols-3 gap-3 animate-in fade-in duration-300">
        {[
          { l: "Avg kcal", v: `${avgKcal}` },
          { l: "Active Days", v: activeDaysText },
          { l: "Avg Weight", v: diffText, color: diffColor },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-gradient-card p-3 shadow-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</p>
            <p className={`mt-1 font-display text-xl font-bold ${s.color || ''}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="pb-20 space-y-4 animate-in fade-in duration-500">
        <Card title="Weight trend" sub={tab === "weekly" ? "Last 7 days" : "Last 4 weeks"}>
          {activeWeightData.length <= 1 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4 border border-dashed border-border/60 rounded-2xl bg-card/40">
              <p className="text-xs font-semibold text-muted-foreground">Chart building in progress...</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">Log your weight over multiple days to generate your trend graph.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeWeightData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "var(--color-muted-foreground)" }} />
                <YAxis domain={["dataMin - 0.5", "dataMax + 0.5"]} axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={3} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Calories in vs out" sub={tab === "weekly" ? "Weekly average" : "Monthly average"}>
          {activeCalorieData.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4 border border-dashed border-border/60 rounded-2xl bg-card/40">
              <p className="text-xs font-semibold text-muted-foreground">Chart building in progress...</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">Log your meals and workouts to generate your calorie graph.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeCalorieData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "var(--color-muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Bar dataKey="eaten" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="burned" fill="var(--color-gold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </PhoneShell>
  );
}

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="mx-5 mt-4 rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
      <div className="mb-3 flex items-baseline justify-between">
        <p className="font-display font-semibold">{title}</p>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
      <div className="h-44">{children}</div>
    </div>
  );
}
