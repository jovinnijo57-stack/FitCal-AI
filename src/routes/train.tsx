import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
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
  X,
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

const maptilerKey = "uHEQYWp38heR6mODjn0D";


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

// ─── Calorie calculation using MET formula & custom distance-based estimation ────────────────────────────────────
function calcCalories(met: number, weightKg: number, durationSecs: number, distanceKm: number): number {
  if (distanceKm > 0.02) {
    return Math.round(weightKg * distanceKm * 1.036);
  }
  const hours = durationSecs / 3600;
  return Math.round(met * weightKg * hours);
}

// ─── Weather WMO Interpretation Helper ─────────────────────────────────────────
function getWmoWeather(code: number): { desc: string; icon: string } {
  switch (code) {
    case 0:
      return { desc: "Clear", icon: "☀️" };
    case 1:
      return { desc: "Mainly Clear", icon: "🌤️" };
    case 2:
      return { desc: "Partly Cloudy", icon: "⛅" };
    case 3:
      return { desc: "Cloudy", icon: "☁️" };
    case 45:
    case 48:
      return { desc: "Foggy", icon: "🌫️" };
    case 51:
    case 53:
    case 55:
      return { desc: "Drizzle", icon: "🌧️" };
    case 56:
    case 57:
      return { desc: "Freezing Drizzle", icon: "🌧️" };
    case 61:
    case 63:
    case 65:
      return { desc: "Rainy", icon: "🌧️" };
    case 66:
    case 67:
      return { desc: "Freezing Rain", icon: "🌧️" };
    case 71:
    case 73:
    case 75:
      return { desc: "Snowy", icon: "❄️" };
    case 77:
      return { desc: "Snow Grains", icon: "❄️" };
    case 80:
    case 81:
    case 82:
      return { desc: "Showers", icon: "🌦️" };
    case 85:
    case 86:
      return { desc: "Snow Showers", icon: "❄️" };
    case 95:
      return { desc: "Thunderstorm", icon: "⛈️" };
    case 96:
    case 99:
      return { desc: "Thunderstorm", icon: "⛈️" };
    default:
      return { desc: "Clear", icon: "☀️" };
  }
}

// ─── AQI Label helper ─────────────────────────────────────────────────────────
function getAqiLabel(aqi: number): { label: string; color: string; bg: string; border: string } {
  if (aqi <= 50)  return { label: "Good",          color: "text-emerald-400", bg: "bg-emerald-500/10",  border: "border-emerald-500/25" };
  if (aqi <= 100) return { label: "Moderate",       color: "text-yellow-400",  bg: "bg-yellow-500/10",   border: "border-yellow-500/25"  };
  if (aqi <= 150) return { label: "Unhealthy (Sensitive)", color: "text-orange-400",  bg: "bg-orange-500/10",   border: "border-orange-500/25"  };
  if (aqi <= 200) return { label: "Unhealthy",      color: "text-red-400",    bg: "bg-red-500/10",      border: "border-red-500/25"     };
  if (aqi <= 300) return { label: "Very Unhealthy", color: "text-purple-400",  bg: "bg-purple-500/10",   border: "border-purple-500/25"  };
  return                  { label: "Hazardous",     color: "text-rose-500",   bg: "bg-rose-500/10",     border: "border-rose-500/25"    };
}

// ─── Sun Arc Position Calculations ────────────────────────────────────────────
function getSunPosition(progress: number) {
  const safeProgress = Math.max(0, Math.min(1, progress));
  const angle = Math.PI - (safeProgress * Math.PI); // 180 (left) to 0 (right)
  const x = 100 + 80 * Math.cos(angle);
  const y = 90 - 80 * Math.sin(angle);
  return { x, y };
}

