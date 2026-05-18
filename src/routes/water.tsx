import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Droplet, Plus, RotateCcw, Calendar, CheckCircle2, Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";
import { clsx } from "clsx";

export const Route = createFileRoute("/water")({
  head: () => ({ meta: [{ title: "Water Tracker — PulsePeak" }] }),
  component: WaterTracker,
});

type HistoryEntry = { date: string; current: number; goal: number };

// Remove fake data as requested by user
const INITIAL_HISTORY: HistoryEntry[] = [];

function WaterTracker() {
  const { state, addWater, resetWater } = useStore();
  const { profile, waterMl } = state;
  const [customMl, setCustomMl] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>(INITIAL_HISTORY);
  const [selectedDate, setSelectedDate] = useState("");

  const todayStr = new Date().toISOString().split('T')[0];

  // Load history from localStorage
  useEffect(() => {
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userKey = currentUser.email ? `pulsepeak_water_${currentUser.email}` : "pulsepeak_water_history";
      const raw = localStorage.getItem(userKey);
      if (raw) {
        setHistory(JSON.parse(raw));
      } else {
        localStorage.setItem(userKey, JSON.stringify(INITIAL_HISTORY));
      }
    } catch {}
  }, []);

  // Sync today's water to history
  const handleAdd = (amount: number) => {
    addWater(amount);
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userKey = currentUser.email ? `pulsepeak_water_${currentUser.email}` : "pulsepeak_water_history";
      const newTotal = waterMl + amount;
      let currentHistory = [...history];
      const existingIdx = currentHistory.findIndex(h => h.date === todayStr);
      if (existingIdx >= 0) {
        currentHistory[existingIdx] = { ...currentHistory[existingIdx], current: newTotal };
      } else {
        currentHistory.unshift({ date: todayStr, current: newTotal, goal: profile.waterGoalMl });
      }
      setHistory(currentHistory);
      localStorage.setItem(userKey, JSON.stringify(currentHistory));
    } catch {}
  };

  const handleReset = () => {
    resetWater();
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userKey = currentUser.email ? `pulsepeak_water_${currentUser.email}` : "pulsepeak_water_history";
      let currentHistory = [...history];
      const existingIdx = currentHistory.findIndex(h => h.date === todayStr);
      if (existingIdx >= 0) {
        currentHistory[existingIdx] = { ...currentHistory[existingIdx], current: 0 };
        setHistory(currentHistory);
        localStorage.setItem(userKey, JSON.stringify(currentHistory));
      }
    } catch {}
  };

  const pct = Math.min(100, Math.max(0, (waterMl / profile.waterGoalMl) * 100));

  const displayHistory = selectedDate 
    ? history.filter(h => h.date === selectedDate)
    : history.filter(h => h.date !== todayStr); // Today is shown separately at the top when no date is filtered

  return (
    <PhoneShell>
      <ScreenHeader
        title="Water Tracker"
        subtitle="Daily Hydration"
        action={
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/30 transition"
            title="Reset today's water"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        }
      />

      {/* Main Animated Droplet Display */}
      <div className="mx-5 my-6 flex flex-col items-center justify-center rounded-3xl border border-border bg-gradient-card p-8 shadow-card relative overflow-hidden">
        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="relative flex h-52 w-52 items-center justify-center rounded-full border-4 border-cyan-500/20 bg-card shadow-inner overflow-hidden">
          {/* Animated Water Wave */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-400 opacity-85"
            initial={{ height: 0 }}
            animate={{ height: `${pct}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            {/* Wave effect overlay */}
            <motion.div
              className="absolute -top-3 left-0 right-0 h-6 bg-cyan-300/30 rounded-[50%]"
              animate={{
                scaleX: [1, 1.08, 1],
                scaleY: [1, 1.15, 1],
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
          </motion.div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <Droplet className="h-8 w-8 text-cyan-400 mb-1 animate-bounce" style={{ animationDuration: "2.5s" }} />
            <p className="font-display text-4xl font-bold tracking-tight text-foreground drop-shadow">
              {(waterMl / 1000).toFixed(1)}
              <span className="text-xl font-semibold text-muted-foreground">L</span>
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Goal: {(profile.waterGoalMl / 1000).toFixed(1)}L
            </p>
          </div>
        </div>

        <div className={clsx(
          "mt-6 flex items-center gap-2 rounded-2xl px-4 py-2 border text-xs font-semibold transition-all",
          pct >= 100 
            ? "bg-success/15 border-success/30 text-success" 
            : "bg-destructive/15 border-destructive/30 text-destructive"
        )}>
          <Sparkles className="h-4 w-4" />
          <span>{pct >= 100 ? "Amazing! Daily hydration goal reached! 🎉" : `Completed: ${Math.round(pct)}% (${profile.waterGoalMl - waterMl}ml left)`}</span>
        </div>
      </div>

      {/* Quick Add Buttons */}
      <div className="mx-5 mt-2">
        <p className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Quick Add</p>
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { label: "+250ml", val: 250, icon: "🥛" },
            { label: "+500ml", val: 500, icon: "🫙" },
            { label: "+750ml", val: 750, icon: "💧" },
            { label: "+1000ml", val: 1000, icon: "🚰" },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => handleAdd(item.val)}
              className="flex flex-col items-center justify-center rounded-2xl border border-border bg-gradient-card p-3.5 shadow-sm hover:border-cyan-500/50 hover:bg-cyan-500/5 active:scale-95 transition group"
            >
              <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="font-display text-xs font-bold text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Add */}
      <div className="mx-5 mt-4 rounded-3xl border border-border bg-gradient-card p-4 shadow-card">
        <p className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Custom Amount</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="number"
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              placeholder="Enter amount in ml..."
              className="w-full rounded-2xl border border-border bg-card py-3.5 pl-4 pr-12 font-display text-sm outline-none focus:border-cyan-500 shadow-sm"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">ml</span>
          </div>
          <button
            onClick={() => {
              const amt = Number(customMl);
              if (amt > 0) {
                handleAdd(amt);
                setCustomMl("");
              }
            }}
            disabled={!customMl || Number(customMl) <= 0}
            className="flex items-center gap-1.5 rounded-2xl bg-cyan-500 px-5 py-3.5 font-display text-sm font-semibold text-white shadow-md hover:bg-cyan-600 active:scale-95 disabled:opacity-50 transition"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>

      {/* Daily History Log */}
      <div className="mx-5 mt-6 pb-20">
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">Drinking History Log</span>
          <div className="relative flex items-center gap-2">
            <label htmlFor="history-date" className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-cyan-500 hover:opacity-80 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-xl transition shadow-sm">
              <Calendar className="h-4 w-4 text-cyan-500" />
              <span>{selectedDate ? selectedDate : "Filter Date"}</span>
            </label>
            <input
              id="history-date"
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value <= todayStr) {
                  setSelectedDate(e.target.value);
                } else {
                  alert("Future dates cannot be selected for drinking history.");
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {selectedDate && (
              <button onClick={() => setSelectedDate("")} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-0.5 bg-muted px-2 py-1.5 rounded-xl transition">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2.5">
          {/* Today's live log (Shown when no specific date is filtered, or if today is selected) */}
          {(!selectedDate || selectedDate === todayStr) && (
            <div className="flex items-center justify-between rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-500 font-bold text-base shadow-inner">
                  {pct >= 100 ? <CheckCircle2 className="h-5 w-5 text-cyan-500" /> : "💧"}
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-foreground">Today ({todayStr})</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Target: {(profile.waterGoalMl / 1000).toFixed(1)}L</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-base font-bold text-foreground">{(waterMl / 1000).toFixed(1)}L</p>
                <p className="text-[10px] text-cyan-500 font-semibold uppercase tracking-wider mt-0.5">
                  {pct >= 100 ? "Goal Reached" : `${Math.round(pct)}% Completed`}
                </p>
              </div>
            </div>
          )}

          {/* Past days / Filtered result */}
          {displayHistory.map((h, idx) => {
            const hPct = Math.min(100, (h.current / h.goal) * 100);
            return (
              <div key={idx} className="flex items-center justify-between rounded-2xl border border-border bg-gradient-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground font-bold text-base">
                    {hPct >= 100 ? <CheckCircle2 className="h-5 w-5 text-success" /> : "💧"}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold text-foreground">{h.date}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Target: {(h.goal / 1000).toFixed(1)}L</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-bold text-foreground">{(h.current / 1000).toFixed(1)}L</p>
                  <p className={hPct >= 100 ? "text-[10px] text-success font-semibold uppercase tracking-wider mt-0.5" : "text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5"}>
                    {hPct >= 100 ? "Goal Reached" : `${Math.round(hPct)}% Completed`}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Empty state when filtering a date with no records */}
          {selectedDate && selectedDate !== todayStr && displayHistory.length === 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground font-bold text-base">
                  💧
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">{selectedDate}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Target: {(profile.waterGoalMl / 1000).toFixed(1)}L</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-base font-bold text-foreground">0.0L</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                  0% Completed (No log)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}
