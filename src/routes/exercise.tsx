import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { useStore } from "@/lib/store";
import { 
  Search, X, Info, ChevronRight, Dumbbell
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exercise")({
  head: () => ({ meta: [{ title: "Ai Gym Exercises — PulsePeak" }] }),
  component: ExercisePage,
});

interface ExerciseItem {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  instructions: {
    en: string;
    tr?: string;
  };
  instruction_steps?: {
    en: string[];
    tr?: string[];
  };
  muscle_group: string;
  secondary_muscles?: string[];
  target: string;
  image: string;
  gif_url: string;
}

function ExercisePage() {
  const { state, addExercise } = useStore();
  
  // Exercise database states
  const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(12);

  // Selected exercise for Logging/Detail Modal
  const [selected, setSelected] = useState<ExerciseItem | null>(null);
  const [mins, setMins] = useState(30);
  const [imgSrc, setImgSrc] = useState("");

  // Fetch exercises list from public folder
  useEffect(() => {
    fetch("/exercises/data/exercises.json")
      .then((res) => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then((data) => {
        setAllExercises(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load local exercise dataset, loading fallbacks.", err);
        // Small subset fallback
        setAllExercises([
          {
            id: "0001",
            name: "3/4 sit-up",
            category: "waist",
            body_part: "waist",
            equipment: "body weight",
            instructions: { en: "Lie flat on your back with your knees bent and feet flat on the ground. Lift your torso up to a 45-degree angle. Pause, then lower." },
            instruction_steps: { en: ["Lie flat on your back with your knees bent.", "Lift torso to a 45-degree angle.", "Pause, then slowly lower."] },
            muscle_group: "abs",
            target: "abs",
            image: "images/0001-2gPfomN.jpg",
            gif_url: "videos/0001-2gPfomN.gif"
          },
          {
            id: "0025",
            name: "barbell bench press",
            category: "chest",
            body_part: "chest",
            equipment: "barbell",
            instructions: { en: "Lying flat on a bench, press the barbell up from your chest until your arms are locked." },
            instruction_steps: { en: ["Lie on the bench flat.", "Unrack the barbell.", "Lower the bar to your chest.", "Push back up explosively."] },
            muscle_group: "pectorals",
            target: "pectorals",
            image: "images/0025-EIeI8Vf.jpg",
            gif_url: "videos/0025-EIeI8Vf.gif"
          },
          {
            id: "0032",
            name: "barbell deadlift",
            category: "upper legs",
            body_part: "upper legs",
            equipment: "barbell",
            instructions: { en: "Lift a loaded barbell off the ground to hip level, keeping your back straight and core braced." },
            instruction_steps: { en: ["Position feet under bar.", "Hinge hips and grip bar.", "Drive legs down and lift bar to hips.", "Lower under control."] },
            muscle_group: "glutes",
            target: "glutes",
            image: "images/0032-ila4NZS.jpg",
            gif_url: "videos/0032-ila4NZS.gif"
          },
          {
            id: "0294",
            name: "dumbbell biceps curl",
            category: "upper arms",
            body_part: "upper arms",
            equipment: "dumbbell",
            instructions: { en: "Stand holding dumbbells at your sides. Curl dumbbells up towards shoulders, supinating wrists." },
            instruction_steps: { en: ["Stand with elbows tucked.", "Curl dumbbells up.", "Squeeze biceps at the top.", "Lower slowly."] },
            muscle_group: "biceps",
            target: "biceps",
            image: "images/0294-NbVPDMW.jpg",
            gif_url: "videos/0294-NbVPDMW.gif"
          }
        ]);
        setLoading(false);
      });
  }, []);

  // Set modal image source
  useEffect(() => {
    if (selected) {
      setImgSrc(`/exercises/${selected.gif_url}`);
    }
  }, [selected]);

  // Helpers to map category to emoji icons & MET/kcal
  const getExerciseIcon = (category: string, name: string): string => {
    const cat = category.toLowerCase();
    const n = name.toLowerCase();
    if (n.includes("walk")) return "🚶";
    if (n.includes("run") || n.includes("sprint")) return "🏃";
    if (n.includes("cycl") || n.includes("bike")) return "🚴";
    if (n.includes("swim")) return "🏊";
    if (n.includes("jump") || n.includes("skip")) return "🦘";
    if (n.includes("stretch") || n.includes("yoga")) return "🧘";
    if (cat.includes("cardio")) return "🏃";
    if (cat.includes("arm")) return "💪";
    if (cat.includes("leg")) return "🦵";
    if (cat.includes("chest")) return "🦍";
    if (cat.includes("back")) return "🧍";
    if (cat.includes("shoulder")) return "🎽";
    if (cat.includes("waist") || cat.includes("abs")) return "🤸";
    return "🏋️";
  };

  const getExerciseKcalPerMin = (category: string): number => {
    const cat = category.toLowerCase();
    if (cat.includes("cardio")) return 11;
    if (cat.includes("chest")) return 7;
    if (cat.includes("back")) return 7;
    if (cat.includes("leg")) return 8;
    if (cat.includes("arm")) return 6;
    if (cat.includes("shoulder")) return 6;
    if (cat.includes("waist")) return 5;
    return 5;
  };

  // Filter Exercises Database list
  const categoryOptions = [
    "All", "Waist", "Upper Arms", "Upper Legs", "Back", "Chest", "Shoulders", "Lower Legs", "Cardio"
  ];

  const filteredExercises = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ex.target.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ex.equipment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || 
                            ex.category.toLowerCase() === selectedCategory.toLowerCase() ||
                            ex.body_part.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <PhoneShell>
      <ScreenHeader title="Ai Gym Exercises" subtitle="Search and learn professional exercises" />

      {/* Professional Exercise Database Browser */}
      <div className="mx-5 mt-4 pb-28">
        {/* Search Bar */}
        <div className="relative mb-3 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search exercises, equipment, muscles..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(12); // reset page count
            }}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-border bg-card text-xs focus:border-primary focus:outline-none transition shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3.5 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Pills Scroller */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none -mx-5 px-5">
          {categoryOptions.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setVisibleCount(12); // reset page count
              }}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold border transition active:scale-95 ${
                selectedCategory === cat 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-card border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading exercise database...
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/45 py-8 text-center text-xs text-muted-foreground">
            No matching exercises found. Try adjusting filters.
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            {filteredExercises.slice(0, visibleCount).map((ex) => {
              const icon = getExerciseIcon(ex.category, ex.name);
              return (
                <div 
                  key={ex.id}
                  onClick={() => setSelected(ex)}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm hover:border-primary/30 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-muted text-lg shadow-inner group-hover:scale-105 transition-transform">
                      {icon}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground capitalize group-hover:text-primary transition-colors">{ex.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">
                        {ex.equipment} · <span className="text-primary font-medium">{ex.target}</span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition" />
                </div>
              );
            })}

            {/* Load More Button */}
            {filteredExercises.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="w-full py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground transition active:scale-95"
              >
                Load More Exercises ({filteredExercises.length - visibleCount} remaining)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Slide-Up Exercise Detail & Log Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm p-0 sm:p-4" onClick={() => setSelected(null)}>
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border/80 shadow-glow p-5 flex flex-col max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250"
          >
            {/* Grabber bar on mobile */}
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted block sm:hidden" />
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-primary font-bold bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-md">
                  {selected.category}
                </span>
                <p className="font-display text-lg font-extrabold mt-1.5 capitalize text-foreground">{selected.name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-xl border border-border bg-muted/30 p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Exercise Animation / Static Preview Frame */}
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted flex items-center justify-center relative group">
              {imgSrc ? (
                <img 
                  src={imgSrc} 
                  alt={selected.name} 
                  onError={() => {
                    if (imgSrc !== `/exercises/${selected.image}`) {
                      setImgSrc(`/exercises/${selected.image}`);
                    }
                  }}
                  className="h-full w-full object-cover" 
                />
              ) : (
                <Dumbbell className="h-10 w-10 text-muted-foreground animate-bounce" />
              )}
            </div>

            <div className="mt-4 space-y-3">
              {/* Muscle info tags */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-border bg-card py-2 px-1">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Target</p>
                  <p className="text-xs font-bold text-foreground capitalize mt-0.5 truncate">{selected.target}</p>
                </div>
                <div className="rounded-xl border border-border bg-card py-2 px-1">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Equipment</p>
                  <p className="text-xs font-bold text-foreground capitalize mt-0.5 truncate">{selected.equipment}</p>
                </div>
                <div className="rounded-xl border border-border bg-card py-2 px-1">
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Cal Burn</p>
                  <p className="text-xs font-bold text-primary mt-0.5 truncate">~{getExerciseKcalPerMin(selected.category)}/m</p>
                </div>
              </div>

              {/* Instructions steps */}
              <div>
                <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span>How to perform:</span>
                </p>
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                  {(selected.instruction_steps?.en || [selected.instructions.en]).map((step, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-bold text-primary min-w-[15px]">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slider for logging */}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Duration</span>
                  <span className="font-display text-xl font-bold">
                    {mins} <span className="text-xs font-medium text-muted-foreground">min · {Math.round(getExerciseKcalPerMin(selected.category) * mins)} kcal</span>
                  </span>
                </div>
                <input 
                  type="range" 
                  min={5} 
                  max={120} 
                  step={5}
                  value={mins} 
                  onChange={(e) => setMins(+e.target.value)} 
                  className="w-full accent-[oklch(0.42_0.09_165)] h-1.5 bg-muted rounded-lg appearance-none cursor-pointer" 
                />
              </div>
            </div>

            <button
              onClick={() => {
                const kcalRate = getExerciseKcalPerMin(selected.category);
                addExercise({
                  id: selected.id,
                  name: selected.name,
                  kcalPerMin: kcalRate,
                  icon: getExerciseIcon(selected.category, selected.name),
                  category: selected.category,
                  target: selected.target,
                  body_part: selected.body_part,
                  equipment: selected.equipment,
                  instructions: selected.instructions
                } as any, mins);
                
                toast.success(`Successfully logged ${mins} min of ${selected.name}!`);
                setSelected(null);
              }}
              className="w-full mt-4 rounded-2xl bg-gradient-hero py-3.5 font-display font-bold text-xs text-primary-foreground shadow-glow active:scale-95 transition"
            >
              Log Workout
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
