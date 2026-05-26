import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { useStore, useTotals, type MealType } from "@/lib/store";
import { ChevronRight, Plus, Trash2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/diary")({
  head: () => ({ meta: [{ title: "Food Diary — PulsePeak" }] }),
  component: Diary,
});

const MEALS: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];
const ICONS: Record<MealType, string> = {
  Breakfast: "🥣",
  Lunch: "🥗",
  Dinner: "🍽️",
  Snacks: "🍎",
};

function Diary() {
  const { state, removeMeal } = useStore();
  const totals = useTotals();
  const { profile } = state;

  return (
    <PhoneShell>
      <ScreenHeader title="Food Diary" subtitle="Today" />

      <div className="mx-5 rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-glow">
        <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Daily total</p>
        <div className="mt-1 flex items-baseline gap-1 flex-nowrap overflow-hidden whitespace-nowrap">
          <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            {totals.eaten.kcal}
          </span>
          <span className="text-xs sm:text-sm font-medium text-primary-foreground/80">
            / {state.profile.calorieGoal} kcal
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
          <Mini label="Protein" v={totals.eaten.protein} />
          <Mini label="Carbs" v={totals.eaten.carbs} />
          <Mini label="Fats" v={totals.eaten.fats} />
        </div>
      </div>

      <div className="mt-4 space-y-3 px-5 pb-20">
        {MEALS.map((meal) => {
          const items = state.meals.filter((m) => m.meal === meal);
          const kcal = items.reduce((a, m) => a + m.food.kcal * m.servings, 0);
          return (
            <section
              key={meal}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-card"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-muted text-xl">
                    {ICONS[meal]}
                  </span>
                  <div>
                    <p className="font-display font-semibold">{meal}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(kcal)} kcal</p>
                  </div>
                </div>
                <Link
                  to="/add"
                  search={{ meal } as never}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"
                >
                  <Plus className="h-4 w-4" />
                </Link>
              </div>
              {items.length > 0 && (
                <ul className="divide-y divide-border border-t border-border">
                  {items.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.food.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.servings} × {m.food.serving} · {Math.round(m.food.kcal * m.servings)}{" "}
                          kcal
                        </p>
                      </div>
                      <button
                        onClick={() => removeMeal(m.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        {/* AI Personalized Strategy placed directly under Snacks */}
        {profile?.aiPlan && (
          <div className="mt-4 rounded-3xl border border-gold/30 bg-gradient-card p-5 shadow-glow relative overflow-hidden animate-in fade-in duration-500">
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl" />
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-gradient-gold text-gold-foreground shadow-glow">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="font-display text-base font-bold bg-gradient-to-r from-gold to-primary font-semibold bg-clip-text text-transparent">
                AI Personalized Strategy
              </h2>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-4 font-medium">
              {profile.aiPlan.summary}
            </p>

            <div className="space-y-3 border-t border-border/60 pt-4 mt-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-1">
                  Nutrition Strategy ({profile.diet || "Omnivore"})
                </p>
                <p className="text-xs text-muted-foreground leading-normal">
                  {profile.aiPlan.nutritionStrategy}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gold font-semibold mb-1">
                  Workout Recommendation ({profile.workoutType || "Strength training"})
                </p>
                <p className="text-xs text-muted-foreground leading-normal">
                  {profile.aiPlan.workoutRecommendation}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border/60">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Daily Milestones
              </p>
              <div className="grid grid-cols-1 gap-2">
                {profile.aiPlan.dailyMilestones?.map((milestone: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 text-xs bg-muted/40 border border-border/60 rounded-xl p-2.5 backdrop-blur-sm"
                  >
                    <div className="h-4 w-4 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </div>
                    <span className="text-foreground font-medium">{milestone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}

function Mini({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2 backdrop-blur">
      <p className="text-[10px] uppercase tracking-widest text-primary-foreground/70">{label}</p>
      <p className="mt-0.5 font-display text-base font-semibold">{Math.round(v)}g</p>
    </div>
  );
}
