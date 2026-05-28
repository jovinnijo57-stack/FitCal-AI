import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useStore } from "@/lib/store";
import {
  Play,
  Pause,
  Square,
  Flag,
  MapPin,
  Timer,
  Flame,
  Zap,
  Navigation,
  Wind,
  Thermometer,
  ChevronRight,
  RotateCcw,
  Trophy,
  TrendingUp,
  Clock,
  Activity,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/train")({
  head: () => ({ meta: [{ title: "Train — PulsePeak" }] }),
  component: TrainPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type ActivityType = "running" | "walking" | "cycling" | "swimming" | "hiking";
type Screen = "hero" | "tracking" | "summary";
type TrackingState = "idle" | "active" | "paused";

interface Coords {
  lat: number;
  lng: number;
  timestamp: number;
}

interface LapMarker {
  distance: number;
  time: number;
  coords: Coords;
}

interface SessionSummary {
  activity: ActivityType;
  distance: number; // km
  duration: number; // seconds
  calories: number;
  avgPace: number; // min/km
  avgSpeed: number; // km/h
  laps: LapMarker[];
  route: Coords[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ACTIVITIES: { type: ActivityType; label: string; emoji: string; color: string; met: number; desc: string }[] = [
  { type: "running",  label: "Running",  emoji: "🏃", color: "#3b82f6", met: 9.8,  desc: "Track your run pace & route" },
  { type: "walking",  label: "Walking",  emoji: "🚶", color: "#10b981", met: 3.5,  desc: "Log your daily walks" },
  { type: "cycling",  label: "Cycling",  emoji: "🚴", color: "#f59e0b", met: 7.5,  desc: "Monitor your cycling distance" },
  { type: "swimming", label: "Swimming", emoji: "🏊", color: "#8b5cf6", met: 8.0,  desc: "Record pool & open water swims" },
  { type: "hiking",   label: "Hiking",   emoji: "🥾", color: "#ef4444", met: 6.0,  desc: "Explore trails & elevation" },
];

// ─── Haversine Distance (meters) ─────────────────────────────────────────────
function haversine(a: Coords, b: Coords): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDlat = Math.sin(dLat / 2);
  const sinDlng = Math.sin(dLng / 2);
  const x = sinDlat * sinDlat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinDlng * sinDlng;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function totalDistance(route: Coords[]): number {
  let d = 0;
  for (let i = 1; i < route.length; i++) d += haversine(route[i - 1], route[i]);
  return d;
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function fmtTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtPace(distKm: number, secs: number): string {
  if (distKm < 0.01) return "--:--";
  const secsPerKm = secs / distKm;
  const m = Math.floor(secsPerKm / 60);
  const s = Math.round(secsPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Calorie calculation using MET formula ────────────────────────────────────
function calcCalories(met: number, weightKg: number, durationSecs: number): number {
  const hours = durationSecs / 3600;
  return Math.round(met * weightKg * hours);
}

// ─── Map component (Google Maps or Fallback) ──────────────────────────────────
function TrackMap({ route, center, activityColor }: { route: Coords[]; center: Coords | null; activityColor: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const gmapsKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!gmapsKey || !mapRef.current) return;

    const win = window as any;
    const loadMap = () => {
      if (!mapRef.current) return;
      const initialCenter = center || { lat: 20.5937, lng: 78.9629 };
      const map = new win.google.maps.Map(mapRef.current, {
        center: { lat: initialCenter.lat, lng: initialCenter.lng },
        zoom: 16,
        disableDefaultUI: true,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e3a5f" }] },
          { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#172d4a" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f2846" }] },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      });
      mapInstanceRef.current = map;

      polylineRef.current = new win.google.maps.Polyline({
        path: [],
        geodesic: true,
        strokeColor: activityColor,
        strokeOpacity: 1.0,
        strokeWeight: 5,
        map,
      });

      markerRef.current = new win.google.maps.Marker({
        map,
        icon: {
          path: win.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: activityColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
        },
      });
    };

    if (win.google?.maps) {
      loadMap();
    } else {
      const scriptId = "gmaps-api";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${gmapsKey}`;
        script.async = true;
        script.onload = loadMap;
        document.head.appendChild(script);
      } else {
        const check = setInterval(() => {
          if (win.google?.maps) { clearInterval(check); loadMap(); }
        }, 200);
      }
    }
  }, [gmapsKey, activityColor]);

  // Update polyline + marker when route changes
  useEffect(() => {
    if (!mapInstanceRef.current || !polylineRef.current) return;
    const path = route.map((c) => ({ lat: c.lat, lng: c.lng }));
    polylineRef.current.setPath(path);
    if (center) {
      const pos = { lat: center.lat, lng: center.lng };
      markerRef.current?.setPosition(pos);
      mapInstanceRef.current.panTo(pos);
    }
  }, [route, center]);

  if (!gmapsKey) {
    // Fallback: dark placeholder map
    return (
      <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#0f172a] border border-[#1e3a5f]">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(59,130,246,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.3) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        {/* Animated pulse dot for current position */}
        {center && (
          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="relative">
              <div className="h-6 w-6 rounded-full animate-ping absolute inset-0" style={{ backgroundColor: activityColor, opacity: 0.4 }} />
              <div className="h-6 w-6 rounded-full border-2 border-white relative z-10" style={{ backgroundColor: activityColor }} />
            </div>
            <div className="mt-2 bg-[#1e3a5f]/80 backdrop-blur px-3 py-1.5 rounded-xl border border-[#2d4f7a]">
              <p className="text-[9px] font-bold text-slate-300 text-center">GPS Active</p>
              <p className="text-[8px] text-slate-400 text-center font-mono">{center.lat.toFixed(5)}, {center.lng.toFixed(5)}</p>
            </div>
          </div>
        )}
        {!center && (
          <div className="flex flex-col items-center gap-2 z-10">
            <Navigation className="h-7 w-7 text-blue-400 animate-pulse" />
            <p className="text-[10px] text-slate-400 font-semibold text-center px-4">Acquiring GPS signal...</p>
            <p className="text-[9px] text-slate-500 text-center px-4 mt-1">
              Add VITE_GOOGLE_MAPS_API_KEY to .env<br />for live map tracking
            </p>
          </div>
        )}
        {/* Route as a simple SVG line */}
        {route.length > 1 && center && (
          <div className="absolute bottom-4 left-4 right-4 bg-[#1e3a5f]/60 rounded-lg p-2 border border-[#2d4f7a]">
            <p className="text-[8px] text-blue-300 font-bold uppercase tracking-wider">{route.length} GPS waypoints recorded</p>
          </div>
        )}
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full rounded-2xl" />;
}

// ─── Main Component ───────────────────────────────────────────────────────────
function TrainPage() {
  const { state, addExercise } = useStore();
  const { profile } = state;

  const [screen, setScreen] = useState<Screen>("hero");
  const [activity, setActivity] = useState<ActivityType>("running");
  const [trackingState, setTrackingState] = useState<TrackingState>("idle");

  // GPS
  const [route, setRoute] = useState<Coords[]>([]);
  const [currentCoords, setCurrentCoords] = useState<Coords | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Timer
  const [elapsed, setElapsed] = useState(0); // seconds
  const timerRef = useRef<any>(null);
  const lastActiveTime = useRef<number>(0);

  // Laps
  const [laps, setLaps] = useState<LapMarker[]>([]);

  // Distance + calories
  const [distanceM, setDistanceM] = useState(0);
  const distKm = distanceM / 1000;
  const actInfo = ACTIVITIES.find((a) => a.type === activity)!;
  const weightKg = profile.weightKg || 70;
  const calories = calcCalories(actInfo.met, weightKg, elapsed);
  const speed = elapsed > 0 ? (distKm / (elapsed / 3600)) : 0;

  // Summary
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  // Weather
  const [weather, setWeather] = useState<{ temp: number; desc: string; wind: number } | null>(null);

  // Auto-pause detection
  const lastMovedRef = useRef<number>(Date.now());
  const autoPausedRef = useRef(false);

  // ── Weather fetch (Open-Meteo, no key required) ───────────────────────────
  useEffect(() => {
    if (screen !== "hero") return;
    navigator.geolocation?.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code`)
        .then((r) => r.json())
        .then((d) => {
          const wcode = d.current?.weather_code ?? 0;
          const desc = wcode <= 1 ? "Clear" : wcode <= 3 ? "Partly Cloudy" : wcode <= 48 ? "Foggy" : wcode <= 67 ? "Rainy" : "Stormy";
          setWeather({
            temp: Math.round(d.current?.temperature_2m ?? 0),
            desc,
            wind: Math.round(d.current?.wind_speed_10m ?? 0),
          });
        })
        .catch(() => {});
    });
  }, [screen]);

  // ── GPS watch ─────────────────────────────────────────────────────────────
  const startGps = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("GPS not supported on this device.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c: Coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: pos.timestamp,
        };
        setGpsAccuracy(pos.coords.accuracy);
        setCurrentCoords(c);

        setRoute((prev) => {
          if (prev.length > 0) {
            const d = haversine(prev[prev.length - 1], c);
            // Min distance filter: 3m to reduce GPS noise
            if (d < 3) return prev;
            lastMovedRef.current = Date.now();
            setDistanceM((dm) => dm + d);
          } else {
            lastMovedRef.current = Date.now();
          }
          return [...prev, c];
        });
      },
      (err) => {
        if (err.code === 1) toast.error("GPS permission denied. Please allow location access.");
        else toast.error("GPS signal lost. Move to an open area.");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, []);

  const stopGps = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
      // Auto-pause: if no GPS movement for 8 seconds
      if (Date.now() - lastMovedRef.current > 8000 && !autoPausedRef.current) {
        autoPausedRef.current = true;
        toast.info("Auto-paused — not moving", { duration: 2500 });
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopGps();
      stopTimer();
    };
  }, [stopGps, stopTimer]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStart = () => {
    setScreen("tracking");
    setTrackingState("active");
    setElapsed(0);
    setRoute([]);
    setDistanceM(0);
    setLaps([]);
    autoPausedRef.current = false;
    startGps();
    startTimer();
    toast.success(`${actInfo.emoji} ${actInfo.label} started!`);
  };

  const handlePause = () => {
    setTrackingState("paused");
    stopTimer();
    stopGps();
    toast.info("Paused — tap Resume to continue.");
  };

  const handleResume = () => {
    setTrackingState("active");
    autoPausedRef.current = false;
    lastMovedRef.current = Date.now();
    startGps();
    startTimer();
    toast.success("Resumed!");
  };

  const handleFlag = () => {
    if (!currentCoords) return;
    const lap: LapMarker = { distance: distKm, time: elapsed, coords: currentCoords };
    setLaps((prev) => [...prev, lap]);
    toast.success(`🚩 Lap ${laps.length + 1} marked — ${distKm.toFixed(2)} km`);
  };

  const handleStop = () => {
    stopTimer();
    stopGps();
    setTrackingState("idle");

    const s: SessionSummary = {
      activity,
      distance: distKm,
      duration: elapsed,
      calories,
      avgPace: distKm > 0.01 ? elapsed / distKm : 0,
      avgSpeed: elapsed > 0 ? distKm / (elapsed / 3600) : 0,
      laps,
      route,
    };
    setSummary(s);
    setScreen("summary");
  };

  const handleSaveSession = async () => {
    if (!summary) return;
    try {
      const exercise = {
        id: crypto.randomUUID(),
        name: `${actInfo.emoji} ${actInfo.label}`,
        kcalPerMin: actInfo.met * weightKg / 60,
        icon: actInfo.emoji,
      };
      addExercise(exercise, Math.round(summary.duration / 60));
      toast.success("Session saved to your activity log! 🎉");
    } catch {
      toast.error("Failed to save session.");
    }
  };

  const handleReset = () => {
    setScreen("hero");
    setSummary(null);
    setElapsed(0);
    setRoute([]);
    setDistanceM(0);
    setLaps([]);
  };

  const actColor = actInfo.color;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <PhoneShell>
      <style dangerouslySetInnerHTML={{ __html: `
        .train-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          70% { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-pulse-ring::before {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse-ring 2s ease-out infinite;
          opacity: 0;
        }
      `}} />

      {/* ── SCREEN 1: HERO / ACTIVITY PICKER ─────────────────────────────── */}
      {screen === "hero" && (
        <div className="flex-grow flex flex-col min-h-0 bg-[#060d1f] text-white overflow-y-auto train-scrollbar pb-24">
          {/* Hero Banner */}
          <div className="relative h-64 shrink-0 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(6,13,31,0.15) 0%, rgba(6,13,31,0.97) 90%), url('https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop&q=80')`,
              }}
            />
            {/* Weather badge */}
            {weather && (
              <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-blue-300" />
                  <span className="text-xs font-bold text-white">{weather.temp}°C</span>
                </div>
                <p className="text-[9px] text-slate-300 mt-0.5">{weather.desc}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Wind className="h-2.5 w-2.5 text-slate-400" />
                  <span className="text-[8px] text-slate-400">{weather.wind} km/h</span>
                </div>
              </div>
            )}
            {/* Hero text */}
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-blue-400 font-bold mb-1">PulsePeak</p>
              <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight">
                Record Your<br />
                <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(135deg, ${actColor}, #93c5fd)` }}>
                  Track
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 mt-1.5">Record and monitor your activity tracks in an easy and organized way.</p>
            </div>
          </div>

          {/* Activity Selector */}
          <div className="px-5 mt-5">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Choose Activity</p>
            <div className="grid grid-cols-5 gap-2">
              {ACTIVITIES.map((act) => (
                <button
                  key={act.type}
                  onClick={() => setActivity(act.type)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all active:scale-95 ${
                    activity === act.type
                      ? "border-2 scale-105"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                  style={
                    activity === act.type
                      ? { borderColor: act.color, backgroundColor: `${act.color}18` }
                      : {}
                  }
                >
                  <span className="text-xl">{act.emoji}</span>
                  <span className="text-[8px] font-bold text-slate-300 leading-none text-center">{act.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity description */}
          <div className="mx-5 mt-4 rounded-2xl p-4 border" style={{ backgroundColor: `${actColor}12`, borderColor: `${actColor}30` }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">{actInfo.emoji}</span>
              <p className="text-sm font-bold text-white">{actInfo.label}</p>
            </div>
            <p className="text-[10px] text-slate-400">{actInfo.desc}</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Flame className="h-3 w-3" style={{ color: actColor }} />
                <span className="text-[9px] text-slate-400">MET: {actInfo.met}</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" style={{ color: actColor }} />
                <span className="text-[9px] text-slate-400">~{Math.round(actInfo.met * weightKg / 60)} kcal/min</span>
              </div>
            </div>
          </div>

          {/* Today's activity summary (past sessions) */}
          {state.exercises.length > 0 && (
            <div className="px-5 mt-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Today's Activity</p>
              <div className="space-y-2">
                {state.exercises.slice(-3).map((ex) => (
                  <div key={ex.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{ex.exercise.icon || "⚡"}</span>
                      <div>
                        <p className="text-[11px] font-bold text-white">{ex.exercise.name}</p>
                        <p className="text-[9px] text-slate-500">{ex.minutes} min</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">{ex.kcal}</p>
                      <p className="text-[8px] text-slate-500 uppercase">kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Summary Row */}
          <div className="px-5 mt-4 grid grid-cols-3 gap-2.5">
            {[
              { label: "Today", value: `${state.exercises.reduce((a, e) => a + e.kcal, 0)}`, unit: "kcal", icon: <Flame className="h-3.5 w-3.5" /> },
              { label: "Sessions", value: `${state.exercises.length}`, unit: "logged", icon: <Trophy className="h-3.5 w-3.5" /> },
              { label: "Min Burned", value: `${state.exercises.reduce((a, e) => a + e.minutes, 0)}`, unit: "min", icon: <Clock className="h-3.5 w-3.5" /> },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                <div className="flex justify-center mb-1 text-blue-400">{s.icon}</div>
                <p className="font-black text-white text-base leading-none">{s.value}</p>
                <p className="text-[8px] text-slate-500 mt-0.5 uppercase tracking-wider">{s.unit}</p>
                <p className="text-[8px] text-slate-600 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Start Button */}
          <div className="px-5 mt-5 mb-2">
            <button
              onClick={handleStart}
              className="w-full py-4 rounded-3xl font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition active:scale-95 shadow-xl"
              style={{ backgroundColor: actColor, color: "#fff" }}
            >
              <Play className="h-5 w-5 fill-white" />
              Start {actInfo.label}
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 2: ACTIVE TRACKING ─────────────────────────────────────── */}
      {screen === "tracking" && (
        <div className="flex-grow flex flex-col min-h-0 bg-[#060d1f] text-white">
          {/* Header */}
          <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Now Tracking</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-lg">{actInfo.emoji}</span>
                <p className="text-sm font-black text-white">{actInfo.label}</p>
                {/* GPS accuracy indicator */}
                <div className={`h-2 w-2 rounded-full ml-1 ${gpsAccuracy !== null && gpsAccuracy < 20 ? "bg-emerald-400" : gpsAccuracy !== null && gpsAccuracy < 50 ? "bg-amber-400" : "bg-red-400"}`}
                  title={gpsAccuracy ? `GPS ±${Math.round(gpsAccuracy)}m` : "Acquiring GPS"}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Status</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className={`h-2 w-2 rounded-full ${trackingState === "active" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <p className="text-[11px] font-bold text-slate-300">{trackingState === "active" ? "Recording" : "Paused"}</p>
              </div>
            </div>
          </div>

          {/* Stats Row — Distance / Duration / Calories */}
          <div className="px-5 shrink-0">
            <div className="grid grid-cols-3 gap-2 bg-white/5 border border-white/10 rounded-2xl p-3">
              {[
                { label: "Distance", value: distKm.toFixed(2), unit: "km", icon: <MapPin className="h-3 w-3" /> },
                { label: "Duration", value: fmtTime(elapsed), unit: "time", icon: <Timer className="h-3 w-3" /> },
                { label: "Calories", value: String(calories), unit: "kcal", icon: <Flame className="h-3 w-3" /> },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="flex justify-center mb-0.5" style={{ color: actColor }}>{s.icon}</div>
                  <p className="font-black text-white text-lg leading-none">{s.value}</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">{s.unit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pace + Speed */}
          <div className="px-5 mt-2 grid grid-cols-2 gap-2 shrink-0">
            {[
              { label: "Avg Pace", value: fmtPace(distKm, elapsed), unit: "min/km", icon: <Zap className="h-3.5 w-3.5" /> },
              { label: "Avg Speed", value: speed.toFixed(1), unit: "km/h", icon: <TrendingUp className="h-3.5 w-3.5" /> },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${actColor}25`, color: actColor }}>
                  {s.icon}
                </div>
                <div>
                  <p className="font-black text-white text-sm leading-none">{s.value}</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">{s.unit}</p>
                  <p className="text-[8px] text-slate-600">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Map */}
          <div className="px-5 mt-3 flex-grow min-h-0">
            <div className="h-full min-h-[180px] rounded-2xl overflow-hidden border border-white/10">
              <TrackMap route={route} center={currentCoords} activityColor={actColor} />
            </div>
          </div>

          {/* Laps strip */}
          {laps.length > 0 && (
            <div className="px-5 mt-2 shrink-0">
              <div className="flex gap-2 overflow-x-auto train-scrollbar pb-1">
                {laps.map((lap, i) => (
                  <div key={i} className="shrink-0 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-center">
                    <p className="text-[8px] text-slate-500 font-bold uppercase">Lap {i + 1}</p>
                    <p className="text-[10px] font-black text-white">{lap.distance.toFixed(2)} km</p>
                    <p className="text-[8px] text-slate-500">{fmtTime(lap.time)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="px-5 py-4 flex items-center justify-center gap-5 shrink-0">
            {/* Flag lap */}
            <button
              onClick={handleFlag}
              disabled={trackingState !== "active"}
              className="h-12 w-12 rounded-full flex items-center justify-center border-2 transition active:scale-90 disabled:opacity-40"
              style={{ borderColor: "#f59e0b", backgroundColor: "#f59e0b20" }}
            >
              <Flag className="h-5 w-5 text-amber-400" />
            </button>

            {/* Pause / Resume */}
            {trackingState === "active" ? (
              <button
                onClick={handlePause}
                className="h-16 w-16 rounded-full flex items-center justify-center shadow-xl transition active:scale-90 border-2 border-white/20"
                style={{ backgroundColor: actColor }}
              >
                <Pause className="h-7 w-7 fill-white text-white" />
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="h-16 w-16 rounded-full flex items-center justify-center shadow-xl transition active:scale-90 border-2 border-white/20"
                style={{ backgroundColor: actColor }}
              >
                <Play className="h-7 w-7 fill-white text-white ml-0.5" />
              </button>
            )}

            {/* Stop */}
            <button
              onClick={handleStop}
              className="h-12 w-12 rounded-full flex items-center justify-center border-2 transition active:scale-90"
              style={{ borderColor: "#ef4444", backgroundColor: "#ef444420" }}
            >
              <Square className="h-5 w-5 text-red-400 fill-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 3: SESSION SUMMARY ─────────────────────────────────────── */}
      {screen === "summary" && summary && (
        <div className="flex-grow flex flex-col min-h-0 bg-[#060d1f] text-white overflow-y-auto train-scrollbar pb-24">
          {/* Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Session Complete!</p>
            </div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">
              {actInfo.emoji} {actInfo.label} Summary
            </h2>
          </div>

          {/* Big stats hero */}
          <div className="mx-5 rounded-3xl p-5 border mb-4" style={{ backgroundColor: `${actColor}12`, borderColor: `${actColor}30` }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Distance", value: summary.distance.toFixed(2), unit: "km" },
                { label: "Duration", value: fmtTime(summary.duration), unit: "time" },
                { label: "Calories", value: String(summary.calories), unit: "kcal" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-black text-2xl text-white leading-none">{s.value}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">{s.unit}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed metrics */}
          <div className="px-5 grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Avg Pace", value: fmtPace(summary.distance, summary.duration), unit: "min/km", icon: "⚡" },
              { label: "Avg Speed", value: summary.avgSpeed.toFixed(1), unit: "km/h", icon: "🏎️" },
              { label: "Laps", value: String(summary.laps.length), unit: "markers", icon: "🚩" },
              { label: "GPS Points", value: String(summary.route.length), unit: "waypoints", icon: "📍" },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm">{s.icon}</span>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{s.label}</p>
                </div>
                <p className="font-black text-white text-xl leading-none">{s.value}</p>
                <p className="text-[8px] text-slate-500 mt-0.5">{s.unit}</p>
              </div>
            ))}
          </div>

          {/* Route map */}
          <div className="mx-5 mb-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Route Map</p>
            <div className="h-40 rounded-2xl overflow-hidden border border-white/10">
              <TrackMap route={summary.route} center={summary.route.at(-1) ?? null} activityColor={actColor} />
            </div>
          </div>

          {/* Lap detail */}
          {summary.laps.length > 0 && (
            <div className="px-5 mb-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Lap Splits</p>
              <div className="space-y-1.5">
                {summary.laps.map((lap, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flag className="h-3 w-3 text-amber-400" />
                      <p className="text-[11px] font-bold text-white">Lap {i + 1}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[11px] font-black text-white">{lap.distance.toFixed(2)} km</p>
                        <p className="text-[8px] text-slate-500">distance</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black text-white">{fmtTime(lap.time)}</p>
                        <p className="text-[8px] text-slate-500">split time</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-5 space-y-3">
            <button
              onClick={handleSaveSession}
              className="w-full py-4 rounded-3xl font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-xl"
              style={{ backgroundColor: actColor }}
            >
              <CheckCircle className="h-5 w-5" />
              Save to Activity Log
            </button>
            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-3xl font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 bg-white/5 border border-white/10 text-slate-300"
            >
              <RotateCcw className="h-4 w-4" />
              New Activity
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
