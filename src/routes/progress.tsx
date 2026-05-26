import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { useStore, useTotals } from "@/lib/store";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — PulsePeak" }] }),
  component: Progress,
});

type WeightPoint = { day: string; weight: number };
type CaloriePoint = { day: string; eaten: number; burned: number };

function getDayLabel(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function Progress() {
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");
  const { state } = useStore();
  const totals = useTotals();
  const { profile } = state;

  const [weightHistory, setWeightHistory] = useState<WeightPoint[]>([]);
  const [calorieHistory, setCalorieHistory] = useState<CaloriePoint[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    async function fetchChartData() {
      setLoadingData(true);
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) { setLoadingData(false); return; }

      // --- Weight logs from Supabase ---
      const { data: wLogs } = await supabase
        .from("weight_logs")
        .select("weight_kg, logged_date")
        .eq("user_id", userId)
        .order("logged_date", { ascending: true });

      if (wLogs && wLogs.length > 0) {
        setWeightHistory(wLogs.map((r: any) => ({ day: getDayLabel(r.logged_date), weight: Number(r.weight_kg) })));
      } else if (profile.weightKg) {
        setWeightHistory([{ day: getDayLabel(new Date().toISOString().split("T")[0]), weight: profile.weightKg }]);
      }

      // --- Calorie logs from Supabase ---
      const { data: mLogs } = await supabase
        .from("meal_logs")
        .select("kcal, logged_date")
        .eq("user_id", userId)
        .order("logged_date", { ascending: true });

      const { data: eLogs } = await supabase
        .from("exercise_logs")
        .select("calories_burned, logged_date")
        .eq("user_id", userId)
        .order("logged_date", { ascending: true });

      // Group by date
      const calMap: Record<string, { eaten: number; burned: number }> = {};
      (mLogs || []).forEach((m: any) => {
        if (!calMap[m.logged_date]) calMap[m.logged_date] = { eaten: 0, burned: 0 };
        calMap[m.logged_date].eaten += Number(m.kcal);
      });
      (eLogs || []).forEach((e: any) => {
        if (!calMap[e.logged_date]) calMap[e.logged_date] = { eaten: 0, burned: 0 };
        calMap[e.logged_date].burned += Number(e.calories_burned);
      });

      const calHistory: CaloriePoint[] = Object.entries(calMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, vals]) => ({ day: getDayLabel(date), ...vals }));

      // Merge today's live data
      const todayStr = new Date().toISOString().split("T")[0];
      const todayLabel = getDayLabel(todayStr);
      const lastEntry = calHistory[calHistory.length - 1];
      if (!lastEntry || lastEntry.day !== todayLabel) {
        if (totals.eaten.kcal > 0 || totals.burned > 0) {
          calHistory.push({ day: todayLabel, eaten: totals.eaten.kcal, burned: totals.burned });
        }
      } else {
        // Update today's entry with live values
        lastEntry.eaten = Math.max(lastEntry.eaten, totals.eaten.kcal);
        lastEntry.burned = Math.max(lastEntry.burned, totals.burned);
      }

      setCalorieHistory(calHistory);
      setLoadingData(false);
    }
    fetchChartData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Weekly: last 7. Monthly: last 30.
  const activeWeightData = tab === "weekly" ? weightHistory.slice(-7) : weightHistory.slice(-30);
  const activeCalorieData = tab === "weekly" ? calorieHistory.slice(-7) : calorieHistory.slice(-30);

  const avgKcal = activeCalorieData.length > 0
    ? Math.round(activeCalorieData.reduce((a, c) => a + c.eaten, 0) / activeCalorieData.length)
    : totals.eaten.kcal;

  const activeDaysCount = activeCalorieData.filter(d => d.eaten > 0 || d.burned > 0).length;
  const now = new Date();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const totalDays = tab === "weekly" ? 7 : daysInCurrentMonth;
  const activeDaysText = `${activeDaysCount} / ${totalDays} days`;

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
          {loadingData ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : activeWeightData.length <= 1 ? (
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
          {loadingData ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : activeCalorieData.length === 0 ? (
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
                <Bar dataKey="eaten" name="Eaten" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="burned" name="Burned" fill="var(--color-gold)" radius={[6, 6, 0, 0]} />
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
