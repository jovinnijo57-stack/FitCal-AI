import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { useStore } from "@/lib/store";
import { 
  Search, X, Info, ChevronRight, Dumbbell, Play, Pause, RotateCcw, 
  Volume2, VolumeX, Mic, MicOff, Check, Heart, Trophy, ShieldAlert 
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exercise")({
  head: () => ({ meta: [{ title: "Ai Gym Exercises & Library — PulsePeak" }] }),
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
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [visibleCount, setVisibleCount] = useState(12);

  // Voice recognition search state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Selected exercise for Logging/Detail Modal
  const [selected, setSelected] = useState<ExerciseItem | null>(null);
  const [mins, setMins] = useState(30);
  const [imgSrc, setImgSrc] = useState("");
  const [imageError, setImageError] = useState(false);

  // Audio Coach state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Workout Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const timerIntervalRef = useRef<any>(null);

  // Initialize SpeechSynthesis and SpeechRecognition APIs
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onerror = () => setIsListening(false);
        rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setSearchQuery(transcript);
          setVisibleCount(12);
          toast.success(`Voice search: "${transcript}"`);
        };
        recognitionRef.current = rec;
      }
    }
  }, []);

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

  // Set modal image source and reset states
  useEffect(() => {
    if (selected) {
      setImgSrc(`/exercises/${selected.gif_url}`);
      setImageError(false);
      setTimeElapsed(0);
      setTimerRunning(false);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setIsSpeaking(false);
    }
  }, [selected]);

  // Clean up timer and voice synth on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (synthRef.current) synthRef.current.cancel();
    };
  }, []);

  // Handle stopwatch / live workout timer logic
  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => {
          const next = prev + 1;
          // Sync with the minutes log value if elapsed time completes a full minute
          if (next % 60 === 0) {
            setMins(Math.ceil(next / 60));
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerRunning]);

  // Text-To-Speech Audio Coach
  const toggleAudioCoach = () => {
    if (!synthRef.current || !selected) {
      toast.error("Audio coach is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      toast.info("Audio coach paused.");
    } else {
      const steps = selected.instruction_steps?.en || [selected.instructions.en];
      const textToSpeak = `Starting coach for ${selected.name}. ${steps.join(". ")}. Let's do it!`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
      setIsSpeaking(true);
      toast.success("Audio coach started! 🎙️");
    }
  };

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported on this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Format stopwatch elapsed time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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
    if (cat.includes("arm") || cat.includes("biceps") || cat.includes("triceps")) return "💪";
    if (cat.includes("leg") || cat.includes("thigh")) return "🦵";
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

  // Category and Equipment Filters list
  const categoryOptions = [
    "All", "Waist", "Upper Arms", "Upper Legs", "Back", "Chest", "Shoulders", "Lower Legs", "Cardio"
  ];

  const equipmentOptions = [
    "All", "Body weight", "Barbell", "Dumbbell", "Cable", "Band", "Kettlebell", "Machine"
  ];

  // Filter Exercises Database list
  const filteredExercises = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ex.target.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ex.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.muscle_group.toLowerCase().includes(searchQuery.toLowerCase());
                          
    const matchesCategory = selectedCategory === "All" || 
                            ex.category.toLowerCase() === selectedCategory.toLowerCase() ||
                            ex.body_part.toLowerCase() === selectedCategory.toLowerCase();

    const matchesEquipment = selectedEquipment === "All" || 
                             ex.equipment.toLowerCase().includes(selectedEquipment.toLowerCase());
                             
    return matchesSearch && matchesCategory && matchesEquipment;
  });

  return (
    <PhoneShell>
      <ScreenHeader title="Ai Gym Exercises" subtitle="1,300+ professional animations & videos" />

      {/* Main Database Content Grid */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-28">
        
        {/* Voice & Keyboard Search Bar */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search exercise, muscles, target..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(12); // reset page count
              }}
              className="w-full pl-10 pr-10 py-3 rounded-2xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none transition shadow-sm text-foreground"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleVoiceSearch}
            className={`p-3 rounded-2xl border transition active:scale-95 ${
              isListening 
                ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" 
                : "bg-card border-border hover:bg-muted text-muted-foreground"
            }`}
            title="Voice Search"
          >
            {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Category Selector Pills */}
        <div className="mt-4 space-y-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Muscle Group</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 mt-1 scrollbar-none">
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setVisibleCount(12);
                  }}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold border transition active:scale-95 ${
                    selectedCategory === cat 
                      ? "bg-[#007000] text-white border-[#007000]" 
                      : "bg-card border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Selector Pills */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Equipment Type</span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 mt-1 scrollbar-none">
              {equipmentOptions.map((eq) => (
                <button
                  key={eq}
                  onClick={() => {
                    setSelectedEquipment(eq);
                    setVisibleCount(12);
                  }}
                  className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold border transition active:scale-95 ${
                    selectedEquipment === eq 
                      ? "bg-[#007000] text-white border-[#007000]" 
                      : "bg-card border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid Lists of Workouts */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Exercise Catalog
            </h3>
            <span className="text-[10px] bg-muted/80 text-muted-foreground px-2.5 py-0.5 rounded-full font-bold border border-border/50">
              {filteredExercises.length} Found
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground animate-pulse">
              Loading exercise database...
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center text-xs text-muted-foreground">
              No matching exercises found. Try refining search query or pills.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredExercises.slice(0, visibleCount).map((ex) => {
                const icon = getExerciseIcon(ex.category, ex.name);
                return (
                  <div 
                    key={ex.id}
                    onClick={() => setSelected(ex)}
                    className="flex items-center justify-between rounded-2xl border border-border bg-gradient-card p-3.5 shadow-sm hover:border-[#007000]/40 transition duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="grid h-12 w-12 place-items-center rounded-xl bg-muted/70 text-xl shadow-inner group-hover:scale-105 transition-transform border border-border/30">
                        {icon}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-foreground capitalize group-hover:text-[#007000] transition-colors line-clamp-1">
                          {ex.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-bold">
                            {ex.equipment}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider bg-[#007000]/10 text-[#007000] px-2 py-0.5 rounded-md font-bold">
                            {ex.target}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">View Demo</span>
                      <ChevronRight className="h-4.5 w-4.5 text-muted-foreground/60 group-hover:text-[#007000] group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })}

              {/* Load More Pagination */}
              {filteredExercises.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  className="w-full mt-2 py-3 rounded-2xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground transition active:scale-95 bg-card/50"
                >
                  Load More Workouts ({filteredExercises.length - visibleCount} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Slide-Up Exercise Detail & Log Modal with Video Demonstration */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/45 backdrop-blur-sm p-0 sm:p-4" onClick={() => setSelected(null)}>
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border/80 shadow-glow p-5 flex flex-col max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted block sm:hidden" />
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#007000] font-bold bg-[#007000]/10 border border-[#007000]/20 px-2.5 py-0.5 rounded-md">
                  {selected.category}
                </span>
                <p className="font-display text-lg font-extrabold mt-1.5 capitalize text-foreground">{selected.name}</p>
              </div>
              <button 
                onClick={() => setSelected(null)} 
                className="rounded-xl border border-border bg-muted/40 p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Workout GIF Demonstration Video Frame */}
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted/80 flex items-center justify-center relative shadow-inner">
              {!imageError ? (
                <img 
                  src={imgSrc} 
                  alt={selected.name} 
                  onError={() => {
                    // Try fallback to JPG image if GIF fails to load
                    if (imgSrc !== `/exercises/${selected.image}`) {
                      setImgSrc(`/exercises/${selected.image}`);
                    } else {
                      setImageError(true);
                    }
                  }}
                  className="h-full w-full object-cover" 
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground p-4">
                  <ShieldAlert className="h-8 w-8 text-amber-500" />
                  <p className="text-[11px] font-semibold text-center">Video demonstration offline or not found</p>
                </div>
              )}
              
              {/* Overlay Badges */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <Play className="h-2.5 w-2.5 fill-white" />
                <span>Video Demo</span>
              </div>
            </div>

            {/* Muscle Targeted Tags */}
            <div className="grid grid-cols-3 gap-2 text-center mt-4">
              <div className="rounded-xl border border-border bg-muted/30 py-2 px-1">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Target Muscle</p>
                <p className="text-xs font-bold text-foreground capitalize mt-0.5 truncate">{selected.target}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 py-2 px-1">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Equipment</p>
                <p className="text-xs font-bold text-foreground capitalize mt-0.5 truncate">{selected.equipment}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 py-2 px-1">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Burn Rate</p>
                <p className="text-xs font-bold text-[#007000] mt-0.5 truncate">~{getExerciseKcalPerMin(selected.category)}/min</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              
              {/* Audio Coach control & Instructions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-[#007000]" />
                    <span>Instruction Steps:</span>
                  </p>
                  <button
                    onClick={toggleAudioCoach}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition duration-200 ${
                      isSpeaking
                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                        : "bg-[#007000]/10 border-[#007000]/20 text-[#007000]"
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    <span>{isSpeaking ? "Pause Coach" : "Audio Coach"}</span>
                  </button>
                </div>
                <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 border border-border/50 rounded-xl p-3 bg-muted/30">
                  {(selected.instruction_steps?.en || [selected.instructions.en]).map((step, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-bold text-[#007000] min-w-[15px]">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stopwatch & Timer Live Widget */}
              <div className="rounded-2xl border border-border bg-card p-3 shadow-inner">
                <div className="flex justify-between items-center mb-2 border-b border-border pb-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Live Active Stopwatch</span>
                  {timerRunning && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-display text-2xl font-black text-foreground tracking-tight">
                      {formatTime(timeElapsed)}
                    </span>
                    <span className="text-[9px] text-muted-foreground">Elapsed workout time</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className={`p-2.5 rounded-xl border transition active:scale-95 ${
                        timerRunning 
                          ? "bg-amber-500/15 border-amber-500/20 text-amber-500" 
                          : "bg-[#007000] text-white border-[#007000]"
                      }`}
                    >
                      {timerRunning ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 fill-white" />}
                    </button>
                    <button
                      onClick={() => {
                        setTimerRunning(false);
                        setTimeElapsed(0);
                      }}
                      className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground transition active:scale-95"
                    >
                      <RotateCcw className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Slider for logging */}
              <div className="pt-2 border-t border-border/50">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Duration Selector</span>
                  <span className="font-display text-base font-extrabold">
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
                  className="w-full accent-[#007000] h-1.5 bg-muted rounded-lg appearance-none cursor-pointer" 
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
                
                toast.success(`Successfully logged ${mins} min of ${selected.name}! 🏋️`);
                setSelected(null);
              }}
              className="w-full mt-4 rounded-2xl bg-gradient-hero py-3.5 font-display font-bold text-xs text-white shadow-glow active:scale-95 transition"
            >
              Log Workout Progress
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
