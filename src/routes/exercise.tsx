import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useEffect, useRef } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useStore } from "@/lib/store";
import {
  Search,
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  Dumbbell,
  CheckCircle,
  Mic,
} from "lucide-react";
import { toast } from "sonner";

const exerciseSearchSchema = z.object({
  intro: z.string().optional(),
});

export const Route = createFileRoute("/exercise")({
  validateSearch: (search) => exerciseSearchSchema.parse(search),
  head: () => ({ meta: [{ title: "AI Gym Exercises — PulsePeak" }] }),
  component: ExercisePage,
});

interface ExerciseItem {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  instructions: { en: string; tr?: string };
  instruction_steps?: { en: string[]; tr?: string[] };
  muscle_group: string;
  secondary_muscles?: string[];
  target: string;
  image: string;
  gif_url: string;
}

function ExerciseCard({ ex, onClick }: { ex: ExerciseItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-zinc-900/60 border border-zinc-800 hover:border-[#ccff00] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shadow-md hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(204,255,0,0.08)] flex flex-col h-full"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950/80">
        <img
          src={`/exercises/${ex.gif_url}`}
          alt={ex.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `/exercises/${ex.image}`;
          }}
        />
        <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[8px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-800">
          {ex.category}
        </div>
      </div>
      <div className="p-3 flex-grow flex flex-col justify-between space-y-1.5">
        <h4 className="text-[10px] font-black text-zinc-200 uppercase tracking-wide line-clamp-2 leading-tight group-hover:text-[#ccff00] transition-colors">
          {ex.name}
        </h4>
        <div className="flex flex-wrap gap-1">
          <span className="text-[7.5px] font-extrabold uppercase tracking-wide bg-zinc-950 border border-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-md">
            {ex.equipment}
          </span>
          <span className="text-[7.5px] font-extrabold uppercase tracking-wide bg-[#ccff00]/10 text-[#ccff00] px-1.5 py-0.5 rounded-md">
            {ex.target}
          </span>
        </div>
      </div>
    </div>
  );
}

function ExercisePage() {
  const { addExercise } = useStore();
  const { intro } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [allExercises, setAllExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedEquipment, setSelectedEquipment] = useState("All");
  const [selectedTarget, setSelectedTarget] = useState("All");
  const [visibleCount, setVisibleCount] = useState(12);
  const [showFilters, setShowFilters] = useState(false);

  const [selected, setSelected] = useState<ExerciseItem | null>(null);
  const [mediaTab, setMediaTab] = useState<"youtube" | "gif">("youtube");
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);
  const [loadingYt, setLoadingYt] = useState(false);
  const [mins, setMins] = useState(30);
  const [showIntro, setShowIntro] = useState(intro !== "false");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [timerWasStarted, setTimerWasStarted] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Sync with search parameter if it changes
  useEffect(() => {
    if (intro === "true") {
      setShowIntro(true);
    } else if (intro === "false") {
      setShowIntro(false);
    }
  }, [intro]);

  useEffect(() => {
    if (showIntro) {
      setShowButton(false);
      const t = setTimeout(() => setShowButton(true), 500);
      return () => clearTimeout(t);
    } else {
      setShowButton(false);
    }
  }, [showIntro]);

  // Robust welcome video callback ref to ensure instant muted autoplay with fallback triggers
  const welcomeVideoRefCallback = (video: HTMLVideoElement | null) => {
    if (video) {
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      
      const playVideo = () => {
        video.play().catch(() => {});
      };
      
      playVideo();
      // Safe fallback event listeners for strict mobile browser autoplay blocks
      const playOnInteraction = () => {
        playVideo();
        document.removeEventListener("touchstart", playOnInteraction);
        document.removeEventListener("click", playOnInteraction);
      };
      document.addEventListener("touchstart", playOnInteraction, { passive: true });
      document.addEventListener("click", playOnInteraction, { passive: true });
    }
  };

  // Gym Activity Logs
  const [gymLogs, setGymLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pulsepeak_gym_activity_logs");
      if (stored) {
        try {
          setGymLogs(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef<any>(null);

  const CATEGORIES = ["All", "waist", "chest", "back", "upper arms", "upper legs", "lower legs", "shoulders", "cardio"];
  const EQUIPMENTS = ["All", "body weight", "dumbbell", "barbell", "cable", "leverage machine", "band", "kettlebell", "smith machine"];
  const TARGETS = ["All", "abs", "pectorals", "glutes", "biceps", "lats", "delts", "hamstrings", "quadriceps", "triceps", "calves"];

  // Load exercises
  useEffect(() => {
    fetch("/exercises/data/exercises.json")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setAllExercises(data); setLoading(false); })
      .catch(() => {
        setAllExercises([
          { id: "0001", name: "3/4 Sit-up", category: "waist", body_part: "waist", equipment: "body weight", instructions: { en: "Lie flat on your back with your knees bent and feet flat on the ground. Lift your torso up to a 45-degree angle. Pause, then lower." }, instruction_steps: { en: ["Lie flat on your back with knees bent.", "Lift torso to 45°.", "Pause, then slowly lower."] }, muscle_group: "abs", target: "abs", image: "images/0001-2gPfomN.jpg", gif_url: "videos/0001-2gPfomN.gif" },
          { id: "0025", name: "Barbell Bench Press", category: "chest", body_part: "chest", equipment: "barbell", instructions: { en: "Lying flat on a bench, press the barbell up from your chest until your arms are locked." }, instruction_steps: { en: ["Lie on bench.", "Unrack barbell.", "Lower bar to chest.", "Push back up explosively."] }, muscle_group: "pectorals", target: "pectorals", image: "images/0025-EIeI8Vf.jpg", gif_url: "videos/0025-EIeI8Vf.gif" },
          { id: "0032", name: "Barbell Deadlift", category: "upper legs", body_part: "upper legs", equipment: "barbell", instructions: { en: "Lift a loaded barbell off the ground to hip level, keeping your back straight." }, instruction_steps: { en: ["Position feet under bar.", "Hinge hips and grip.", "Drive legs and lift to hips.", "Lower under control."] }, muscle_group: "glutes", target: "glutes", image: "images/0032-ila4NZS.jpg", gif_url: "videos/0032-ila4NZS.gif" },
          { id: "0294", name: "Dumbbell Biceps Curl", category: "upper arms", body_part: "upper arms", equipment: "dumbbell", instructions: { en: "Stand holding dumbbells at your sides. Curl dumbbells up towards shoulders." }, instruction_steps: { en: ["Stand with elbows tucked.", "Curl dumbbells up.", "Squeeze at the top.", "Lower slowly."] }, muscle_group: "biceps", target: "biceps", image: "images/0294-NbVPDMW.jpg", gif_url: "videos/0294-NbVPDMW.gif" },
        ]);
        setLoading(false);
      });
  }, []);

  // Init speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined") synthRef.current = window.speechSynthesis;
  }, []);

  // Load YouTube video for selected exercise
  useEffect(() => {
    if (!selected) return;
    setYtVideoId(null);
    setTimeElapsed(0);
    setTimerRunning(false);
    setIsSpeaking(false);
    synthRef.current?.cancel();
    setMediaTab("youtube");
    const youtubeKey = (import.meta as any).env?.VITE_YOUTUBE_API_KEY;
    if (youtubeKey) {
      setLoadingYt(true);
      fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(selected.name + " " + selected.target + " proper form execution guide demo")}&type=video&relevanceLanguage=en&key=${youtubeKey}`)
        .then((r) => r.json())
        .then((d) => {
          const id = d.items?.[0]?.id?.videoId;
          if (id) setYtVideoId(id); else setMediaTab("gif");
        })
        .catch(() => setMediaTab("gif"))
        .finally(() => setLoadingYt(false));
    } else {
      setMediaTab("gif");
    }
  }, [selected]);

  // Timer
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  useEffect(() => {
    return () => { clearInterval(timerRef.current); synthRef.current?.cancel(); };
  }, []);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const getIcon = (cat: string, name: string): string => {
    const c = cat.toLowerCase(), n = name.toLowerCase();
    if (n.includes("run") || n.includes("sprint")) return "🏃";
    if (n.includes("walk")) return "🚶";
    if (n.includes("cycl") || n.includes("bike")) return "🚴";
    if (n.includes("swim")) return "🏊";
    if (n.includes("jump") || n.includes("skip")) return "🦘";
    if (n.includes("stretch") || n.includes("yoga")) return "🧘";
    if (c.includes("cardio")) return "🏃";
    if (c.includes("arm") || c.includes("biceps") || c.includes("triceps")) return "💪";
    if (c.includes("leg") || c.includes("thigh")) return "🦵";
    if (c.includes("chest")) return "🦍";
    if (c.includes("back")) return "🧍";
    if (c.includes("shoulder")) return "🎽";
    if (c.includes("waist") || c.includes("abs")) return "🤸";
    return "🏋️";
  };

  const getKcalPerMin = (cat: string): number => {
    const c = cat.toLowerCase();
    if (c.includes("cardio")) return 11;
    if (c.includes("chest") || c.includes("back")) return 7;
    if (c.includes("leg")) return 8;
    if (c.includes("arm") || c.includes("shoulder")) return 6;
    if (c.includes("waist")) return 5;
    return 5;
  };

  const filteredExercises = allExercises.filter((ex) => {
    const q = searchQuery.toLowerCase();
    return (
      (!q || ex.name.toLowerCase().includes(q) || ex.target.toLowerCase().includes(q) || ex.equipment.toLowerCase().includes(q)) &&
      (selectedCategory === "All" || ex.category.toLowerCase() === selectedCategory.toLowerCase() || ex.body_part.toLowerCase() === selectedCategory.toLowerCase()) &&
      (selectedEquipment === "All" || ex.equipment.toLowerCase() === selectedEquipment.toLowerCase()) &&
      (selectedTarget === "All" || ex.target.toLowerCase() === selectedTarget.toLowerCase())
    );
  });

  const handleLogExercise = () => {
    if (!selected) return;
    const kcalPerMin = getKcalPerMin(selected.category);
    const durationMinutes = timeElapsed / 60;
    const calculatedKcal = Math.max(1, Math.round(kcalPerMin * durationMinutes));

    const newLog = {
      id: crypto.randomUUID(),
      name: selected.name,
      category: selected.category,
      mins: parseFloat(durationMinutes.toFixed(2)),
      kcal: calculatedKcal,
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      icon: getIcon(selected.category, selected.name),
    };

    const updatedLogs = [newLog, ...gymLogs];
    setGymLogs(updatedLogs);
    localStorage.setItem("pulsepeak_gym_activity_logs", JSON.stringify(updatedLogs));

    toast.success(`✅ Saved to Gym History — ${durationMinutes < 1 ? `${timeElapsed}s` : `${durationMinutes.toFixed(1)}m`} · ${calculatedKcal} kcal!`);
    setSelected(null);
    setTimerWasStarted(false);
  };

  const toggleAudioCoach = () => {
    if (!synthRef.current || !selected) return;
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }
    const steps = selected.instruction_steps?.en || [selected.instructions.en];
    const utterance = new SpeechSynthesisUtterance(`Coach for ${selected.name}. ${steps.join(". ")}`);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
    setIsSpeaking(true);
  };

  const activeFilterCount = [selectedCategory !== "All", selectedEquipment !== "All", selectedTarget !== "All"].filter(Boolean).length;

  // Robust banner video callback ref to ensure instant muted autoplay with fallback triggers
  const bannerVideoRefCallback = (video: HTMLVideoElement | null) => {
    if (video) {
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      
      const playVideo = () => {
        video.play().catch(() => {});
      };
      
      playVideo();
      // Safe fallback event listeners for strict mobile browser autoplay blocks
      const playOnInteraction = () => {
        playVideo();
        document.removeEventListener("touchstart", playOnInteraction);
        document.removeEventListener("click", playOnInteraction);
      };
      document.addEventListener("touchstart", playOnInteraction, { passive: true });
      document.addEventListener("click", playOnInteraction, { passive: true });
    }
  };

  const handleVoiceSearch = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("🎙 Voice search is not supported in this browser.");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => { setIsListening(true); toast.info("🎙 Listening… Speak now!"); };
      recognition.onerror = () => { setIsListening(false); toast.error("🎙 Voice recognition error."); };
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) { setSearchQuery(transcript); setVisibleCount(12); toast.success(`🎙 "${transcript}"`); }
      };
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  return (
    <PhoneShell hideNav={showIntro || selected !== null || showLogs} bgClass="bg-zinc-950">
      <style dangerouslySetInnerHTML={{ __html: `
        .volt-scroll::-webkit-scrollbar { display: none; }
        .animate-ex-fade { animation: exFadeIn 0.2s ease forwards; }
        @keyframes exFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}} />

      <div className="relative flex-grow flex flex-col min-h-0 bg-zinc-950 text-white h-full w-full overflow-hidden">
        {showIntro ? (
          <div className="relative w-full h-full min-h-dvh flex flex-col items-center justify-end overflow-hidden bg-black">
            <video
              ref={welcomeVideoRefCallback}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/red_video.mp4?v=202605282130" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
            {showButton && (
              <div className="relative z-10 flex flex-col items-center gap-3 pb-16 px-6 w-full animate-ex-fade">
                <button
                  onClick={() => setShowIntro(false)}
                  className="px-6 py-2.5 rounded-full bg-[#ccff00] text-black font-display font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.25)] active:scale-95 transition"
                >
                  Get Started
                </button>
                <div className="text-center">
                  <p className="text-white font-display font-black text-base uppercase tracking-tight">AI Gym Guides</p>
                  <p className="text-white/70 text-[11px] font-semibold tracking-wide mt-0.5">Train your body. Upgrade your mind</p>
                </div>
              </div>
            )}
          </div>
        ) : selected ? (
          <div className="flex flex-col h-full w-full overflow-y-auto volt-scroll animate-ex-fade bg-zinc-950 text-white pb-6">
            {/* Close */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0">
              <button onClick={() => { setSelected(null); synthRef.current?.cancel(); setIsSpeaking(false); setTimerRunning(false); setTimeElapsed(0); setTimerWasStarted(false); }}
                className="h-9 w-9 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="text-[8px] uppercase tracking-widest text-zinc-500 font-black">{selected.category}</p>
              </div>
              <div className="h-9 w-9 flex items-center justify-center text-xl">
                {getIcon(selected.category, selected.name)}
              </div>
            </div>

            {/* Media tabs */}
            <div className="px-5 mb-3 shrink-0">
              <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
                {(["youtube", "gif"] as const).map((t) => (
                  <button key={t} onClick={() => setMediaTab(t)}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition ${mediaTab === t ? "bg-[#ccff00] text-black" : "text-zinc-500 hover:text-zinc-300"}`}>
                    {t === "youtube" ? "📺 Video Tutorial" : "🎞 GIF Demo"}
                  </button>
                ))}
              </div>
            </div>

            {/* Media */}
            <div className="px-5 shrink-0 mb-3">
              <div className="rounded-2xl overflow-hidden bg-zinc-900 aspect-video flex items-center justify-center border border-zinc-800">
                {mediaTab === "youtube" ? (
                  loadingYt ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 rounded-full border-2 border-[#ccff00] border-t-transparent animate-spin" />
                      <p className="text-[10px] text-zinc-500">Finding video tutorial…</p>
                    </div>
                  ) : ytVideoId ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=0&rel=0`}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope"
                      className="w-full h-full"
                      title={selected.name}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center px-4">
                      <span className="text-3xl">📺</span>
                      <p className="text-[10px] text-zinc-500 font-semibold">Video tutorial not found.<br/>Please use the GIF tab above.</p>
                    </div>
                  )
                ) : (
                  <img
                    src={`/exercises/${selected.gif_url}`}
                    alt={selected.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "/exercises/images/default.jpg";
                    }}
                  />
                )}
              </div>
            </div>

            {/* Name + tags */}
            <div className="px-5 mb-4 shrink-0">
              <h2 className="font-display text-xl font-extrabold capitalize tracking-tight">{selected.name}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[selected.equipment, selected.target, selected.body_part].map((tag) => (
                  <span key={tag} className="text-[8px] font-bold uppercase tracking-wide bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">{tag}</span>
                ))}
                {selected.secondary_muscles?.slice(0, 2).map((m) => (
                  <span key={m} className="text-[8px] font-bold uppercase bg-[#ccff00]/10 text-[#ccff00] px-2 py-0.5 rounded-md">{m}</span>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="px-5 mb-4 shrink-0">
              <p className="text-[9px] uppercase tracking-widest font-black text-zinc-500 mb-2.5">How to perform</p>
              {selected.instruction_steps?.en ? (
                <ol className="space-y-2">
                  {selected.instruction_steps.en.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="shrink-0 h-5 w-5 rounded-lg bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] text-[8px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                      <p className="text-[10px] text-zinc-300 leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[10px] text-zinc-400 leading-relaxed">{selected.instructions.en}</p>
              )}
            </div>

            {/* Timer + audio coach */}
            <div className="px-5 mb-4 shrink-0 grid grid-cols-2 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
                <p className="text-[8px] uppercase tracking-widest font-black text-zinc-500 mb-1.5 flex items-center gap-1"><Clock className="h-3 w-3" /> Timer</p>
                <p className="font-black text-2xl text-white">{fmtTime(timeElapsed)}</p>
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => { setTimerRunning(!timerRunning); setTimerWasStarted(true); }}
                    className={`flex-1 py-1.5 rounded-xl text-[8px] font-black uppercase flex items-center justify-center gap-1 ${timerRunning ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-[#ccff00] text-black"}`}>
                    {timerRunning ? <><Pause className="h-3 w-3" /> Pause</> : <><Play className="h-3 w-3 fill-current" /> Start</>}
                  </button>
                  <button onClick={() => { setTimerRunning(false); setTimeElapsed(0); setTimerWasStarted(false); }}
                    className="px-2 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition">
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3">
                <p className="text-[8px] uppercase tracking-widest font-black text-zinc-500 mb-1.5">Audio Coach</p>
                <p className="text-[10px] text-zinc-400 mb-2">Reads instructions aloud step by step</p>
                <button onClick={toggleAudioCoach}
                  className={`w-full py-1.5 rounded-xl text-[8px] font-black uppercase flex items-center justify-center gap-1 border transition ${isSpeaking ? "bg-red-500/15 border-red-500/30 text-red-400" : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white"}`}>
                  {isSpeaking ? <><VolumeX className="h-3 w-3" /> Stop</> : <><Volume2 className="h-3 w-3" /> Play Coach</>}
                </button>
              </div>
            </div>

            {/* Log workout */}
            <div className="px-5 mb-4 shrink-0">
              <button
                disabled={!timerWasStarted || timerRunning}
                onClick={handleLogExercise}
                className={`w-full py-4 rounded-3xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-lg ${
                  !timerWasStarted
                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed shadow-none"
                    : timerRunning
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-not-allowed animate-pulse shadow-none"
                    : "bg-[#ccff00] text-black hover:scale-[1.02] active:scale-95 cursor-pointer shadow-[#ccff00]/20"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                {!timerWasStarted
                  ? "Start Timer to Log"
                  : timerRunning
                  ? "Pause Timer to Log"
                  : `Log to Activity (+${Math.max(1, Math.round(getKcalPerMin(selected.category) * (timeElapsed / 60)))} kcal)`}
              </button>
            </div>
          </div>
        ) : showLogs ? (
          <div className="flex flex-col h-full w-full overflow-y-auto volt-scroll animate-ex-fade bg-zinc-950 text-white pb-6">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0 border-b border-zinc-900">
              <button
                onClick={() => setShowLogs(false)}
                className="h-9 w-9 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-widest text-[#ccff00] font-black">Gym Activity History</p>
              </div>
              {gymLogs.length > 0 ? (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to clear your entire gym history?")) {
                      setGymLogs([]);
                      localStorage.removeItem("pulsepeak_gym_activity_logs");
                      toast.success("Gym activity history cleared!");
                    }
                  }}
                  className="text-[9px] font-bold text-red-500 hover:underline uppercase"
                >
                  Clear All
                </button>
              ) : (
                <div className="w-12" />
              )}
            </div>

            {/* Stats Bar */}
            <div className="px-5 py-4 shrink-0 grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3.5 text-center">
                <p className="text-[8px] uppercase tracking-widest font-black text-zinc-500 mb-1">Workouts Logged</p>
                <p className="font-black text-xl text-white">{gymLogs.length}</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-3.5 text-center">
                <p className="text-[8px] uppercase tracking-widest font-black text-zinc-500 mb-1">Est. Gym Burn</p>
                <p className="font-black text-xl text-[#ccff00]">
                  {gymLogs.reduce((acc, curr) => acc + (curr.kcal || 0), 0)} <span className="text-[9px] text-zinc-500 font-bold">kcal</span>
                </p>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 px-5 pb-12 overflow-y-auto volt-scroll">
              {gymLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-4xl mb-3">📋</span>
                  <p className="text-xs font-bold text-zinc-400">No gym activities logged yet</p>
                  <p className="text-[9px] text-zinc-600 mt-1 max-w-[200px] leading-relaxed">
                    Start an exercise, set your minutes, and log it to build your history!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gymLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-3.5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-zinc-900 flex items-center justify-center text-lg shrink-0">
                          {log.icon || "🏋️"}
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-zinc-200 uppercase leading-snug line-clamp-1">
                            {log.name}
                          </h4>
                          <p className="text-[8px] text-zinc-500 font-semibold uppercase mt-0.5 tracking-wider">
                            {log.category} · {log.date}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-[#ccff00] leading-none">+{log.kcal} kcal</p>
                        <p className="text-[8px] text-zinc-500 mt-1">
                          {log.mins < 1 ? `${Math.round(log.mins * 60)} secs` : `${log.mins.toFixed(1)} mins`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="px-5 pt-6 pb-4 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#ccff00] font-black">PulsePeak</p>
                  <h1 className="font-display text-2xl font-extrabold tracking-tight text-white mt-0.5">AI Gym</h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLogs(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/25 text-[9px] font-black text-[#ccff00] uppercase tracking-widest active:scale-95 transition"
                  >
                    <span>View Activity</span>
                  </button>
                  <div className="h-9 w-9 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Dumbbell className="h-4.5 w-4.5 text-[#ccff00]" />
                  </div>
                </div>
              </div>

              {/* Blue Banner Video — above search bar */}
              <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden relative mb-4 bg-zinc-950">
                <video
                  ref={bannerVideoRefCallback}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="/blue_video.mp4?v=202605282255" type="video/mp4" />
                </video>
              </div>

              {/* Search bar with Voice Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(12); }}
                  placeholder="Search exercises, muscles, equipment…"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-16 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ccff00]/60 transition"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  <button
                    onClick={handleVoiceSearch}
                    className={`h-7 w-7 rounded-xl flex items-center justify-center transition ${
                      isListening
                        ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
                        : "text-zinc-500 hover:text-white bg-zinc-800/50 border border-zinc-700/30"
                    }`}
                    title="Voice Search"
                  >
                    {isListening ? <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" /> : <Mic className="h-3.5 w-3.5" />}
                  </button>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-white p-0.5">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Category Pills + Filter ─────────────────────────────────────── */}
            <div className="px-5 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1.5 overflow-x-auto volt-scroll flex-1 pb-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setVisibleCount(12); }}
                      className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition active:scale-95 ${
                        selectedCategory === cat
                          ? "bg-[#ccff00] text-black border-[#ccff00]"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`shrink-0 h-8 w-8 rounded-xl border flex items-center justify-center transition relative ${showFilters || activeFilterCount > 0 ? "bg-[#ccff00]/10 border-[#ccff00]/40 text-[#ccff00]" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#ccff00] rounded-full text-[7px] font-black text-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Filter panel */}
              {showFilters && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-3 animate-ex-fade space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Filters</p>
                    {activeFilterCount > 0 && (
                      <button onClick={() => { setSelectedEquipment("All"); setSelectedTarget("All"); }} className="text-[9px] font-bold text-[#ccff00] hover:underline">Reset</button>
                    )}
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold mb-1.5">Equipment</p>
                    <div className="flex flex-wrap gap-1">
                      {EQUIPMENTS.map((e) => (
                        <button key={e} onClick={() => setSelectedEquipment(e)}
                          className={`text-[8px] font-bold px-2 py-1 rounded-lg border transition ${selectedEquipment === e ? "bg-[#ccff00] text-black border-[#ccff00]" : "bg-zinc-950 border-zinc-800 text-zinc-400"}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold mb-1.5">Target Muscle</p>
                    <div className="flex flex-wrap gap-1">
                      {TARGETS.map((t) => (
                        <button key={t} onClick={() => setSelectedTarget(t)}
                          className={`text-[8px] font-bold px-2 py-1 rounded-lg border transition ${selectedTarget === t ? "bg-[#ccff00] text-black border-[#ccff00]" : "bg-zinc-950 border-zinc-800 text-zinc-400"}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Results count ───────────────────────────────────────────────── */}
            <div className="px-5 mb-3 shrink-0 flex items-center justify-between">
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
                {loading ? "Loading…" : `${filteredExercises.length.toLocaleString()} exercises`}
              </p>
              {(searchQuery || selectedCategory !== "All" || selectedEquipment !== "All" || selectedTarget !== "All") && (
                <button
                  onClick={() => { setSearchQuery(""); setSelectedCategory("All"); setSelectedEquipment("All"); setSelectedTarget("All"); }}
                  className="text-[9px] font-bold text-[#ccff00] hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* ── Exercise Grid ───────────────────────────────────────────────── */}
            <div className="flex-grow overflow-y-auto volt-scroll px-5 pb-24">
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl aspect-[3/4] animate-pulse" />
                  ))}
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-5xl mb-4">🏋️</span>
                  <p className="text-sm font-bold text-zinc-400">No exercises found</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Try a different search or filter</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {filteredExercises.slice(0, visibleCount).map((ex) => (
                      <ExerciseCard key={ex.id} ex={ex} onClick={() => setSelected(ex)} />
                    ))}
                  </div>
                  {visibleCount < filteredExercises.length && (
                    <button
                      onClick={() => setVisibleCount((v) => v + 12)}
                      className="mt-4 w-full py-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#ccff00] hover:border-[#ccff00]/30 transition"
                    >
                      Load More ({filteredExercises.length - visibleCount} remaining)
                    </button>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </PhoneShell>
  );
    }
