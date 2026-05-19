import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { EXERCISES } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { Trash2, Flame, Clock, Footprints, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exercise")({
  head: () => ({ meta: [{ title: "Workouts — PulsePeak" }] }),
  component: ExercisePage,
});

function ExercisePage() {
  const { state, addExercise, removeExercise } = useStore();
  const [selected, setSelected] = useState<typeof EXERCISES[number] | null>(null);
  const [mins, setMins] = useState(30);

  // AI workout planner state
  const [generating, setGenerating] = useState(false);
  const [aiWorkout, setAiWorkout] = useState<any>(null);

  const handleGenerateWorkout = async () => {
    setGenerating(true);
    setAiWorkout(null);
    
    const userGoal = state.profile.goal || "lose";
    const userWeight = state.profile.weightKg || 70;
    
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      // Local fallback routine based on goal
      await new Promise(r => setTimeout(r, 1000));
      if (userGoal === "lose" || userGoal === "cut") {
        setAiWorkout({
          title: "HIIT & Fat Burn Routine",
          duration: "35 mins",
          difficulty: "Intermediate",
          exercises: [
            { name: "Jumping Jacks", specs: "3 sets x 45 secs" },
            { name: "Bodyweight Squats", specs: "4 sets x 20 reps" },
            { name: "Mountain Climbers", specs: "3 sets x 30 secs" },
            { name: "Burpees", specs: "3 sets x 12 reps" },
            { name: "Plank Hold", specs: "3 sets x 60 secs" }
          ]
        });
      } else {
        setAiWorkout({
          title: "Hypertrophy Power Build Routine",
          duration: "45 mins",
          difficulty: "Intermediate-Advanced",
          exercises: [
            { name: "Push-ups (Weighted if possible)", specs: "4 sets x 15 reps" },
            { name: "Bodyweight Lunges", specs: "4 sets x 12 reps per leg" },
            { name: "Glute Bridges", specs: "3 sets x 20 reps" },
            { name: "Pike Push-ups", specs: "3 sets x 10 reps" },
            { name: "Plank to Push-up", specs: "3 sets x 12 reps" }
          ]
        });
      }
      setGenerating(false);
      toast.info("Using smart local fallback (No Gemini API key configured)");
      return;
    }

    try {
      const prompt = `You are an elite AI personal trainer.
Generate a personalized home/gym workout routine based on these user parameters:
- Goal: ${userGoal}
- Weight: ${userWeight} kg

Return ONLY a valid JSON object with the following keys:
"title" (string, e.g. "Fat Burning Core HIIT"),
"duration" (string, e.g. "30 mins"),
"difficulty" (string, e.g. "Beginner"),
"exercises" (an array of objects, each with "name" and "specs" keys).`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setAiWorkout(JSON.parse(text.trim()));
        toast.success("Successfully generated customized AI workout plan!");
      } else {
        throw new Error("Empty response");
      }
    } catch (e) {
      console.error(e);
      setAiWorkout({
        title: "Daily Active Booster Routine",
        duration: "30 mins",
        difficulty: "All Levels",
        exercises: [
          { name: "Warm-up Stretch", specs: "5 mins" },
          { name: "Squats", specs: "3 sets x 15 reps" },
          { name: "Push-ups", specs: "3 sets x 12 reps" },
          { name: "Plank", specs: "3 sets x 45 secs" }
        ]
      });
      toast.error("AI call failed. Displaying standard routine.");
    } finally {
      setGenerating(false);
    }
  };

  const totalBurned = state.exercises.reduce((a, e) => a + e.kcal, 0);

  return (
    <PhoneShell>
      <ScreenHeader title="Workouts" subtitle="Move daily, win weekly." />

      <div className="mx-5 grid grid-cols-3 gap-3">
        <Stat icon={<Flame className="h-4 w-4" />} label="Burned" value={`${totalBurned}`} sub="kcal" />
        <Stat icon={<Clock className="h-4 w-4" />} label="Active" value={`${state.exercises.reduce((a, e) => a + e.minutes, 0)}`} sub="min" />
        <Stat icon={<Footprints className="h-4 w-4" />} label="Steps" value="8,420" sub="today" />
      </div>

      <div className="mx-5 mt-5">
        <h2 className="mb-2 font-display text-base font-semibold">Quick add</h2>
        <div className="grid grid-cols-4 gap-2">
          {EXERCISES.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelected(e)}
              className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-card p-3 text-center transition active:scale-95"
            >
              <span className="text-xl">{e.icon}</span>
              <span className="text-[10px] font-medium leading-tight">{e.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-5 mt-6">
        <h2 className="mb-2 font-display text-base font-semibold">Today's log</h2>
        <ul className="space-y-2">
          {state.exercises.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-lg">{e.exercise.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{e.exercise.name}</p>
                  <p className="text-xs text-muted-foreground">{e.minutes} min · {e.kcal} kcal</p>
                </div>
              </div>
              <button onClick={() => removeExercise(e.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
          {state.exercises.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-card py-8 text-center text-sm text-muted-foreground">No workouts yet today.</p>
          )}
        </ul>
      </div>

      {/* AI Gym Workout Planner */}
      <div className="mx-5 mt-6 pb-24">
        <div className="rounded-3xl border border-border bg-gradient-card p-5 shadow-card relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="font-display text-base font-semibold">AI Gym Workout Planner</h2>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Goal: {state.profile.goal || "Lose weight"}</span>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Generate a custom, goal-optimized training routine using our advanced fitness intelligence.
          </p>

          {!aiWorkout ? (
            <button
              onClick={handleGenerateWorkout}
              disabled={generating}
              className="w-full py-3.5 rounded-2xl bg-gradient-gold text-gold-foreground font-display font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Generating Workout Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Custom Routine
                </>
              )}
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-3 bg-card/60 border border-border/80 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-bold text-foreground">{aiWorkout.title}</h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">{aiWorkout.difficulty}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Estimated Duration: {aiWorkout.duration}</p>
                
                <div className="mt-3 space-y-2">
                  {aiWorkout.exercises.map((ex: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-border/30 last:border-0">
                      <span className="font-medium text-foreground">{idx + 1}. {ex.name}</span>
                      <span className="text-muted-foreground font-semibold text-[11px]">{ex.specs}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGenerateWorkout}
                  disabled={generating}
                  className="flex-1 py-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-muted font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 transition"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => {
                    setAiWorkout(null);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold text-xs active:scale-95 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="mx-auto w-full max-w-md rounded-t-3xl bg-card p-5 shadow-glow">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
            <p className="font-display text-lg font-bold">{selected.icon} {selected.name}</p>
            <p className="text-xs text-muted-foreground">~{selected.kcalPerMin} kcal/min</p>
            <div className="my-5">
              <input type="range" min={5} max={120} value={mins} onChange={(e) => setMins(+e.target.value)} className="w-full accent-[oklch(0.42_0.09_165)]" />
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-display text-2xl font-bold">{mins} <span className="text-sm font-medium text-muted-foreground">min · {Math.round(selected.kcalPerMin * mins)} kcal</span></span>
              </div>
            </div>
            <button
              onClick={() => { addExercise(selected, mins); setSelected(null); }}
              className="w-full rounded-2xl bg-gradient-hero py-4 font-display font-semibold text-primary-foreground shadow-glow"
            >
              Log workout
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-3 shadow-card">
      <div className="flex items-center gap-1.5 text-muted-foreground">{icon}<span className="text-[10px] uppercase tracking-widest">{label}</span></div>
      <p className="mt-1 font-display text-xl font-bold">{value}<span className="ml-0.5 text-xs font-medium text-muted-foreground">{sub}</span></p>
    </div>
  );
}
