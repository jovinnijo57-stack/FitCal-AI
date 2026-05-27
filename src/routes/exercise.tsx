import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useStore } from "@/lib/store";
import {
  Search,
  X,
  Info,
  ChevronRight,
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Check,
  ShieldAlert,
  Sparkles,
  SlidersHorizontal,
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

// Dedicated premium Exercise Card component matching exercises/index.html hover effects
interface ExerciseCardProps {
  ex: ExerciseItem;
  onClick: () => void;
  getIcon: (category: string, name: string) => string;
}

function ExerciseCard({ ex, onClick, getIcon }: ExerciseCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const thumbUrl = `/exercises/${ex.image}`;
  const gifUrl = `/exercises/${ex.gif_url}`;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative bg-zinc-900/60 border border-zinc-800/80 hover:border-volt rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-md hover:-translate-y-1 hover:shadow-volt/10 flex flex-col h-full"
    >
      {/* Aspect Ratio 3:4 Media Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950/80">
        <img
          src={thumbUrl}
          alt={ex.name}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${
            isHovered ? "opacity-0 scale-105" : "opacity-100 scale-100"
          }`}
        />
        {isHovered && (
          <img
            src={gifUrl}
            alt={ex.name}
            className="absolute inset-0 w-full h-full object-cover animate-fade-in"
          />
        )}

        {/* Tiny Premium Floating Category Badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[8px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-800">
          {ex.category}
        </div>

        {/* Emoji Icon Floating Indicator */}
        <div className="absolute bottom-2.5 right-2.5 bg-zinc-900/85 backdrop-blur-md h-7 w-7 rounded-lg flex items-center justify-center text-sm shadow-md border border-zinc-800">
          {getIcon(ex.category, ex.name)}
        </div>
      </div>

      {/* Card Info Details */}
      <div className="p-3.5 flex-grow flex flex-col justify-between space-y-2">
        <h4 className="text-[11px] font-black text-zinc-200 uppercase tracking-wide line-clamp-2 leading-tight group-hover:text-volt transition-colors">
          {ex.name}
        </h4>

        <div className="flex flex-wrap gap-1">
          <span className="text-[8px] font-extrabold uppercase tracking-wide bg-zinc-950 border border-zinc-850 text-zinc-400 px-1.5 py-0.5 rounded-md">
            {ex.equipment}
          </span>
          <span className="text-[8px] font-extrabold uppercase tracking-wide bg-volt/10 text-volt px-1.5 py-0.5 rounded-md">
            {ex.target}
          </span>
        </div>
      </div>
    </div>
  );
}

