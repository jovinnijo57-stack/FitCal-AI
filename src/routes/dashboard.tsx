import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Bell,
  Droplet,
  Flame,
  TrendingDown,
  Activity,
  Sparkles,
  Utensils,
  Dumbbell,
  Calendar,
  Navigation,
} from "lucide-react";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { ProgressRing, MacroBar } from "@/components/ProgressRing";
import { useStore, useTotals } from "@/lib/store";
import { getCalorieHistory, getWeightHistory } from "@/lib/mock-data";
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PulsePeak" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { state, addWater } = useStore();
  const totals = useTotals();
  const { profile } = state;

  let firstName = "User";
  const isPlaceholderName = (n?: string) =>
    !n ||
    n.trim() === "" ||
    n.includes("PulsePeak") ||
    n.includes("New User") ||
    n.toLowerCase() === "user";

  if (profile.name && !isPlaceholderName(profile.name)) {
    firstName = profile.name.split(" ")[0];
  } else if (profile.email && profile.email.trim() !== "") {
    const prefix = profile.email.split("@")[0].split(".")[0].split("_")[0];
    if (prefix && prefix.toLowerCase() !== "user") {
      firstName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
  }

  const weightHistory = getWeightHistory(profile.email, profile.weightKg);
  const calorieHistory = getCalorieHistory(totals.eaten.kcal, totals.burned, profile.email);
  const latestWeight = weightHistory.at(-1)?.weight || profile.weightKg;
  const initialWeight = weightHistory[0]?.weight || profile.weightKg;
  const diff = latestWeight - initialWeight;
  const isGain = diff > 0;
  const diffText = diff === 0 ? "0.0 kg" : `${isGain ? "+" : ""}${diff.toFixed(1)} kg`;
  const isBad = profile.goal === "gain" ? diff < 0 : diff > 0;
  const badgeColor =
    diff === 0
      ? "bg-muted text-foreground"
      : isBad
        ? "bg-destructive/15 text-destructive"
        : "bg-success/15 text-success";

  return (
    <PhoneShell>
      <ScreenHeader
        title={`Hey ${firstName} 👋`}
        subtitle="Let's crush today's goals."
        action={
          <Link
            to="/profile"
            className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-card"
          >
            <Bell className="h-4 w-4" />
          </Link>
        }
      />

      {/* Calorie hero */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-glow"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Today</p>
            <p className="font-display text-lg font-semibold">Calories remaining</p>
          </div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            Goal {profile.calorieGoal}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <ProgressRing
            value={totals.eaten.kcal}
            max={profile.calorieGoal}
            size={150}
            stroke={12}
            label={`${Math.max(0, totals.remaining)}`}
            sub="kcal left"
            color="oklch(0.78 0.13 85)"
          />
          <div className="flex-1 space-y-3 text-sm">
            <Stat
              icon={<Flame className="h-4 w-4 text-gold" />}
              label="Eaten"
              value={`${totals.eaten.kcal} kcal`}
            />
            <Stat
              icon={<Activity className="h-4 w-4 text-gold" />}
              label="Burned"
              value={`${totals.burned} kcal`}
            />
            <Stat
              icon={<TrendingDown className="h-4 w-4 text-gold" />}
              label="Net"
              value={`${totals.net} kcal`}
            />
          </div>
        </div>
      </motion.div>

      {/* Macros */}
      <div className="mx-5 mt-4 rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold">Macros</h2>
          <span className="text-xs text-muted-foreground">Daily targets</span>
        </div>
        <div className="space-y-3.5">
          <MacroBar
            label="Protein"
            value={totals.eaten.protein}
            max={profile.proteinGoal}
            color="var(--color-protein)"
          />
          <MacroBar
            label="Carbs"
            value={totals.eaten.carbs}
            max={profile.carbsGoal}
            color="var(--color-carbs)"
          />
          <MacroBar
            label="Fats"
            value={totals.eaten.fats}
            max={profile.fatsGoal}
            color="var(--color-fats)"
          />
        </div>
      </div>

      {/* Water + AI tile */}
      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <Link
          to="/water"
          className="block rounded-3xl border border-border bg-gradient-card p-4 shadow-card hover:border-primary/50 transition relative group"
        >
          <div className="flex items-center justify-between">
            <Droplet className="h-5 w-5" style={{ color: "var(--color-water)" }} />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition">
              Track Water →
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1 flex-nowrap overflow-hidden whitespace-nowrap">
            <span className="font-display text-2xl font-bold tracking-tight">
              {(state.waterMl / 1000).toFixed(1)}
            </span>
            <span className="text-xs sm:text-sm font-medium text-muted-foreground">
              / {profile.waterGoalMl / 1000}L
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (state.waterMl / profile.waterGoalMl) * 100)}%`,
                background: "var(--color-water)",
              }}
            />
          </div>
          <div className="mt-3 flex gap-1.5">
            {[250, 500].map((ml) => (
              <button
                key={ml}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addWater(ml);
                }}
                className="flex-1 rounded-xl bg-muted py-1.5 text-xs font-semibold hover:bg-primary/20 hover:text-primary transition"
              >
                +{ml}ml
              </button>
            ))}
          </div>
        </Link>

        <Link
          to="/ai"
          className="group relative overflow-hidden rounded-3xl bg-gradient-gold p-4 text-gold-foreground shadow-card"
        >
          <Sparkles className="h-5 w-5" />
          <p className="mt-3 font-display text-lg font-bold leading-tight">AI meal ideas</p>
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
            Get suggestions →
          </span>
        </Link>
      </div>

      {/* Meal Planner + Ai Gym Exercises tiles */}
      <div className="mx-5 mt-3 grid grid-cols-2 gap-3">
        <Link
          to="/recipes"
          search={{ tab: "planner" } as any}
          className="block rounded-3xl border border-border bg-gradient-card p-4 shadow-card hover:border-primary/50 transition relative group"
        >
          <div className="flex items-center justify-between">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition">
              Planner →
            </span>
          </div>
          <p className="mt-3 font-display text-lg font-bold leading-tight">Meal Planner</p>
          <span className="mt-1 block text-xs text-muted-foreground">Weekly meal schedule</span>
        </Link>

        <Link
          to="/exercise"
          search={{ intro: "true" } as any}
          className="block rounded-3xl border border-border bg-gradient-card p-4 shadow-card hover:border-primary/50 transition relative group"
        >
          <div className="flex items-center justify-between">
            <Dumbbell className="h-5 w-5 text-amber-500" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition">
              Gym →
            </span>
          </div>
          <p className="mt-3 font-display text-lg font-bold leading-tight">Ai Gym Exercises</p>
          <span className="mt-1 block text-xs text-muted-foreground">
            Browse exercises & video guides
          </span>
        </Link>
      </div>

      {/* Track Activity tile */}
      <div className="mx-5 mt-3">
        <Link
          to="/train"
          className="block rounded-3xl overflow-hidden relative shadow-card hover:scale-[1.01] transition active:scale-95"
          style={{ background: "linear-gradient(135deg, #0f2846 0%, #1e3a5f 60%, #1d4ed8 100%)" }}
        >
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="h-4 w-4 text-blue-300" />
                <span className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">GPS Tracker</span>
              </div>
              <p className="font-display text-lg font-bold text-white leading-tight">Track Activity</p>
              <p className="text-[10px] text-blue-200/70 mt-0.5">Run · Walk · Cycle · Hike</p>
            </div>
            <div className="text-right">
              <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center ml-auto">
                <span className="text-xl">🏃</span>
              </div>
              <span className="text-[10px] text-blue-300 mt-1 block font-semibold">Start →</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Weight chart */}
      <div className="mx-5 mt-4 rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Weight trend</p>
            <p className="font-display text-2xl font-bold">{latestWeight} kg</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeColor}`}>
            {diffText}
          </span>
        </div>
        <div className="h-28">
          {weightHistory.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4 border border-dashed border-border/60 rounded-2xl bg-card/40">
              <p className="text-xs font-semibold text-muted-foreground">
                No weight data yet.
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Log your weight in Profile to start tracking your trend.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightHistory} margin={{ left: -20, right: 6, top: 6, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  tick={{ fill: "var(--color-muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "var(--color-primary)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Weekly calories */}
      <div className="mx-5 mt-4 mb-2 rounded-3xl border border-border bg-gradient-card p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">This week</p>
            <p className="font-display text-base font-semibold">Calories in vs out</p>
          </div>
          <Link to="/progress" className="text-xs font-semibold text-primary">
            View report
          </Link>
        </div>
        <div className="h-32">
          {calorieHistory.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center px-4 border border-dashed border-border/60 rounded-2xl bg-card/40">
              <p className="text-xs font-semibold text-muted-foreground">
                Chart building in progress...
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                Log your meals and workouts to generate your calorie graph.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calorieHistory} margin={{ left: -20, right: 6, top: 6, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  fontSize={10}
                  tick={{ fill: "var(--color-muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="eaten" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="burned" fill="var(--color-gold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-1 flex-nowrap overflow-hidden">
      <span className="flex items-center gap-1.5 text-primary-foreground/85 text-xs sm:text-sm whitespace-nowrap shrink-0">
        {icon}
        {label}
      </span>
      <span className="font-display font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 text-right">
        {value}
      </span>
    </div>
  );
}
