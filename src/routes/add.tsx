import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { FOODS, type Food } from "@/lib/mock-data";
import { useStore, type MealType } from "@/lib/store";
import { Search, Mic, Filter, Plus, BadgeCheck, X } from "lucide-react";

export const Route = createFileRoute("/add")({
  head: () => ({ meta: [{ title: "Add Food — PulsePeak" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ meal: (s.meal as MealType) || "Breakfast" }),
  component: AddFood,
});

function AddFood() {
  const { meal } = Route.useSearch();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [mealType, setMealType] = useState<MealType>(meal);
  const [filterCategory, setFilterCategory] = useState("All");
  const [showFilter, setShowFilter] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const results = useMemo(() => {
    return FOODS.filter((f) => {
      const matchesQ = (f.name + " " + (f.brand ?? "")).toLowerCase().includes(q.toLowerCase());
      if (!matchesQ) return false;
      if (filterCategory === "High Protein") return f.protein >= 20;
      if (filterCategory === "Low Calorie") return f.kcal <= 150;
      if (filterCategory === "Recipes") return f.brand === "Recipe";
      return true;
    });
  }, [q, filterCategory]);

  const handleVoiceSearch = () => {
    if (typeof window !== "undefined" && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in (window as any))) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setQ(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } else {
      alert("Voice search is not supported in this browser.");
    }
  };

  return (
    <PhoneShell>
      <ScreenHeader title="Add food" subtitle={`To ${mealType}`} />

      <div className="px-5">
        <div className="flex gap-2 items-center">
          <label className="flex flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search foods, brands..."
              className="w-full bg-transparent text-sm outline-none"
            />
            <button 
              type="button" 
              onClick={handleVoiceSearch}
              className={`p-1 rounded-full transition ${isListening ? "bg-destructive/20 text-destructive animate-pulse" : "text-muted-foreground hover:text-foreground"}`}
              title="Voice Search"
            >
              <Mic className="h-4 w-4" />
            </button>
          </label>

          <div className="relative">
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className={`flex h-12 items-center gap-1.5 rounded-2xl px-3.5 text-xs font-semibold shadow-sm transition ${filterCategory !== "All" ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`}
              title="Filter Foods"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">{filterCategory}</span>
            </button>
            {showFilter && (
              <div className="absolute right-0 top-14 z-30 w-40 rounded-2xl border border-border bg-card p-2 shadow-glow animate-in fade-in zoom-in-95">
                {["All", "High Protein", "Low Calorie", "Recipes"].map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setFilterCategory(cat); setShowFilter(false); }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${filterCategory === cat ? "bg-primary/15 text-primary font-bold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {(["Breakfast", "Lunch", "Dinner", "Snacks"] as MealType[]).map((m) => (
            <button
              key={m}
              onClick={() => setMealType(m)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition ${mealType === m ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"}`}
            >
              {m}
            </button>
          ))}
        </div>

        <ul className="mt-3 space-y-2">
          {results.map((f) => (
            <li key={f.id}>
              <button
                onClick={() => setSelected(f)}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left transition active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                    {f.name}
                    {f.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{f.brand ? `${f.brand} · ` : ""}{f.serving} · P{f.protein} C{f.carbs} F{f.fats}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-bold">{f.kcal}</p>
                  <p className="text-[10px] text-muted-foreground">kcal</p>
                </div>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <div className="mt-10 text-center text-sm text-muted-foreground">
              No matches. <span className="font-semibold text-primary">Create custom food</span>
            </div>
          )}
        </ul>
      </div>

      {selected && <AddSheet food={selected} meal={mealType} onClose={() => setSelected(null)} />}
    </PhoneShell>
  );
}

function AddSheet({ food, meal, onClose }: { food: Food; meal: MealType; onClose: () => void }) {
  const [servings, setServings] = useState(1);
  const { addMeal } = useStore();
  const nav = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-glow">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-lg font-bold">{food.name}</p>
            <p className="text-xs text-muted-foreground">{food.brand ?? "Generic"} · {food.serving}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { l: "kcal", v: Math.round(food.kcal * servings), c: "var(--color-primary)" },
            { l: "P", v: (food.protein * servings).toFixed(1), c: "var(--color-protein)" },
            { l: "C", v: (food.carbs * servings).toFixed(1), c: "var(--color-carbs)" },
            { l: "F", v: (food.fats * servings).toFixed(1), c: "var(--color-fats)" },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-muted p-2">
              <p className="font-display text-base font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[10px] uppercase text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-border px-4 py-3">
          <span className="text-sm text-muted-foreground">Servings</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setServings(Math.max(0.5, +(servings - 0.5).toFixed(1)))} className="grid h-8 w-8 place-items-center rounded-full bg-muted text-lg font-semibold">−</button>
            <span className="w-10 text-center font-display text-lg font-bold">{servings}</span>
            <button onClick={() => setServings(+(servings + 0.5).toFixed(1))} className="grid h-8 w-8 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">+</button>
          </div>
        </div>
        <button
          onClick={() => { addMeal(meal, food, servings); onClose(); nav({ to: "/diary" }); }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-hero py-4 font-display font-semibold text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" /> Add to {meal}
        </button>
      </div>
    </div>
  );
}
