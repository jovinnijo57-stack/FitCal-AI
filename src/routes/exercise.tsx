import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { useStore } from "@/lib/store";
import {
  Play,
  Pause,
  Square,
  Flag,
  Navigation,
  MapPin,
  Sun,
  Flame,
  TrendingUp,
  Clock,
  Activity,
  Check,
  ChevronRight,
  ArrowRight,
  Compass,
  Bell,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/exercise")({
  head: () => ({ meta: [{ title: "Train & Live GPS Activity Tracker — PulsePeak" }] }),
  component: TrackerPage,
});

interface LapSplit {
  lap: number;
  time: string;
  distance: string;
  calories: number;
}

interface ActivityLog {
  id: string;
  type: "Running" | "Walking" | "Cycling";
  address: string;
  distance: string;
  duration: string;
  calories: number;
  date: string;
}

function TrackerPage() {
  const { state, addExercise } = useStore();

  // Screen View state: 'welcome' | 'dashboard' | 'live'
  const [trackerTab, setTrackerTab] = useState<"welcome" | "dashboard" | "live">("welcome");

  // Selected tracker activity: 'Running' | 'Walking' | 'Cycling'
  const [activeActivity, setActiveActivity] = useState<"Running" | "Walking" | "Cycling">("Running");

  // Geolocation and mapping coordinates
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsAddress, setGpsAddress] = useState("Chester County, 710 1st St. Easton, PA");
  const [locating, setLocating] = useState(false);

  // Live stopwatch and statistics tracking states
  const [isTrackingRunning, setIsTrackingRunning] = useState(false);
  const [trackingSecs, setTrackingSecs] = useState(0);
  const [distanceAccum, setDistanceAccum] = useState(0); // in Km
  const [caloriesAccum, setCaloriesAccum] = useState(0); // in Cal
  const [laps, setLaps] = useState<LapSplit[]>([]);
  const trackerIntervalRef = useRef<any>(null);

  // Activity logs database mock history
  const [activityHistory, setActivityHistory] = useState<ActivityLog[]>([
    {
      id: "1",
      type: "Walking",
      address: "6 Holy Cross Circle, PA",
      distance: "10 Km",
      duration: "1h 45m",
      calories: 420,
      date: "May 27, 2026",
    },
    {
      id: "2",
      type: "Running",
      address: "719 Washington Alley, PA",
      distance: "6 Km",
      duration: "32:55",
      calories: 652,
      date: "May 26, 2026",
    },
    {
      id: "3",
      type: "Cycling",
      address: "6 Golf Course Alley, PA",
      distance: "17 Km",
      duration: "45m 12s",
      calories: 550,
      date: "May 25, 2026",
    },
  ]);

  // Handle Geolocation lookup on mount and coordinate changes
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsAddress(`Current Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
          setLocating(false);
          toast.success("GPS Geolocation locked successfully! 🌍");
        },
        (err) => {
          console.warn("GPS Permission blocked or unavailable, using mockup center coordinate.", err);
          setCoords({ lat: 40.6884, lng: -75.2207 }); // Easton, PA fallback
          setLocating(false);
        }
      );
    }
  }, []);

  // Interval timer tick down calculator for live tracking metrics
  useEffect(() => {
    if (isTrackingRunning) {
      trackerIntervalRef.current = setInterval(() => {
        setTrackingSecs((prev) => {
          const next = prev + 1;
          
          // Distance accumulator coefficients depending on selected activity rate
          // Running: ~0.003 km/s, Walking: ~0.0015 km/s, Cycling: ~0.006 km/s
          let speedFactor = 0.003;
          let calFactor = 0.3; // cal/second
          if (activeActivity === "Walking") {
            speedFactor = 0.0015;
            calFactor = 0.12;
          } else if (activeActivity === "Cycling") {
            speedFactor = 0.006;
            calFactor = 0.22;
          }

          setDistanceAccum((dist) => dist + speedFactor);
          setCaloriesAccum((cals) => Math.round(cals + calFactor));

          return next;
        });
      }, 1000);
    } else {
      if (trackerIntervalRef.current) clearInterval(trackerIntervalRef.current);
    }
    return () => {
      if (trackerIntervalRef.current) clearInterval(trackerIntervalRef.current);
    };
  }, [isTrackingRunning, activeActivity]);

  // Format tracking seconds into MM:SS or HH:MM:SS
  const formatSecs = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    const mStr = mins.toString().padStart(2, "0");
    const sStr = secs.toString().padStart(2, "0");
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
  };

  // Launch track recording view
  const startTrackSession = (type: "Running" | "Walking" | "Cycling") => {
    setActiveActivity(type);
    setTrackingSecs(0);
    setDistanceAccum(0);
    setCaloriesAccum(0);
    setLaps([]);
    setTrackerTab("live");
    setIsTrackingRunning(true);
    toast.success(`Live GPS ${type} track recorder initialized! 🛰️`);
  };

  // Stop tracking and log to history and database
  const completeTrackSession = () => {
    setIsTrackingRunning(false);
    if (trackerIntervalRef.current) clearInterval(trackerIntervalRef.current);
    
    const finalDist = distanceAccum.toFixed(1);
    const finalDuration = formatSecs(trackingSecs);
    
    // Add exercise log directly to PulsePeak store history
    // Calorie coefficients: Running = 10 kcal/min, Walking = 5 kcal/min, Cycling = 8 kcal/min
    let kcalMinRate = 10;
    let exerciseIcon = "🏃";
    if (activeActivity === "Walking") {
      kcalMinRate = 5;
      exerciseIcon = "🚶";
    } else if (activeActivity === "Cycling") {
      kcalMinRate = 8;
      exerciseIcon = "🚴";
    }

    addExercise(
      {
        id: crypto.randomUUID(),
        name: `${activeActivity} Session (${finalDist} Km)`,
        kcalPerMin: kcalMinRate,
        icon: exerciseIcon,
        category: "Cardio",
        target: "Full Body",
        body_part: "Cardio",
        equipment: "body weight",
        instructions: {
          en: `Recorded live path: ${gpsAddress}. Complete session with total distance of ${finalDist} Km.`,
        },
      } as any,
      Math.ceil(trackingSecs / 60) || 1
    );

    // Save mock record in dashboard activities list history
    const newLog: ActivityLog = {
      id: crypto.randomUUID(),
      type: activeActivity,
      address: gpsAddress,
      distance: `${finalDist} Km`,
      duration: finalDuration,
      calories: caloriesAccum,
      date: "Today",
    };
    
    setActivityHistory((prev) => [newLog, ...prev]);
    toast.success(`Successfully saved your ${activeActivity} log: ${finalDist} Km! 🏆`);
    setTrackerTab("dashboard");
  };

  // Log a dynamic waypoint split/lap
  const recordSplitLap = () => {
    const newLap: LapSplit = {
      lap: laps.length + 1,
      time: formatSecs(trackingSecs),
      distance: `${distanceAccum.toFixed(2)} Km`,
      calories: caloriesAccum,
    };
    setLaps((prev) => [newLap, ...prev]);
    toast.info(`Lap ${newLap.lap} split saved: ${newLap.distance} at ${newLap.time}! 🏁`);
  };

  // Google Maps dynamic URL generator
  const mapIframeUrl = coords
    ? `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`
    : `https://maps.google.com/maps?q=Chester%20County,%20Easton,%20PA&z=16&output=embed`;

  return (
    <PhoneShell>
      {/* Visual Accent Tokens matching tracker screenshot */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .bg-tracker {
          background-color: #071329 !important;
        }
        .bg-tracker-card {
          background-color: #0d1f3d !important;
        }
        .border-tracker-cyan {
          border-color: #1e6df9 !important;
        }
        .text-tracker-cyan {
          color: #1e6df9 !important;
        }
        .bg-tracker-cyan {
          background-color: #1e6df9 !important;
        }
        .shadow-tracker {
          box-shadow: 0 0 16px rgba(30, 109, 249, 0.22) !important;
        }
        .animate-fade-in {
          animation: fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
        }}
      />

      <div className="flex-grow flex flex-col min-h-0 bg-[#071329] text-white relative font-sans">
        
        {/* ==============================================
            SCREEN 1: TRACKER WELCOME PAGE
            ============================================== */}
        {trackerTab === "welcome" && (
          <div 
            className="flex-grow flex flex-col justify-between p-6 relative overflow-hidden bg-cover bg-center animate-fade-in"
            style={{ 
              backgroundImage: `linear-gradient(to bottom, rgba(7, 19, 41, 0.15) 20%, rgba(7, 19, 41, 0.96) 80%), url('https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80')` 
            }}
          >
            {/* Header circles slider */}
            <div className="flex justify-center mt-6">
              <div className="flex gap-1.5 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                <span className="h-1.5 w-4 rounded-full bg-[#1e6df9]" />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
              </div>
            </div>

            {/* Runner Figure and Bottom Text Copy */}
            <div className="space-y-6 mb-8 text-center sm:text-left">
              <div className="space-y-2.5">
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-white uppercase italic">
                  Record Your Track
                </h1>
                <p className="text-[11px] text-zinc-400 max-w-[270px] mx-auto sm:mx-0 leading-relaxed">
                  Record and monitor your running tracks in an easy and organized way.
                </p>
              </div>

              {/* Get Started actions */}
              <button
                type="button"
                onClick={() => {
                  setTrackerTab("dashboard");
                  toast.success("GPS Track Dashboard ready!");
                }}
                className="w-full bg-[#1e6df9] hover:bg-[#1554c7] text-white py-4 rounded-3xl font-display font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-tracker cursor-pointer"
              >
                Get Started
              </button>
            </div>
          </div>
        )}

        {/* ==============================================
            SCREEN 2: TRACKER ACTIVITY DASHBOARD
            ============================================== */}
        {trackerTab === "dashboard" && (
          <div className="flex-grow flex flex-col min-h-0 bg-[#071329] overflow-y-auto pb-24 scrollbar-none animate-fade-in">
            {/* Profile Header */}
            <div className="px-5 pt-6 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Devon Lane avatar"
                  className="h-10 w-10 rounded-full border border-[#152e59] object-cover"
                />
                <div>
                  <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest leading-none">Good Morning,</p>
                  <p className="text-sm font-black text-white capitalize leading-tight mt-0.5">Devon Lane</p>
                </div>
              </div>
              <button 
                onClick={() => toast.info("Your GPS tracker alerts are completely synchronized! 🛰️")}
                className="h-9 w-9 rounded-full bg-[#0d1f3d] border border-[#152e59] flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <Bell className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Weather Block widget */}
            <div className="px-5 mt-2">
              <div className="rounded-3xl bg-[#0d1f3d] border border-[#152e59] p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#071329] flex items-center justify-center text-amber-400 border border-[#152e59]">
                    <Sun className="h-5 w-5 animate-spin" style={{ animationDuration: "12s" }} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-white">Partly Cloudy</p>
                    <p className="text-[8.5px] font-extrabold text-zinc-500 uppercase tracking-widest mt-0.5">Istanbul, Turkey</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black tracking-tight text-white">29°</span>
                  <span className="text-[10px] text-zinc-500 font-bold ml-1">/ 22°</span>
                </div>
              </div>
            </div>

            {/* Dynamic Map Card overlay display representing step counter */}
            <div className="px-5 mt-4">
              <div className="rounded-3xl border border-[#152e59] overflow-hidden relative shadow-lg h-56 bg-zinc-950/60">
                
                {/* Dynamic live map embed frame fallback */}
                <iframe
                  className="absolute inset-0 h-full w-full opacity-40 mix-blend-lighten pointer-events-none"
                  src={mapIframeUrl}
                  title="GPS Map preview"
                  allowFullScreen
                />
                
                {/* Total steps visual tag widgets overlay */}
                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 bg-[#071329]/95 backdrop-blur px-4 py-2.5 rounded-2xl border border-[#152e59]/80">
                      <span className="text-[8px] text-zinc-500 uppercase font-black tracking-widest block">Total Steps</span>
                      <span className="text-2xl font-black italic tracking-tighter text-white">4,134</span>
                    </div>

                    <button 
                      onClick={() => toast.success("Live GPS lookup tracking online!")}
                      className="h-8 w-8 rounded-full bg-[#1e6df9] text-white flex items-center justify-center shadow-tracker border border-[#1e6df9]/20"
                    >
                      <Navigation className="h-4 w-4 fill-white" />
                    </button>
                  </div>

                  {/* Active trackers indicators ring */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#e11d48]/10 border border-[#e11d48]/25 rounded-2xl py-1.5 px-1.5 flex items-center justify-center gap-1">
                      <Flame className="h-3 w-3 text-[#e11d48] fill-[#e11d48] shrink-0" />
                      <span className="text-[9.5px] font-black text-[#e11d48] uppercase tracking-wide">864 Cal</span>
                    </div>

                    <div className="bg-[#10b981]/10 border border-[#10b981]/25 rounded-2xl py-1.5 px-1.5 flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3 text-[#10b981] shrink-0" />
                      <span className="text-[9.5px] font-black text-[#10b981] uppercase tracking-wide">112 Km</span>
                    </div>

                    <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/25 rounded-2xl py-1.5 px-1.5 flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-[#f59e0b] shrink-0" />
                      <span className="text-[9.5px] font-black text-[#f59e0b] uppercase tracking-wide">454 Min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick launch recording actions selection */}
            <div className="px-5 mt-5 space-y-2">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Fast Track Launcher</h4>
              <div className="flex gap-2">
                {[
                  { type: "Running", icon: "🏃" },
                  { type: "Walking", icon: "🚶" },
                  { type: "Cycling", icon: "🚴" },
                ].map((act) => (
                  <button
                    key={act.type}
                    type="button"
                    onClick={() => startTrackSession(act.type as any)}
                    className="flex-1 bg-[#0d1f3d] hover:bg-[#112952] border border-[#152e59] py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <span>{act.icon}</span>
                    <span>{act.type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Activity log list section */}
            <div className="px-5 mt-6 space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#152e59] pb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Activity Logs</h3>
                <button
                  type="button"
                  onClick={() => toast.info("Displaying completed GPS activity logs!")}
                  className="text-[10px] font-bold text-[#1e6df9] uppercase hover:underline tracking-wider cursor-pointer"
                >
                  See All
                </button>
              </div>

              <div className="space-y-3">
                {activityHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => startTrackSession(item.type)}
                    className="bg-[#0d1f3d] border border-[#152e59] p-3 rounded-3xl flex items-center justify-between cursor-pointer hover:bg-[#112952] transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-[#071329] flex items-center justify-center border border-[#152e59] text-[#1e6df9]">
                        {item.type === "Walking" ? "🚶" : item.type === "Cycling" ? "🚴" : "🏃"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-black text-white group-hover:text-[#1e6df9] transition-colors">{item.type}</p>
                          <span className="text-[7.5px] text-zinc-500 font-extrabold uppercase bg-[#071329] px-1.5 py-0.5 rounded border border-[#152e59]">{item.date}</span>
                        </div>
                        <p className="text-[8.5px] font-extrabold text-zinc-500 mt-0.5 uppercase tracking-wide truncate max-w-[170px]">{item.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-[11px] font-black text-white">{item.distance}</p>
                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{item.duration} · {item.calories} Cal</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-[#1e6df9] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            SCREEN 3: LIVE GPS MAP RECORDING
            ============================================== */}
        {trackerTab === "live" && (
          <div className="flex-grow flex flex-col min-h-0 bg-[#071329] relative animate-fade-in">
            {/* Header Map Pin address block */}
            <div className="px-5 pt-6 pb-3 bg-[#0d1f3d]/90 backdrop-blur-md border-b border-[#152e59] flex items-center justify-between shrink-0 z-15">
              <button
                onClick={() => setTrackerTab("dashboard")}
                className="h-8 w-8 rounded-full bg-[#071329] border border-[#152e59] flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <Compass className="h-4.5 w-4.5 rotate-45" />
              </button>

              <div className="text-center space-y-0.5 max-w-[220px]">
                <p className="text-[10px] font-black text-white flex items-center gap-1 justify-center tracking-wide uppercase">
                  <MapPin className="h-3 w-3 text-red-500 fill-red-500 shrink-0" />
                  <span>Chester County</span>
                </p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest truncate">{gpsAddress}</p>
              </div>

              <div className="h-8 w-8 rounded-full bg-[#071329] border border-[#152e59] flex items-center justify-center text-zinc-400">
                <span className="text-[10px] font-black">{activeActivity[0]}</span>
              </div>
            </div>

            {/* Live Stats card widget display */}
            <div className="p-4 bg-[#0d1f3d]/95 border-b border-[#152e59] z-10 shrink-0 shadow-md">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <span className="text-[8.5px] uppercase font-black tracking-widest text-zinc-500">Distance</span>
                  <p className="text-base font-black italic text-white tracking-tight leading-none mt-0.5">
                    {distanceAccum.toFixed(2)} <span className="text-[9px] font-bold tracking-normal uppercase">Km</span>
                  </p>
                </div>

                <div className="space-y-1 border-x border-[#152e59]">
                  <span className="text-[8.5px] uppercase font-black tracking-widest text-zinc-500">Duration</span>
                  <p className="text-base font-black italic text-[#1e6df9] tracking-tight leading-none mt-0.5">
                    {formatSecs(trackingSecs)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[8.5px] uppercase font-black tracking-widest text-zinc-500">Calories</span>
                  <p className="text-base font-black italic text-white tracking-tight leading-none mt-0.5">
                    {caloriesAccum} <span className="text-[9px] font-bold tracking-normal uppercase">Cal</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Live Google Maps overlay panel */}
            <div className="flex-grow relative overflow-hidden bg-zinc-950">
              <iframe
                className="absolute inset-0 h-full w-full border-0 pointer-events-auto"
                src={mapIframeUrl}
                title="Google Maps Live GPS Track"
                allowFullScreen
              />

              {/* Waypoint Lap list overlays inside the Live Map screen */}
              {laps.length > 0 && (
                <div className="absolute left-4 top-4 bottom-4 w-44 rounded-2xl border border-[#152e59]/80 bg-[#071329]/95 backdrop-blur-md p-3 overflow-y-auto space-y-2 scrollbar-none z-15 shadow-lg">
                  <span className="text-[8px] uppercase tracking-widest font-black text-zinc-400 block border-b border-[#152e59]/40 pb-1 flex items-center gap-1">
                    <Flag className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
                    <span>LAPS Splits ({laps.length})</span>
                  </span>
                  
                  <div className="space-y-1.5">
                    {laps.map((lap) => (
                      <div key={lap.lap} className="text-[8.5px] leading-relaxed border-b border-[#152e59]/20 pb-1">
                        <div className="flex justify-between items-center text-zinc-400 font-extrabold">
                          <span>Lap {lap.lap}</span>
                          <span className="text-[#1e6df9]">{lap.time}</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                          <span>{lap.distance}</span>
                          <span>{lap.calories} Cal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active animated floating pointer overlay badge */}
              <div className="absolute right-4 bottom-4 bg-[#0d1f3d]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#152e59] text-[8.5px] font-black text-white uppercase tracking-wider flex items-center gap-1 z-10">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping mr-1" />
                <span>GPS Live tracking</span>
              </div>
            </div>

            {/* Bottom active tracking controls */}
            <div className="px-6 py-5 bg-[#0d1f3d] border-t border-[#152e59] flex justify-center items-center gap-6 shrink-0 z-15 shadow-lg">
              
              {/* Flag Lap recorder */}
              <button
                type="button"
                onClick={recordSplitLap}
                disabled={!isTrackingRunning}
                className={`h-11 w-11 rounded-full border flex items-center justify-center transition active:scale-95 cursor-pointer ${
                  isTrackingRunning
                    ? "bg-yellow-500/10 border-yellow-500/35 text-yellow-500 hover:bg-yellow-500/20"
                    : "bg-zinc-800 border-zinc-700 text-zinc-550 opacity-40 cursor-not-allowed"
                }`}
              >
                <Flag className="h-4.5 w-4.5 fill-current" />
              </button>

              {/* Play / Pause tracking */}
              <button
                type="button"
                onClick={() => {
                  setIsTrackingRunning(!isTrackingRunning);
                  toast.info(isTrackingRunning ? "GPS session paused!" : "GPS session resumed!");
                }}
                className="h-16 w-16 rounded-full bg-[#1e6df9] hover:bg-[#1554c7] text-white flex items-center justify-center shadow-tracker active:scale-95 transition cursor-pointer"
              >
                {isTrackingRunning ? (
                  <Pause className="h-6 w-6 stroke-[3.5px]" />
                ) : (
                  <Play className="h-6 w-6 fill-white ml-1 stroke-[3px]" />
                )}
              </button>

              {/* Stop completion action */}
              <button
                type="button"
                onClick={completeTrackSession}
                className="h-11 w-11 rounded-full bg-red-500/10 border border-red-500/35 text-red-500 hover:bg-red-500/20 flex items-center justify-center transition active:scale-95 cursor-pointer"
              >
                <Square className="h-4 w-4 fill-red-500 text-red-500" />
              </button>

            </div>
          </div>
        )}

      </div>
    </PhoneShell>
  );
}
export default TrackerPage;
