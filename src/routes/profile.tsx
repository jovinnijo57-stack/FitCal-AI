import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { useStore } from "@/lib/store";
import { ChevronRight, Moon, Sun, Bell, LogOut, Crown, Shield, BarChart3, Sparkles, Edit3 } from "lucide-react";
import { useState, useEffect } from "react";
import { saveWeightHistory } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — PulsePeak" }] }),
  component: Profile,
});

function Profile() {
  const { state, setProfile, toggleTheme } = useStore();
  const nav = useNavigate();
  const { profile } = state;

  const [userMeta, setUserMeta] = useState({ email: "", name: profile.name || "User", phone: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: profile.name || "User",
    phone: "",
    age: profile.age || 28,
    heightCm: profile.heightCm || 178,
    weightKg: profile.weightKg || 77,
    diet: profile.diet || "Omnivore",
    workoutType: profile.workoutType || "Strength training",
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || profile.name || "User";
        const phone = data.user.user_metadata?.phone || profile.phone || "";
        setUserMeta({ email: data.user.email || "", name, phone });
        setEditForm(prev => ({ 
          ...prev, 
          name, 
          phone,
          age: profile.age || prev.age,
          heightCm: profile.heightCm || prev.heightCm,
          weightKg: profile.weightKg || prev.weightKg,
          diet: profile.diet || prev.diet,
          workoutType: profile.workoutType || prev.workoutType,
        }));
      }
    });
  }, [profile]);

  const handleSave = async () => {
    let userId = "";
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        userId = userData.user.id;
        // 1. Upsert/Update profiles table first and await it
        await supabase.from("profiles").upsert({
          id: userId,
          name: editForm.name,
          phone: editForm.phone,
          age: Number(editForm.age),
          weight_kg: Number(editForm.weightKg),
          height_cm: Number(editForm.heightCm),
          diet: editForm.diet,
          workout_type: editForm.workoutType,
          calorie_goal: profile.calorieGoal,
          water_goal_ml: profile.waterGoalMl,
          protein_goal: profile.proteinGoal,
          carbs_goal: profile.carbsGoal,
          fats_goal: profile.fatsGoal,
          goal: profile.goal,
        });
      }

      // 2. Sync local state first so in-memory state is updated
      const updatedProfile = {
        ...profile,
        name: editForm.name,
        age: Number(editForm.age),
        heightCm: Number(editForm.heightCm),
        weightKg: Number(editForm.weightKg),
        diet: editForm.diet,
        workoutType: editForm.workoutType,
      };
      setProfile(updatedProfile as any);
      saveWeightHistory(Number(editForm.weightKg), profile.email || userMeta.email, userId);
      setUserMeta(prev => ({ ...prev, name: editForm.name, phone: editForm.phone }));

      // 3. Then update user auth metadata (which triggers USER_UPDATED and store reloading in background)
      await supabase.auth.updateUser({
        data: { full_name: editForm.name, phone: editForm.phone }
      });
    } catch (err) {
      console.error(err);
    }

    setIsEditing(false);
  };

  const handleSignOut = async () => {
    // Clear user data from local storage on sign out
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id || "guest";
      localStorage.removeItem(`nexgro_meal_plans_${userId}`);
      localStorage.removeItem(`nexgro_custom_recipes_${userId}`);
      localStorage.removeItem(`nexgro_grocery_cart_${userId}`);
      localStorage.removeItem(`pulsepeak_weight_${profile.email || "default"}`);
      localStorage.removeItem(`pulsepeak_calorie_${profile.email || "default"}`);
    } catch {}
    
    await supabase.auth.signOut();
    nav({ to: "/" });
  };

  if (isEditing) {
    return (
      <PhoneShell>
        <ScreenHeader title="Edit Profile" subtitle="Update your registered details" />
        <div className="mx-5 mt-4 space-y-4 pb-20 animate-in fade-in duration-300">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</span>
            <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full rounded-2xl border border-border bg-card p-4 font-display text-base outline-none focus:border-primary shadow-sm" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</span>
            <input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full rounded-2xl border border-border bg-card p-4 font-display text-base outline-none focus:border-primary shadow-sm" />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Age (yrs)</span>
              <input type="number" value={editForm.age} onChange={(e) => setEditForm({...editForm, age: +e.target.value})} className="w-full rounded-2xl border border-border bg-card p-4 font-display text-base outline-none focus:border-primary text-center shadow-sm" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Height (cm)</span>
              <input type="number" value={editForm.heightCm} onChange={(e) => setEditForm({...editForm, heightCm: +e.target.value})} className="w-full rounded-2xl border border-border bg-card p-4 font-display text-base outline-none focus:border-primary text-center shadow-sm" />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weight (kg)</span>
              <input type="number" value={editForm.weightKg} onChange={(e) => setEditForm({...editForm, weightKg: +e.target.value})} className="w-full rounded-2xl border border-border bg-card p-4 font-display text-base outline-none focus:border-primary text-center shadow-sm" />
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setIsEditing(false)} className="flex-1 rounded-2xl border border-border bg-card py-4 font-display font-medium active:scale-[0.98] transition">Cancel</button>
            <button onClick={handleSave} className="flex-[2] rounded-2xl bg-gradient-hero py-4 font-display font-semibold text-primary-foreground shadow-glow active:scale-[0.98] transition">Save Changes</button>
          </div>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <ScreenHeader
        title="Profile"
        subtitle="Settings & preferences"
        action={
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-semibold shadow-sm hover:bg-muted/50 transition">
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </button>
        }
      />

      <div className="mx-5 flex items-center gap-4 rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-glow relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gold/20 blur-2xl" />
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15 font-display text-2xl font-bold backdrop-blur shadow-inner">
          {userMeta.name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold">{userMeta.name}</p>
          <p className="text-xs text-primary-foreground/80 mt-0.5">{userMeta.email || "user@example.com"}</p>
          {userMeta.phone && <p className="text-xs text-primary-foreground/70 mt-0.5">{userMeta.phone}</p>}
          <p className="text-xs text-gold font-medium mt-1">{profile.weightKg}kg · {profile.heightCm}cm</p>
        </div>
      </div>

      <Link to="/onboarding" className="mx-5 mt-4 flex items-center gap-3 rounded-3xl bg-gradient-gold p-4 text-gold-foreground shadow-card">
        <Crown className="h-5 w-5" />
        <div className="flex-1">
          <p className="font-display font-bold">Upgrade to Premium</p>
          <p className="text-xs opacity-80">AI coaching, advanced analytics & more</p>
        </div>
        <ChevronRight className="h-4 w-4" />
      </Link>

      <div className="mx-5 mt-4 grid grid-cols-3 gap-3 text-center">
        {[
          { l: "Calories", v: profile.calorieGoal },
          { l: "Protein", v: `${profile.proteinGoal}g` },
          { l: "Water", v: `${profile.waterGoalMl / 1000}L` },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-gradient-card p-3 shadow-card">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</p>
            <p className="mt-1 font-display text-lg font-bold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <Row icon={<Sparkles className="h-4 w-4" />} label="AI nutrition coach" to="/ai" />
        <Row icon={<BarChart3 className="h-4 w-4" />} label="Progress & reports" to="/progress" />
        <Row icon={<Bell className="h-4 w-4 text-primary" />} label="Reminders" />
        <Row icon={state.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 text-primary" />} label={`Switch to ${state.theme === "dark" ? "light" : "dark"} mode`} onClick={toggleTheme} />
      </div>

      <button onClick={handleSignOut} className="mx-5 mt-4 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 py-3.5 text-sm font-semibold text-destructive mb-10">
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </PhoneShell>
  );
}

function Row({ icon, label, to, onClick }: { icon: React.ReactNode; label: string; to?: string; onClick?: () => void }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-primary">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
  if (to) return <Link to={to as never} className="block border-b border-border last:border-0">{inner}</Link>;
  return <button onClick={onClick} className="block w-full border-b border-border text-left last:border-0">{inner}</button>;
}