function ExercisePage() {
  const { state, addExercise } = useStore();

  // Exercise database states
  const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [selectedTarget, setSelectedTarget] = useState("All");
  const [visibleCount, setVisibleCount] = useState(12);

  // Advanced Filter Drawer State
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Voice recognition search state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Selected exercise for Logging/Detail Modal
  const [selected, setSelected] = useState<ExerciseItem | null>(null);
  const [mediaTab, setMediaTab] = useState<"youtube" | "gif">("youtube");
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

  // Lists for bottom slide-up filter panels
  const uniqueEquipments = [
    "All",
    "body weight",
    "dumbbell",
    "barbell",
    "cable",
    "leverage machine",
    "band",
    "smith machine",
    "kettlebell",
    "stability ball",
    "ez barbell",
  ];

  const uniqueTargets = [
    "All",
    "abs",
    "pectorals",
    "glutes",
    "biceps",
    "lats",
    "delts",
    "hamstrings",
    "quadriceps",
    "triceps",
    "calves",
    "forearms",
    "cardiovascular system",
  ];

  // Initialize SpeechSynthesis and SpeechRecognition APIs
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
        // Fallback subset
        setAllExercises([
          {
            id: "0001",
            name: "3/4 sit-up",
            category: "waist",
            body_part: "waist",
            equipment: "body weight",
            instructions: {
              en: "Lie flat on your back with your knees bent and feet flat on the ground. Lift your torso up to a 45-degree angle. Pause, then lower.",
            },
            instruction_steps: {
              en: [
                "Lie flat on your back with your knees bent.",
                "Lift torso to a 45-degree angle.",
                "Pause, then slowly lower.",
              ],
            },
            muscle_group: "abs",
            target: "abs",
            image: "images/0001-2gPfomN.jpg",
            gif_url: "videos/0001-2gPfomN.gif",
          },
          {
            id: "0025",
            name: "barbell bench press",
            category: "chest",
            body_part: "chest",
            equipment: "barbell",
            instructions: {
              en: "Lying flat on a bench, press the barbell up from your chest until your arms are locked.",
            },
            instruction_steps: {
              en: [
                "Lie on the bench flat.",
                "Unrack the barbell.",
                "Lower the bar to your chest.",
                "Push back up explosively.",
              ],
            },
            muscle_group: "pectorals",
            target: "pectorals",
            image: "images/0025-EIeI8Vf.jpg",
            gif_url: "videos/0025-EIeI8Vf.gif",
          },
          {
            id: "0032",
            name: "barbell deadlift",
            category: "upper legs",
            body_part: "upper legs",
            equipment: "barbell",
            instructions: {
              en: "Lift a loaded barbell off the ground to hip level, keeping your back straight and core braced.",
            },
            instruction_steps: {
              en: [
                "Position feet under bar.",
                "Hinge hips and grip bar.",
                "Drive legs down and lift bar to hips.",
                "Lower under control.",
              ],
            },
            muscle_group: "glutes",
            target: "glutes",
            image: "images/0032-ila4NZS.jpg",
            gif_url: "videos/0032-ila4NZS.gif",
          },
          {
            id: "0294",
            name: "dumbbell biceps curl",
            category: "upper arms",
            body_part: "upper arms",
            equipment: "dumbbell",
            instructions: {
              en: "Stand holding dumbbells at your sides. Curl dumbbells up towards shoulders, supinating wrists.",
            },
            instruction_steps: {
              en: [
                "Stand with elbows tucked.",
                "Curl dumbbells up.",
                "Squeeze biceps at the top.",
                "Lower slowly.",
              ],
            },
            muscle_group: "biceps",
            target: "biceps",
            image: "images/0294-NbVPDMW.jpg",
            gif_url: "videos/0294-NbVPDMW.gif",
          },
        ]);
        setLoading(false);
      });
  }, []);

  const [ytVideoId, setYtVideoId] = useState<string | null>(null);
  const [loadingYt, setLoadingYt] = useState(false);

  // Set modal image source and reset states + fetch YouTube demo video using API Key
  useEffect(() => {
    if (selected) {
      setImgSrc(`/exercises/${selected.gif_url}`);
      setImageError(false);
      setTimeElapsed(0);
      setTimerRunning(false);
      setYtVideoId(null);
      setMediaTab("youtube"); // default to YouTube tab

      const youtubeKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (youtubeKey) {
        setLoadingYt(true);
        const query = `${selected.name} exercise form tutorial`;
        fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query)}&type=video&key=${youtubeKey}`
        )
          .then((res) => res.json())
          .then((data) => {
            const foundId = data.items?.[0]?.id?.videoId;
            if (foundId) {
              setYtVideoId(foundId);
            } else {
              setMediaTab("gif"); // Fallback to gif if no video found
            }
          })
          .catch((err) => {
            console.error("YouTube exercise fetch error:", err);
            setMediaTab("gif"); // Fallback to gif on error
          })
          .finally(() => setLoadingYt(false));
      } else {
        setMediaTab("gif"); // Fallback if no key is loaded
      }

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
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
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

  // Categories mapping matching Volt dark premium styling
  const categoriesList = [
    {
      id: "strength",
      title: "Power Lifting",
      tag: "Overs Range",
      icon: "🏋️",
      category: "Upper Legs",
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "cardio",
      title: "Dynamic Cardio",
      tag: "Lenn Range",
      icon: "🏃",
      category: "Cardio",
      image: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "waist",
      title: "High Workouts",
      tag: "Earn 3 Range",
      icon: "🤸",
      category: "Waist",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "arms",
      title: "High Perfaxity",
      tag: "Exit Range",
      icon: "💪",
      category: "Upper Arms",
      image: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "chest",
      title: "Chest Master",
      tag: "Pect Range",
      icon: "🦍",
      category: "Chest",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "flexibility",
      title: "Mind & Body",
      tag: "Stretch Range",
      icon: "🧘",
      category: "Back",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&auto=format&fit=crop&q=80",
    },
  ];

  // Filtering calculations over all 1,324 exercises
  const filteredExercises = allExercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      ex.category.toLowerCase() === selectedCategory.toLowerCase() ||
      ex.body_part.toLowerCase() === selectedCategory.toLowerCase();

    const matchesEquipment =
      selectedEquipment === "All" ||
      ex.equipment.toLowerCase() === selectedEquipment.toLowerCase();

    const matchesTarget =
      selectedTarget === "All" ||
      ex.target.toLowerCase() === selectedTarget.toLowerCase();

    return matchesSearch && matchesCategory && matchesEquipment && matchesTarget;
  });

  return (
    <PhoneShell>
      {/* Premium dark volt animation styling variables */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .bg-volt {
          background-color: #ccff00 !important;
        }
        .text-volt {
          color: #ccff00 !important;
        }
        .border-volt {
          border-color: #ccff00 !important;
        }
        .focus-within-volt:focus-within {
          border-color: #ccff00 !important;
          box-shadow: 0 0 12px rgba(204, 255, 0, 0.25) !important;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `,
        }}
      />

      {/* Sleek Premium Dark Header */}
      <div className="bg-zinc-950 px-5 pt-6 pb-2.5 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-black italic tracking-tighter text-white">
            HLK
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-volt" />
        </div>
        <div className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
          <Dumbbell className="h-4.5 w-4.5" />
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-grow overflow-y-auto px-5 pt-4 pb-28 bg-zinc-950 text-white scrollbar-none">
        
        {/* Search & Filter Header Section */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1 focus-within-volt rounded-2xl overflow-hidden transition-all duration-200">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search exercises, targets..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(12);
              }}
              className="w-full pl-11 pr-10 py-3.5 bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 outline-none focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-3.5 text-zinc-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Advanced Drawer Filter Toggle Button */}
          <button
            onClick={() => setShowFilterDrawer(true)}
            className={`p-3.5 rounded-2xl border transition active:scale-95 cursor-pointer ${
              selectedCategory !== "All" || selectedEquipment !== "All" || selectedTarget !== "All"
                ? "bg-volt/15 border-volt text-volt"
                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400"
            }`}
            title="Advanced Filters"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </button>

          <button
            onClick={handleVoiceSearch}
            className={`p-3.5 rounded-2xl border transition active:scale-95 ${
              isListening
                ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse"
                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400"
            }`}
            title="Voice Search"
          >
            {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </button>
        </div>

        {/* Premium Graphic Workout Banner */}
        <div className="mt-5 rounded-3xl overflow-hidden relative border border-zinc-850 bg-gradient-to-r from-zinc-900 via-zinc-950 to-zinc-900 p-5 flex items-center justify-between shadow-lg">
          <div
            className="absolute top-0 right-0 bottom-0 left-1/3 bg-cover bg-center opacity-30 mix-blend-screen pointer-events-none" 
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80')` }} 
          />
          <div className="relative z-10 space-y-2 flex-1 pr-6">
            <span className="text-[9px] uppercase tracking-widest text-volt font-black bg-zinc-950 border border-volt/20 px-2 py-0.5 rounded-md inline-block">
              Premium Workout
            </span>
            <h2 className="font-display text-xl font-extrabold tracking-tight leading-tight uppercase italic text-white">
              Workout <br />
              <span className="text-volt">Functionality</span>
            </h2>
            <p className="text-[10px] text-zinc-400 max-w-[150px] leading-relaxed">
              Step up your limits. Play customized sessions.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedEquipment("All");
                setSelectedTarget("All");
                setSearchQuery("");
                toast.info("Showing complete workout catalog!");
              }}
              className="bg-volt text-black text-[10px] font-black px-4.5 py-2 rounded-full uppercase tracking-wider transition active:scale-95 shadow-md mt-1 cursor-pointer"
            >
              Start Now
            </button>
          </div>
        </div>

        {/* Visual Premium Categories Selection Grid */}
        <div className="mt-6 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Categories
            </h3>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedEquipment("All");
                setSelectedTarget("All");
                setSearchQuery("");
                toast.success("Filters reset to show all!");
              }}
              className="text-[10px] font-bold text-volt uppercase hover:underline cursor-pointer"
            >
              See All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === cat.category.toLowerCase();
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(isSelected ? "All" : cat.category);
                    setVisibleCount(12);
                    toast.success(`Category filtered to ${cat.title}! 🏋️`);
                  }}
                  className={`rounded-3xl overflow-hidden aspect-[4/3.2] relative border transition duration-300 cursor-pointer shadow-md group ${
                    isSelected ? "border-volt scale-[1.02]" : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                  
                  {/* Top Right Checkmark Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? "bg-volt text-black" : "bg-black/50 text-white/50"
                    }`}>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <p className="font-display text-xs font-extrabold leading-tight tracking-tight uppercase line-clamp-1">
                      {cat.title}
                    </p>
                    <p className="text-[8px] text-zinc-400 font-semibold tracking-wide mt-0.5 uppercase">
                      {cat.tag}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Responsive Workout Grid Catalog */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between border-t border-zinc-900 pt-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Workout Grid
            </h3>
            <span className="text-[9px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full font-bold border border-zinc-800">
              {filteredExercises.length} Exercises
            </span>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory !== "All" || selectedEquipment !== "All" || selectedTarget !== "All") && (
            <div className="flex flex-wrap gap-1.5 items-center bg-zinc-900/40 border border-zinc-900 rounded-xl p-2.5">
              <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold mr-1">Active Filters:</span>
              {selectedCategory !== "All" && (
                <span className="text-[8px] font-black uppercase bg-volt/10 text-volt px-2 py-0.5 rounded-md flex items-center gap-1 border border-volt/20">
                  {selectedCategory}
                  <X className="h-2 w-2 cursor-pointer" onClick={() => setSelectedCategory("All")} />
                </span>
              )}
              {selectedEquipment !== "All" && (
                <span className="text-[8px] font-black uppercase bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md flex items-center gap-1 border border-zinc-700">
                  {selectedEquipment}
                  <X className="h-2 w-2 cursor-pointer" onClick={() => setSelectedEquipment("All")} />
                </span>
              )}
              {selectedTarget !== "All" && (
                <span className="text-[8px] font-black uppercase bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md flex items-center gap-1 border border-blue-500/20">
                  {selectedTarget}
                  <X className="h-2 w-2 cursor-pointer" onClick={() => setSelectedTarget("All")} />
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedEquipment("All");
                  setSelectedTarget("All");
                }}
                className="text-[8px] font-bold text-zinc-500 uppercase hover:text-white ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 animate-pulse flex flex-col items-center gap-2">
              <Sparkles className="h-6 w-6 text-volt animate-spin" />
              <p>Loading exercise catalog...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/50 py-16 text-center text-xs text-zinc-500">
              No matching exercises found. Reset filters above to start over!
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                {filteredExercises.slice(0, visibleCount).map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    ex={ex}
                    onClick={() => setSelected(ex)}
                    getIcon={getExerciseIcon}
                  />
                ))}
              </div>

              {/* Load More Pagination */}
              {filteredExercises.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount((prev) => prev + 12)}
                  className="w-full py-3.5 rounded-2xl border border-zinc-900 bg-zinc-900/40 hover:bg-zinc-900 text-xs font-black text-zinc-400 hover:text-volt transition active:scale-95 cursor-pointer"
                >
                  Load More Workouts ({filteredExercises.length - visibleCount} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filter slide-up Drawer Panel */}
      {showFilterDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/75 backdrop-blur-sm p-0 animate-fade-in"
          onClick={() => setShowFilterDrawer(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-zinc-900 border border-zinc-850 p-5 flex flex-col max-h-[70vh] overflow-y-auto"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-800 block" />

            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4 text-volt" />
                <span>Filter Library</span>
              </h3>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {/* Equipment Filters */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Equipment Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueEquipments.map((equip) => {
                    const isActive = selectedEquipment === equip;
                    return (
                      <button
                        key={equip}
                        onClick={() => {
                          setSelectedEquipment(equip);
                          setVisibleCount(12);
                        }}
                        className={`text-[9px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg border transition ${
                          isActive
                            ? "bg-volt text-black border-volt font-black"
                            : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {equip}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Muscle Targets Filters */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Target Muscle Group</p>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueTargets.map((target) => {
                    const isActive = selectedTarget === target;
                    return (
                      <button
                        key={target}
                        onClick={() => {
                          setSelectedTarget(target);
                          setVisibleCount(12);
                        }}
                        className={`text-[9px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg border transition ${
                          isActive
                            ? "bg-volt text-black border-volt font-black"
                            : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {target}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFilterDrawer(false)}
              className="w-full mt-6 rounded-2xl bg-volt text-black py-3.5 font-display font-black text-xs shadow-glow active:scale-95 transition uppercase tracking-wider cursor-pointer"
            >
              Apply Filter Selection
            </button>
          </div>
        </div>
      )}

      {/* Slide-Up Exercise Detail & Log Modal with Video Demonstration */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/75 backdrop-blur-sm p-0 sm:p-4 text-white animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-zinc-800 shadow-glow p-5 flex flex-col max-h-[85vh] overflow-y-auto"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-zinc-800 block sm:hidden" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-volt font-black bg-volt/10 border border-volt/20 px-2.5 py-0.5 rounded-md">
                  {selected.category}
                </span>
                <p className="font-display text-lg font-extrabold mt-1.5 capitalize text-white leading-tight">
                  {selected.name}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-1.5 text-zinc-400 hover:text-white active:scale-95 transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Media Selector Tabs (YouTube Video vs Animation GIF) */}
            <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-850 mt-4">
              <button
                onClick={() => setMediaTab("youtube")}
                disabled={loadingYt}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                  mediaTab === "youtube"
                    ? "bg-volt text-black font-black"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                🎥 Video Tutorial
              </button>
              <button
                onClick={() => setMediaTab("gif")}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                  mediaTab === "gif"
                    ? "bg-volt text-black font-black"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                👾 Animation GIF
              </button>
            </div>

            {/* Media Player viewport */}
            <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 flex items-center justify-center relative shadow-inner">
              {loadingYt ? (
                <div className="flex flex-col items-center gap-2 text-zinc-500 animate-pulse">
                  <Sparkles className="h-8 w-8 text-volt animate-spin" />
                  <p className="text-[10px] font-bold">Searching YouTube tutorials...</p>
                </div>
              ) : mediaTab === "youtube" && ytVideoId ? (
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${ytVideoId}`}
                  title="Workout Video demonstration player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : !imageError ? (
                <img
                  src={imgSrc}
                  alt={selected.name}
                  onError={() => {
                    if (imgSrc !== `/exercises/${selected.image}`) {
                      setImgSrc(`/exercises/${selected.image}`);
                    } else {
                      setImageError(true);
                    }
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500 p-4">
                  <ShieldAlert className="h-8 w-8 text-amber-500 animate-bounce" />
                  <p className="text-[10px] font-bold text-center">
                    Video demonstration offline or not found
                  </p>
                </div>
              )}

              {/* Video Overlay Badge */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                <Play className="h-2.5 w-2.5 fill-volt text-volt" />
                <span>{mediaTab === "youtube" && ytVideoId ? "YouTube Live Demo" : "Animation Demo"}</span>
              </div>
            </div>

            {/* Primary & Secondary Target Muscles Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4 text-left">
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/30 p-2.5">
                <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">
                  Primary Muscles
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] font-black text-volt capitalize">
                    {selected.target}
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/30 p-2.5">
                <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">
                  Synergy / Secondary
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[10px] font-bold text-zinc-300 capitalize truncate">
                    {selected.muscle_group || "none"}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center mt-3 text-white">
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/20 py-2 px-1">
                <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">
                  Category
                </p>
                <p className="text-xs font-black text-white capitalize mt-0.5 truncate">
                  {selected.category}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/20 py-2 px-1">
                <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">
                  Equipment
                </p>
                <p className="text-xs font-black text-white capitalize mt-0.5 truncate">
                  {selected.equipment}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-850 bg-zinc-950/20 py-2 px-1">
                <p className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold">
                  Burn Rate
                </p>
                <p className="text-xs font-black text-volt mt-0.5 truncate">
                  ~{getExerciseKcalPerMin(selected.category)}/min
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {/* Stepped instructions */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-volt" />
                    <span>Instruction Steps:</span>
                  </p>
                  <button
                    onClick={toggleAudioCoach}
                    className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border transition duration-200 cursor-pointer ${
                      isSpeaking
                        ? "bg-red-500/10 border-red-500/20 text-red-500 font-black animate-pulse"
                        : "bg-volt/10 border-volt/20 text-volt font-black"
                    }`}
                  >
                    {isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    <span>{isSpeaking ? "Pause Coach" : "Audio Coach"}</span>
                  </button>
                </div>
                <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 border border-zinc-800 rounded-xl p-3 bg-zinc-950/40 scrollbar-thin">
                  {(selected.instruction_steps?.en || [selected.instructions.en]).map(
                    (step, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 text-xs text-zinc-400 leading-relaxed items-start"
                      >
                        {/* Number Stepper Badge */}
                        <span className="flex-shrink-0 grid place-items-center h-4.5 w-4.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] font-black text-volt">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Stopwatch & Timer Live Widget */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 shadow-inner">
                <div className="flex justify-between items-center mb-2 border-b border-zinc-800 pb-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-500">
                    Live Active Stopwatch
                  </span>
                  {timerRunning && (
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-display text-2xl font-black text-white tracking-tight">
                      {formatTime(timeElapsed)}
                    </span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">Elapsed workout time</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setTimerRunning(!timerRunning)}
                      className={`p-2.5 rounded-xl border transition active:scale-95 cursor-pointer ${
                        timerRunning
                          ? "bg-amber-500/15 border-amber-500/20 text-amber-500"
                          : "bg-volt text-black border-volt"
                      }`}
                    >
                      {timerRunning ? (
                        <Pause className="h-4.5 w-4.5" />
                      ) : (
                        <Play className="h-4.5 w-4.5 fill-black" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setTimerRunning(false);
                        setTimeElapsed(0);
                      }}
                      className="p-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 transition active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Duration selector weight-burned metrics */}
              <div className="pt-2 border-t border-zinc-850">
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold text-zinc-400">
                    Duration Selector
                  </span>
                  <span className="font-display text-base font-extrabold text-white">
                    {mins}{" "}
                    <span className="text-xs font-medium text-zinc-500">
                      min · {Math.round(getExerciseKcalPerMin(selected.category) * mins)} kcal
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={mins}
                  onChange={(e) => setMins(+e.target.value)}
                  className="w-full accent-volt h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const kcalRate = getExerciseKcalPerMin(selected.category);
                addExercise(
                  {
                    id: selected.id,
                    name: selected.name,
                    kcalPerMin: kcalRate,
                    icon: getExerciseIcon(selected.category, selected.name),
                    category: selected.category,
                    target: selected.target,
                    body_part: selected.body_part,
                    equipment: selected.equipment,
                    instructions: selected.instructions,
                  } as any,
                  mins,
                );

                toast.success(`Successfully logged ${mins} min of ${selected.name}! 🏋️`);
                setSelected(null);
              }}
              className="w-full mt-4 rounded-2xl bg-volt text-black py-3.5 font-display font-black text-xs shadow-glow active:scale-95 transition uppercase tracking-wider cursor-pointer"
            >
              Log Workout Progress
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