// ─── Map component (Premium MapLibre GL JS + MapTiler Free Key) ───────────────
function TrackMap({ route, center, activityColor }: { route: Coords[]; center: Coords | null; activityColor: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [maplibreLoaded, setMaplibreLoaded] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 1. Load MapLibre GL JS & CSS dynamically
  useEffect(() => {
    const win = window as any;
    if (win.maplibregl) {
      setMaplibreLoaded(true);
      return;
    }

    // Load MapLibre CSS
    const cssId = "maplibre-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
      document.head.appendChild(link);
    }

    // Load MapLibre JS
    const scriptId = "maplibre-js";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
      script.async = true;
      script.onload = () => setMaplibreLoaded(true);
      document.head.appendChild(script);
    } else {
      const check = setInterval(() => {
        if (win.maplibregl) {
          clearInterval(check);
          setMaplibreLoaded(true);
        }
      }, 200);
      return () => clearInterval(check);
    }
  }, []);

  // 2. Initialize MapLibre GL Map
  useEffect(() => {
    if (!maplibreLoaded || !mapRef.current) return;

    const win = window as any;
    const maplibregl = win.maplibregl;
    if (!maplibregl) return;

    const startCenter = center ? [center.lng, center.lat] : [76.2350, 10.4861]; // Thrissur, Kerala default

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerKey}`,
      center: startCenter, // Longitude, Latitude ordering
      zoom: 16,
      interactive: true,
      attributionControl: false,
    });

    // Create pulse dot DOM element for marker
    const el = document.createElement("div");
    el.className = "relative flex items-center justify-center";
    el.style.width = "20px";
    el.style.height = "20px";

    const ping = document.createElement("div");
    ping.className = "animate-ping absolute inline-flex h-full w-full rounded-full opacity-60";
    ping.style.backgroundColor = activityColor;

    const dot = document.createElement("div");
    dot.className = "relative inline-flex rounded-full border-2 border-white shadow-md";
    dot.style.backgroundColor = activityColor;
    dot.style.width = "14px";
    dot.style.height = "14px";

    el.appendChild(ping);
    el.appendChild(dot);

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(startCenter)
      .addTo(map);

    map.on("load", () => {
      // Add geojson source for route line
      map.addSource("route-source", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: route.map((c) => [c.lng, c.lat]),
          },
        },
      });

      // Add line layer
      map.addLayer({
        id: "route-layer",
        type: "line",
        source: "route-source",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": activityColor,
          "line-width": 6,
          "line-opacity": 0.9,
        },
      });

      setIsMapLoaded(true);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      try {
        map.remove();
      } catch (e) {}
      mapInstanceRef.current = null;
      markerRef.current = null;
      setIsMapLoaded(false);
    };
  }, [maplibreLoaded]);

  // 3. Update route polyline, location marker and center pan
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map || !isMapLoaded) return;

    // Update marker location
    if (marker && center) {
      marker.setLngLat([center.lng, center.lat]);
    }

    // Update center pan dynamically using smooth easeTo
    if (center) {
      map.easeTo({
        center: [center.lng, center.lat],
        zoom: 16,
        duration: 800,
      });
    }

    // Update GeoJSON route source data
    const source = map.getSource("route-source");
    if (source) {
      const coords = route.map((c) => [c.lng, c.lat]);
      source.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
      });
    }
  }, [route, center, isMapLoaded, activityColor]);

  if (!maplibreLoaded) {
    return (
      <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#0f172a] border border-[#1e3a5f]">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "linear-gradient(rgba(59,130,246,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.3) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="flex flex-col items-center gap-2 z-10">
          <Navigation className="h-7 w-7 text-blue-400 animate-pulse" />
          <p className="text-[10px] text-slate-400 font-semibold text-center px-4">Initializing premium maps...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full rounded-2xl z-10" />;
}


// ─── Main Component ───────────────────────────────────────────────────────────
function TrainPage() {
  const { state, addExercise } = useStore();
  const { profile } = state;

  const [showIntro, setShowIntro] = useState(true);
  const [showButton, setShowButton] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);

  // Load history from localStorage
  const loadHistoryList = useCallback(() => {
    try {
      const saved = localStorage.getItem("pulsepeak_workout_history");
      if (saved) {
        setHistoryList(JSON.parse(saved));
      } else {
        setHistoryList([]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch and Sync Supabase History on Mount
  useEffect(() => {
    async function syncSupabaseHistory() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.id) {
          const { data: dbSessions } = await supabase
            .from("workout_sessions")
            .select("*")
            .order("created_at", { ascending: false });
            
          if (dbSessions && dbSessions.length > 0) {
            const mapped = dbSessions.map((w: any) => {
              const dObj = new Date(w.created_at);
              return {
                id: w.id,
                activity: w.activity_type,
                distance: Number(w.distance_km),
                duration: w.duration_seconds,
                calories: w.calories,
                steps: w.steps,
                route: w.route_json || [],
                laps: w.laps_json || [],
                date: dObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
                time: dObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
                timestamp: dObj.getTime(),
              };
            });
            
            const localSaved = localStorage.getItem("pulsepeak_workout_history");
            const localList = localSaved ? JSON.parse(localSaved) : [];
            const merged = [...localList];
            
            mapped.forEach((dbS: any) => {
              if (!merged.some(lS => lS.id === dbS.id)) {
                merged.push(dbS);
              }
            });
            
            merged.sort((a, b) => b.timestamp - a.timestamp);
            localStorage.setItem("pulsepeak_workout_history", JSON.stringify(merged));
            setHistoryList(merged);
          }
        }
      } catch (err) {
        console.log("Supabase history sync ignored:", err);
      }
    }
    
    loadHistoryList();
    syncSupabaseHistory();
  }, [loadHistoryList]);

  const todayDateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const todaySessions = historyList.filter(s => s.date === todayDateStr);

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
  const welcomeVideoRefCallback = useCallback((video: HTMLVideoElement | null) => {
    if (!video) return;
    if (video.dataset.initialized === "true") return;
    
    video.dataset.initialized = "true";
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    
    const playVideo = () => {
      video.play().catch(() => {});
    };
    
    video.load();
    playVideo();
    
    // Safe fallback event listeners for strict mobile browser autoplay blocks
    const playOnInteraction = () => {
      playVideo();
      document.removeEventListener("touchstart", playOnInteraction);
      document.removeEventListener("click", playOnInteraction);
    };
    document.addEventListener("touchstart", playOnInteraction, { passive: true });
    document.addEventListener("click", playOnInteraction, { passive: true });
  }, []);

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
  const calories = calcCalories(actInfo.met, weightKg, elapsed, distKm);
  const speed = elapsed > 0 ? (distKm / (elapsed / 3600)) : 0;

  // Summary
  const [summary, setSummary] = useState<SessionSummary | null>(null);

  // Weather
  const [weather, setWeather] = useState<{ temp: number; desc: string; icon: string; wind: number } | null>(null);
  const [cityName, setCityName] = useState("Current Location");
  const [weatherDetails, setWeatherDetails] = useState<any>(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [show5Day, setShow5Day] = useState(false);

  // Auto-pause detection
  const lastMovedRef = useRef<number>(Date.now());
  const autoPausedRef = useRef(false);

  // ── Weather fetch (Open-Meteo — free, no API key required) ──────────────────
  const refreshWeatherData = useCallback(async () => {
    if (screen !== "hero") return;
    setLoadingWeather(true);

    const fetchWeather = async (lat: number, lon: number, city?: string) => {
      if (city) setCityName(city);
      try {
        // Open-Meteo: completely free, no API key, no registration needed
        const [wRes, aqRes] = await Promise.all([
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,uv_index` +
            `&hourly=temperature_2m,weather_code,wind_speed_10m,precipitation_probability` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max` +
            `&timezone=auto&forecast_days=7`
          ),
          fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
          ).catch(() => null),
        ]);

        const wData = await wRes.json();
        const aqData = aqRes ? await aqRes.json() : null;

        const current = wData.current;
        const wInfo = getWmoWeather(current.weather_code);
        
        setWeather({
          temp: Math.round(current.temperature_2m),
          desc: wInfo.desc,
          icon: wInfo.icon,
          wind: Math.round(current.wind_speed_10m),
        });

        // Parse sunrise/sunset relative times (timezone-safe string slice)
        const formatTimeFromIso = (isoStr: string) => {
          if (!isoStr || isoStr.length < 16) return "--:--";
          return isoStr.slice(11, 16); // e.g. "06:02"
        };

        // Fetch all 7 days Open-Meteo returns (used for both 3-day preview and 5-day/7-day expand)
        const dailyList = wData.daily.time.map((timeStr: string, idx: number) => {
          const date = new Date(timeStr);
          const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const dayName = idx === 0 ? "Today" : idx === 1 ? "Tomorrow" : days[date.getUTCDay()];
          const code = wData.daily.weather_code[idx];
          const info = idx === 0 ? wInfo : getWmoWeather(code);
          return {
            day: dayName,
            desc: info.desc,
            icon: info.icon,
            tempMax: Math.round(wData.daily.temperature_2m_max[idx]),
            tempMin: Math.round(wData.daily.temperature_2m_min[idx]),
            rainChance: wData.daily.precipitation_probability_max[idx] ?? 0,
          };
        });

        // Use the current local hour returned directly from the API current.time parameter
        const currentLocalHour = wData.current.time.slice(0, 13); // e.g. "2026-05-29T15"
        let currentHourIdx = wData.hourly.time.findIndex((t: string) => t.startsWith(currentLocalHour));
        if (currentHourIdx < 0) {
          // fallback using shifted UTC hour
          const localTimeMs = Date.now() + (wData.utc_offset_seconds * 1000);
          currentHourIdx = new Date(localTimeMs).getUTCHours();
        }

        const hourlyList = wData.hourly.time.slice(currentHourIdx, currentHourIdx + 6).map((timeStr: string, idx: number) => {
          const formattedHour = timeStr.slice(11, 16); // e.g. "15:00" timezone-safe
          const absIdx = currentHourIdx + idx;
          const code = wData.hourly.weather_code[absIdx] ?? 0;
          const info = getWmoWeather(code);
          return {
            time: idx === 0 ? "Now" : formattedHour,
            temp: Math.round(wData.hourly.temperature_2m[absIdx]),
            icon: info.icon,
            windSpeed: Math.round(wData.hourly.wind_speed_10m[absIdx]),
            rainChance: wData.hourly.precipitation_probability ? Math.round(wData.hourly.precipitation_probability[absIdx] ?? 0) : 0,
          };
        });

        setWeatherDetails({
          cityName: city || cityName,
          temp: Math.round(current.temperature_2m),
          desc: wInfo.desc,
          wind: Math.round(current.wind_speed_10m),
          humidity: Math.round(current.relative_humidity_2m),
          realFeel: Math.round(current.apparent_temperature),
          chanceOfRain: wData.daily.precipitation_probability_max[0] ?? 0,
          pressure: Math.round(current.pressure_msl),
          uvIndex: Math.round(current.uv_index),
          sunrise: formatTimeFromIso(wData.daily.sunrise[0]),
          sunset: formatTimeFromIso(wData.daily.sunset[0]),
          sunriseIso: wData.daily.sunrise[0],
          sunsetIso: wData.daily.sunset[0],
          aqi: Math.round(aqData.current?.us_aqi ?? 49),
          dailyForecast: dailyList,
          hourlyForecast: hourlyList,
          utcOffsetSeconds: wData.utc_offset_seconds,
        });

      } catch (err) {
        console.error("Failed to fetch weather details:", err);
      } finally {
        setLoadingWeather(false);
      }
    };

    const fetchCityName = (lat: number, lon: number) => {
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then((r) => r.json())
        .then((data) => {
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || "Current Location";
          setCityName(city);
          fetchWeather(lat, lon, city);
        })
        .catch(() => {
          fetchWeather(lat, lon, "Current Location");
        });
    };

    const fallbackIpGeolocation = () => {
      fetch("https://ipapi.co/json/")
        .then((r) => r.json())
        .then((data) => {
          const city = data.city || "Current Location";
          setCityName(city);
          if (data.latitude && data.longitude) {
            fetchWeather(data.latitude, data.longitude, city);
          } else {
            fetchWeather(19.0760, 72.8777, "Mumbai");
          }
        })
        .catch(() => {
          fetchWeather(19.0760, 72.8777, "Mumbai");
        });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchCityName(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fallbackIpGeolocation();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      fallbackIpGeolocation();
    }
  }, [screen, cityName]);

  // Trigger fetch on mount and on modal show / screen change
  useEffect(() => {
    refreshWeatherData();
  }, [refreshWeatherData, showIntro, showWeatherModal]);

  // Refresh weather every 10 minutes automatically
  useEffect(() => {
    const interval = setInterval(() => {
      if (screen === "hero") {
        refreshWeatherData();
      }
    }, 600000);
    return () => clearInterval(interval);
  }, [refreshWeatherData, screen]);

  // Refresh weather when window is refocused
  useEffect(() => {
    const handleFocus = () => {
      if (screen === "hero") {
        refreshWeatherData();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshWeatherData, screen]);

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

  // ── Workout State Auto-Recovery ─────────────────────────────────────────────
  const STATE_KEY = "pulsepeak_active_workout";

  // Save active workout state to localStorage every second when running or paused
  useEffect(() => {
    if (screen !== "tracking") {
      localStorage.removeItem(STATE_KEY);
      return;
    }
    const workoutState = {
      activity,
      trackingState,
      elapsed,
      distanceM,
      route,
      laps,
      lastSavedTime: Date.now()
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(workoutState));
  }, [screen, activity, trackingState, elapsed, distanceM, route, laps]);

  // Restore active session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATE_KEY);
      if (!saved) return;
      
      const parsed = JSON.parse(saved);
      if (!parsed || !parsed.elapsed) return;

      // Restore parameters
      setActivity(parsed.activity);
      setElapsed(parsed.elapsed);
      setDistanceM(parsed.distanceM);
      setRoute(parsed.route);
      setLaps(parsed.laps);
      
      // Calculate background elapsed seconds if closed while actively recording
      if (parsed.trackingState === "active") {
        const backgroundSecs = Math.floor((Date.now() - parsed.lastSavedTime) / 1000);
        if (backgroundSecs > 0 && backgroundSecs < 14400) { // cap at 4 hours max background recovery
          setElapsed((prev) => prev + backgroundSecs);
        }
        setTrackingState("active");
        setScreen("tracking");
        startGps();
        startTimer();
        toast.info("Resumed active session from backup! 🏃💨");
      } else if (parsed.trackingState === "paused") {
        setTrackingState("paused");
        setScreen("tracking");
        toast.info("Restored paused session from backup!");
      }
    } catch (err) {
      console.error("Failed to restore workout state:", err);
    }
  }, [startGps, startTimer]);

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
      
      // 1. Save to daily active logs (updates dashboard calorie ring)
      addExercise(exercise, Math.round(summary.duration / 60) || 1);
      
      // 2. Compute steps strides based on target activity
      const stepsCount = summary.activity === "cycling" || summary.activity === "swimming"
        ? 0
        : Math.round(summary.distance * 1000 / (summary.activity === "running" ? 1.04 : 0.76));

      // 3. Create rich workout history payload
      const newSession = {
        id: crypto.randomUUID(),
        activity: summary.activity,
        distance: summary.distance,
        duration: summary.duration,
        calories: summary.calories,
        steps: stepsCount,
        route: summary.route,
        laps: summary.laps,
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        timestamp: Date.now(),
      };

      // 4. Save locally in localstorage workouts feed list
      const saved = localStorage.getItem("pulsepeak_workout_history");
      const currentList = saved ? JSON.parse(saved) : [];
      currentList.unshift(newSession);
      localStorage.setItem("pulsepeak_workout_history", JSON.stringify(currentList));
      setHistoryList(currentList);

      // 5. Save to Supabase workout_sessions table in background if online
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          supabase.from("workout_sessions").insert({
            id: newSession.id,
            user_id: data.user.id,
            activity_type: newSession.activity,
            distance_km: newSession.distance,
            duration_seconds: newSession.duration,
            calories: newSession.calories,
            steps: newSession.steps,
            route_json: newSession.route,
            laps_json: newSession.laps,
          }).then(({ error }) => {
            if (error) console.log("Supabase save error ignored:", error);
          });
        }
      });

      toast.success("Session saved to your activity log! 🎉");
      handleReset(); // Dynamically redirect to Hero Activity screen!
    } catch (err) {
      console.error(err);
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
    <PhoneShell hideNav={showIntro || screen !== "hero"} bgClass={showIntro ? "bg-black" : "bg-[#060d1f]"}>
      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container {
          background: #060d1f !important;
        }
        @keyframes cardiogram-draw {
          to { strokeDashoffset: 0; }
        }
        .animate-cardiogram {
          animation: cardiogram-draw 2.5s linear infinite;
        }
        .train-scrollbar::-webkit-scrollbar { display: none; }
        .animate-ex-fade { animation: exFadeIn 0.2s ease forwards; }
        @keyframes exFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
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
            <source src="/yellow_video.mp4?v=202605291110" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
          {showButton && (
            <div className="relative z-10 flex flex-col items-center gap-2.5 pb-8 px-6 w-full animate-ex-fade">
              <p className="text-white/70 text-[10px] font-semibold tracking-[0.15em] uppercase">
                Train smart. Live strong
              </p>
              <button
                onClick={() => setShowIntro(false)}
                className="px-8 py-3.5 rounded-full bg-[#3b82f6] text-white font-display font-black text-xs uppercase tracking-widest shadow-[0_0_25px_rgba(59,130,246,0.35)] active:scale-95 transition"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── SCREEN 1: HERO / ACTIVITY PICKER ─────────────────────────────── */}
          {screen === "hero" && (
            <div className="flex-grow flex flex-col min-h-0 bg-[#060d1f] text-white overflow-y-auto train-scrollbar pb-6">
              {/* Hero Banner */}
              <div className="relative h-64 shrink-0 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(6,13,31,0.15) 0%, rgba(6,13,31,0.97) 90%), url('https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&auto=format&fit=crop&q=80')`,
              }}
            />
            {/* Clickable Weather badge */}
            {weather && (
              <button
                onClick={() => setShowWeatherModal(true)}
                className="absolute top-4 right-4 bg-white/10 backdrop-blur-md hover:bg-white/15 active:scale-95 transition rounded-2xl px-3.5 py-2.5 border border-white/10 text-left z-20 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0">{weather.icon}</span>
                  <span className="text-xs font-bold text-white leading-none">{weather.temp}°C</span>
                </div>
                <p className="text-[9px] text-slate-300 mt-1">{weather.desc}</p>
                <div className="flex items-center gap-1 mt-1 text-slate-400">
                  <Wind className="h-2.5 w-2.5 shrink-0" />
                  <span className="text-[8px] leading-none">{weather.wind} km/h</span>
                </div>
              </button>
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
          <div className="px-5 mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Today's Activity</p>
              <button
                onClick={() => {
                  loadHistoryList();
                  setShowHistoryModal(true);
                }}
                className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-wider cursor-pointer"
              >
                View Activity
              </button>
            </div>
            
            {todaySessions.length > 0 ? (
              <div className="space-y-2">
                {todaySessions.slice(0, 3).map((session: any) => {
                  const act = ACTIVITIES.find(a => a.type === session.activity)!;
                  return (
                    <div key={session.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{act?.emoji || "🏃"}</span>
                        <div>
                          <p className="text-[11px] font-bold text-white capitalize">{session.activity}</p>
                          <p className="text-[9px] text-slate-500">{fmtTime(session.duration)} • {session.distance.toFixed(2)} km</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">{session.calories}</p>
                        <p className="text-[8px] text-slate-500 uppercase">kcal</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-4 text-center">
                <p className="text-[10px] text-slate-500 font-semibold">No activities recorded today yet.</p>
              </div>
            )}
          </div>

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
        <div className="flex flex-col h-dvh w-full bg-[#060d1f] text-white overflow-hidden pb-4">
          {/* Header */}
          <div className="px-5 pt-4 pb-3 flex items-center justify-between shrink-0">
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Now Tracking</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-lg">{actInfo.emoji}</span>
                <p className="text-sm font-black text-white">{actInfo.label}</p>
                {/* 4-bar cellular connection signal strength lock */}
                <div className="flex items-end gap-0.5 h-3 ml-2.5 mt-0.5" title={gpsAccuracy ? `GPS Accuracy: ±${Math.round(gpsAccuracy)}m` : "Acquiring GPS Lock"}>
                  {(() => {
                    const bars = [1, 2, 3, 4];
                    let activeBars = 1;
                    let colorClass = "bg-red-500";
                    if (gpsAccuracy !== null) {
                      if (gpsAccuracy < 15) {
                        activeBars = 4;
                        colorClass = "bg-emerald-400";
                      } else if (gpsAccuracy < 30) {
                        activeBars = 3;
                        colorClass = "bg-emerald-500/80";
                      } else if (gpsAccuracy < 60) {
                        activeBars = 2;
                        colorClass = "bg-amber-400";
                      }
                    }
                    return bars.map((bar) => {
                      const isActive = bar <= activeBars;
                      return (
                        <div
                          key={bar}
                          className={`w-0.5 rounded-sm transition-all ${isActive ? colorClass : "bg-white/10"}`}
                          style={{ height: `${bar * 25}%` }}
                        />
                      );
                    });
                  })()}
                </div>
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

          {/* Stats Row — Distance / Duration / Steps / Calories */}
          <div className="px-5 shrink-0">
            <div className="grid grid-cols-4 gap-1.5 bg-white/5 border border-white/10 rounded-2xl p-3">
              {[
                { label: "Distance", value: distKm.toFixed(2), unit: "km", icon: <MapPin className="h-3 w-3" /> },
                { label: "Duration", value: fmtTime(elapsed), unit: "time", icon: <Timer className="h-3 w-3" /> },
                activity === "cycling" || activity === "swimming"
                  ? { label: "Points", value: String(route.length), unit: "pts", icon: <Navigation className="h-3 w-3" /> }
                  : { label: "Steps", value: String(Math.round(distanceM / (activity === "running" ? 1.04 : 0.76))), unit: "steps", icon: <span className="text-[10px] leading-none">👣</span> },
                { label: "Calories", value: String(calories), unit: "kcal", icon: <Flame className="h-3 w-3" /> },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="flex justify-center mb-0.5 h-4 items-center" style={{ color: actColor }}>{s.icon}</div>
                  <p className="font-black text-white text-sm leading-none mt-0.5 truncate">{s.value}</p>
                  <p className="text-[7px] text-slate-500 uppercase tracking-wider mt-1">{s.unit}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Active Cardio Wave Visualizer */}
          <div className="px-5 mt-2 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between overflow-hidden relative h-12">
              <div className="flex items-center gap-2 z-10">
                <span className="text-red-500 animate-pulse text-sm">❤️</span>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none">Cardio Pulse</p>
              </div>
              
              {/* SVG Cardiogram Wave */}
              <div className="absolute right-3 left-24 top-0 bottom-0 flex items-center justify-end overflow-hidden">
                <svg className="w-full h-8 text-red-500/80 stroke-current fill-none stroke-2" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <path 
                    d="M0,15 L25,15 L30,5 L35,25 L40,15 L65,15 L70,5 L75,25 L80,15 L100,15" 
                    className={trackingState === "active" ? "animate-cardiogram" : ""} 
                    style={{ strokeDasharray: "200", strokeDashoffset: "200" }} 
                  />
                </svg>
              </div>
              
              <div className="z-10 text-right leading-none">
                <span className="text-sm font-black text-red-400 font-mono">
                  {trackingState === "active" 
                    ? Math.round(110 + (speed * 8) + (Math.random() * 5))
                    : 72
                  }
                </span>
                <span className="text-[8px] text-slate-500 font-bold uppercase ml-1">bpm</span>
              </div>
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
          <div className="px-5 pt-2 pb-8 flex items-center justify-center gap-6 shrink-0 bg-[#060d1f]">
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
        <div className="flex-grow flex flex-col min-h-screen bg-[#060d1f] text-white overflow-y-auto train-scrollbar pb-8">
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
              summary.activity === "cycling" || summary.activity === "swimming"
                ? { label: "GPS Points", value: String(summary.route.length), unit: "waypoints", icon: "📍" }
                : { label: "Estimated Steps", value: String(Math.round(summary.distance * 1000 / (summary.activity === "running" ? 1.04 : 0.76))), unit: "steps", icon: "👣" },
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
      </>
      )}

      {/* AccuWeather-style Full Screen Weather Details Overlay */}
      {showWeatherModal && weatherDetails && (
        <div className="fixed inset-x-0 bottom-0 top-0 max-w-md mx-auto w-full h-full bg-[#1b253b] text-white z-50 flex flex-col min-h-0 overflow-y-auto train-scrollbar pb-10 font-sans animate-ex-fade">
          {/* Header */}
          <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0">
            <button
              onClick={() => setShowWeatherModal(false)}
              className="h-9 w-9 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center flex flex-col items-center">
              <h3 className="font-display text-sm font-extrabold tracking-tight text-white flex items-center gap-1 capitalize">
                {weatherDetails.cityName}
              </h3>
              <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">PulsePeak Weather</p>
            </div>
            <button
              onClick={() => {
                refreshWeatherData();
                toast.success("Refreshing weather data...");
              }}
              disabled={loadingWeather}
              className={`h-9 w-9 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-90 ${loadingWeather ? "animate-spin text-blue-400" : ""}`}
              title="Refresh weather data"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Current Hero */}
          <div className="flex flex-col items-center py-6 text-center shrink-0">
            <h1 className="text-6xl font-display font-black text-white flex items-start justify-center">
              <span>{weatherDetails.temp}</span>
              <span className="text-3xl text-slate-300 font-light ml-1 mt-1">°C</span>
            </h1>
            <p className="text-base font-semibold text-slate-200 mt-3">{weatherDetails.desc}</p>
            {/* AQI Badge — dynamic label & colour based on actual AQI value */}
            {(() => {
              const aqiInfo = getAqiLabel(weatherDetails.aqi);
              return (
                <div className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full ${aqiInfo.bg} border ${aqiInfo.border} ${aqiInfo.color} text-[9px] font-black uppercase tracking-wider`}>
                  <span className="text-xs">🍃</span> AQI {weatherDetails.aqi} ({aqiInfo.label})
                </div>
              );
            })()}
          </div>

          {/* Daily Forecast — 3 days by default, expands to 7 when toggled */}
          <div className="px-5 mb-4 shrink-0">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 space-y-0">
              <p className="text-[8px] uppercase tracking-widest font-black text-slate-500 mb-3">
                {show5Day ? "7-Day Forecast" : "3-Day Forecast"}
              </p>
              {(show5Day ? weatherDetails.dailyForecast : weatherDetails.dailyForecast.slice(0, 3)).map((day: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2.5 border-b border-slate-800/50 last:border-0"
                >
                  <div className="flex items-center gap-2.5 w-24">
                    <span className="text-lg">{day.icon}</span>
                    <p className="text-xs font-bold text-slate-200 truncate">{day.day}</p>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <p className="text-[10px] text-slate-400 font-medium">{day.desc}</p>
                    {day.rainChance > 0 && (
                      <p className="text-[8px] text-blue-400 font-bold mt-0.5">🌧 {day.rainChance}%</p>
                    )}
                  </div>
                  <p className="text-xs font-black text-white text-right">
                    {day.tempMax}° / <span className="text-slate-400 font-bold">{day.tempMin}°</span>
                  </p>
                </div>
              ))}
              <div className="pt-3">
                <button
                  onClick={() => setShow5Day((v) => !v)}
                  className="w-full py-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/15 hover:text-blue-300 transition active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <span>{show5Day ? "▲ Show Less" : "▼ 7-Day Forecast"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hourly strip */}
          <div className="px-5 mb-4 shrink-0">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4">
              <p className="text-[8px] uppercase tracking-widest font-black text-slate-500 mb-3">Hourly Forecast</p>
              <div className="grid grid-cols-3 gap-2">
                {weatherDetails.hourlyForecast.map((hr: any, idx: number) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl py-3 px-1 text-center flex flex-col items-center">
                    <p className="text-[9px] text-slate-400 font-bold">{hr.time}</p>
                    <span className="text-xl my-1.5">{hr.icon}</span>
                    <p className="text-sm font-black text-white">{hr.temp}°C</p>
                    {hr.rainChance > 0 && (
                      <p className="text-[8px] text-blue-400 font-bold mt-0.5">🌧 {hr.rainChance}%</p>
                    )}
                    <p className="text-[8px] text-slate-500 mt-1">💨 {hr.windSpeed} km/h</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sunpath arc */}
          <div className="px-5 mb-4 shrink-0">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4.5 text-center flex flex-col items-center relative overflow-hidden">
              <p className="text-[8px] uppercase tracking-widest font-black text-slate-500 self-start mb-2">Sunrise & Sunset</p>
              
              {/* Arc SVG */}
              <div className="w-full max-w-[200px] h-[100px] relative my-2">
                <svg className="w-full h-full" viewBox="0 0 200 100">
                  {/* Horizon line */}
                  <line x1="0" y1="90" x2="200" y2="90" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  {/* Sunpath Dotted Arc */}
                  <path d="M 10 90 A 80 80 0 0 1 190 90" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
                  {/* Sun dot */}
                  {(() => {
                    let progress = 0.5;
                    try {
                      const parseToMinutes = (timeStr: string) => {
                        if (!timeStr) return 0;
                        const [h, m] = timeStr.split(":").map(Number);
                        return h * 60 + m;
                      };
                      const locDate = new Date(Date.now() + (weatherDetails.utcOffsetSeconds * 1000));
                      const nowMin = locDate.getUTCHours() * 60 + locDate.getUTCMinutes();
                      const riseMin = parseToMinutes(weatherDetails.sunrise);
                      const setMin = parseToMinutes(weatherDetails.sunset);
                      if (setMin > riseMin) {
                        progress = (nowMin - riseMin) / (setMin - riseMin);
                      }
                    } catch (e) {
                      console.error("Error calculating sun progress:", e);
                    }
                    const pos = getSunPosition(progress);
                    return (
                      <>
                        {/* Glow halo */}
                        <circle cx={pos.x} cy={pos.y} r="8" fill="rgba(251,191,36,0.3)" className="animate-pulse" />
                        {/* Yellow sun dot */}
                        <circle cx={pos.x} cy={pos.y} r="4" fill="#fbbf24" />
                      </>
                    );
                  })()}

                </svg>
                {/* Overlay details */}
                <div className="absolute bottom-1 left-2 flex flex-col items-start">
                  <p className="text-[7px] text-slate-500 uppercase tracking-widest">Sunrise</p>
                  <p className="text-[10px] text-slate-300 font-bold mt-0.5">{weatherDetails.sunrise}</p>
                </div>
                <div className="absolute bottom-1 right-2 flex flex-col items-end">
                  <p className="text-[7px] text-slate-500 uppercase tracking-widest">Sunset</p>
                  <p className="text-[10px] text-slate-300 font-bold mt-0.5">{weatherDetails.sunset}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="px-5 mb-4 shrink-0 grid grid-cols-2 gap-3">
            {[
              { label: "Real Feel", value: `${weatherDetails.realFeel}°C`, icon: "🌡️" },
              { label: "Humidity", value: `${weatherDetails.humidity}%`, icon: "💧" },
              { label: "Chance of Rain", value: `${weatherDetails.chanceOfRain}%`, icon: "🌧️" },
              { label: "Pressure", value: `${weatherDetails.pressure} mbar`, icon: "📊" },
              { label: "Wind Speed", value: `${weatherDetails.wind} km/h`, icon: "💨" },
              { label: "UV Index", value: String(weatherDetails.uvIndex), icon: "☀️" },
            ].map((m, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
                <span className="text-xl">{m.icon}</span>
                <div>
                  <p className="text-[8px] uppercase tracking-widest font-black text-slate-500 leading-none">{m.label}</p>
                  <p className="text-sm font-black text-white mt-1 leading-none">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
      {/* Workout History Overlay */}
      {showHistoryModal && (
        <div className="fixed inset-0 max-w-md mx-auto w-full h-full bg-[#060d1f] text-white z-50 flex flex-col min-h-0 overflow-y-auto train-scrollbar pb-10 font-sans animate-ex-fade">
          {/* Header */}
          <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0 border-b border-white/5 bg-[#060d1f]">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="h-9 w-9 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center">
              <h3 className="font-display text-sm font-extrabold tracking-tight text-white">Activity History</h3>
              <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">All Recorded Tracks</p>
            </div>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear your entire activity history? This cannot be undone.")) {
                  localStorage.removeItem("pulsepeak_workout_history");
                  setHistoryList([]);
                  toast.success("Activity history cleared!");
                  supabase.auth.getUser().then(({ data }) => {
                    if (data?.user?.id) {
                      supabase.from("workout_sessions").delete().eq("user_id", data.user.id).then();
                    }
                  });
                }
              }}
              className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-wider cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* History List */}
          <div className="p-5 flex-grow space-y-3">
            {historyList.length > 0 ? (
              historyList.map((session: any) => {
                const act = ACTIVITIES.find(a => a.type === session.activity)!;
                return (
                  <button
                    key={session.id}
                    onClick={() => {
                      setSelectedSession(session);
                      setShowDetailModal(true);
                    }}
                    className="w-full text-left bg-white/5 border border-white/10 hover:border-white/20 active:scale-[0.98] transition rounded-3xl p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {act?.emoji || "🏃"}
                      </span>
                      <div>
                        <p className="text-xs font-black text-white capitalize">{session.activity}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{session.date} • {session.time}</p>
                        <p className="text-[9px] text-slate-500 mt-1">{fmtTime(session.duration)} • {session.distance.toFixed(2)} km</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-sm font-black text-white">{session.calories}</p>
                      <p className="text-[8px] text-slate-400 uppercase tracking-wider">kcal</p>
                      <ChevronRight className="h-4 w-4 text-slate-500 inline mt-1.5" />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <Navigation className="h-10 w-10 text-slate-600 animate-pulse" />
                <p className="text-xs text-slate-500 font-bold">No recorded activities found.</p>
                <p className="text-[10px] text-slate-600 px-10">Start a new walking, running, or cycling activity to log details here!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Workout Detail Modal */}
      {showDetailModal && selectedSession && (
        <div className="fixed inset-0 max-w-md mx-auto w-full h-full bg-[#060d1f] text-white z-50 flex flex-col min-h-0 overflow-y-auto train-scrollbar pb-10 font-sans animate-ex-fade">
          {/* Header */}
          <div className="px-5 pt-6 pb-4 flex items-center justify-between shrink-0 border-b border-white/5 bg-[#060d1f]">
            <button
              onClick={() => setShowDetailModal(false)}
              className="h-9 w-9 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-90"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center">
              <h3 className="font-display text-sm font-extrabold tracking-tight text-white capitalize">
                {selectedSession.activity} Record
              </h3>
              <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-0.5">
                {selectedSession.date} at {selectedSession.time}
              </p>
            </div>
            <div className="w-9" />
          </div>

          {/* Body */}
          <div className="p-5 flex-grow space-y-4">
            {/* Big stats hero */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="font-black text-xl text-white leading-none">{selectedSession.distance.toFixed(2)}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">km</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">Distance</p>
                </div>
                <div>
                  <p className="font-black text-xl text-white leading-none">{fmtTime(selectedSession.duration)}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">time</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">Duration</p>
                </div>
                <div>
                  <p className="font-black text-xl text-white leading-none">{selectedSession.calories}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">kcal</p>
                  <p className="text-[8px] text-slate-500 mt-0.5">Calories</p>
                </div>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-1">Avg Pace</p>
                <p className="font-black text-white text-lg leading-none">
                  {fmtPace(selectedSession.distance, selectedSession.duration)}
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5">min/km</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-1">Avg Speed</p>
                <p className="font-black text-white text-lg leading-none">
                  {(selectedSession.duration > 0 ? (selectedSession.distance / (selectedSession.duration / 3600)) : 0).toFixed(1)}
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5">km/h</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-1">Estimated Steps</p>
                <p className="font-black text-white text-lg leading-none">
                  {selectedSession.steps}
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5">steps</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-1">Laps Marked</p>
                <p className="font-black text-white text-lg leading-none">
                  {selectedSession.laps?.length || 0}
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5">splits</p>
              </div>
            </div>

            {/* Route map */}
            {selectedSession.route?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Recorded Route Map</p>
                <div className="h-48 rounded-3xl overflow-hidden border border-white/10">
                  <TrackMap
                    route={selectedSession.route}
                    center={selectedSession.route.at(-1) || null}
                    activityColor={ACTIVITIES.find(a => a.type === selectedSession.activity)?.color || "#3b82f6"}
                  />
                </div>
              </div>
            )}

            {/* Laps splits */}
            {selectedSession.laps?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Lap Splits</p>
                <div className="space-y-1.5">
                  {selectedSession.laps.map((lap: any, idx: number) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3 w-3 text-amber-400" />
                        <p className="text-[11px] font-bold text-white">Lap {idx + 1}</p>
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
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
