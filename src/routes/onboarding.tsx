import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useStore, type Profile } from "@/lib/store";
import { calcBMR, calcTDEE, goalAdjust } from "@/lib/mock-data";
import { Sparkles, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

function Onboarding() {
  const { setProfile } = useStore();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [data, setData] = useState<any>({
    gender: "male", age: 28, heightCm: 178, weightKg: 77, goal: "lose", activity: 1.55,
    diet: "Omnivore", workoutType: "Strength training", sleepHours: 8, waterGoalL: 3, targetWeightKg: 70
  });

  // Phone number modal state for Google login users
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    async function checkExistingProfile() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id;
        if (userId) {
          const { data: profileData } = await supabase.from("profiles").select("calorie_goal, phone").eq("id", userId).single();
          if (profileData && profileData.calorie_goal) {
            nav({ to: "/dashboard" });
            return;
          }
          // Check if they logged in via Google and need phone
          const isGoogle = authData.user?.app_metadata?.provider === 'google' || authData.user?.app_metadata?.providers?.includes('google');
          if (isGoogle) {
            const metaPhone = authData.user?.user_metadata?.phone;
            if (!metaPhone && (!profileData || !profileData.phone)) {
              setShowPhonePopup(true);
            }
          }
        }
      } catch {}
    }
    checkExistingProfile();
  }, [nav]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.length < 10) {
      setPhoneError("Please enter a valid 10-digit phone number.");
      return;
    }
    setSavingPhone(true);
    setPhoneError("");
    const fullPhone = `${countryCode} ${phoneInput}`;
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        await supabase.auth.updateUser({
          data: { phone: fullPhone }
        });
        await supabase.from("profiles").update({
          phone: fullPhone
        }).eq("id", authData.user.id);
        
        setProfile({ phone: fullPhone });
      }
      setShowPhonePopup(false);
    } catch (err: any) {
      setPhoneError(err.message || "Failed to save phone number.");
    } finally {
      setSavingPhone(false);
    }
  };

  const totalSteps = 7;

  const finish = async () => {
    setAnalyzing(true);
    const bmr = calcBMR(data.weightKg!, data.heightCm!, data.age!, data.gender!);
    const tdee = calcTDEE(bmr, data.activity!);
    const calorieGoal = goalAdjust(tdee, data.goal!);

    const prompt = `As an elite AI Nutrition & Fitness Coach, analyze the following user profile and provide a customized 3-point plan.
User Profile:
- Age: ${data.age}, Gender: ${data.gender}, Height: ${data.heightCm}cm, Current Weight: ${data.weightKg}kg, Target Weight: ${data.targetWeightKg}kg
- Primary Goal: ${data.goal}, Activity Level: ${data.activity}
- Diet Preference: ${data.diet}, Workout Style: ${data.workoutType}
- Daily Sleep Goal: ${data.sleepHours} hours, Daily Water Goal: ${data.waterGoalL}L
- Calculated TDEE: ${tdee} kcal, Recommended Daily Calorie Target: ${calorieGoal} kcal

Provide a JSON response with exactly this structure:
{
  "summary": "A motivating 2-sentence overview of their fitness journey.",
  "nutritionStrategy": "Specific dietary advice based on their diet preference.",
  "workoutRecommendation": "Specific weekly workout routine tailored to their workout style.",
  "dailyMilestones": ["Milestone 1", "Milestone 2", "Milestone 3"]
}`;

    let aiPlan = {
      summary: `Awesome job taking the first step! Based on your goal to ${data.goal} weight with a ${data.diet} diet and ${data.workoutType}, we've crafted your perfect macro split.`,
      nutritionStrategy: `Focus on high-quality protein sources and maintain a daily intake around ${calorieGoal} kcal to hit your ${data.targetWeightKg}kg goal sustainably.`,
      workoutRecommendation: `Incorporate 3-4 sessions of ${data.workoutType} per week, ensuring you get ${data.sleepHours} hours of sleep for optimal recovery.`,
      dailyMilestones: [`Drink ${data.waterGoalL}L of water`, `Hit ${calorieGoal} kcal target`, `Get ${data.sleepHours}h of quality sleep`]
    };

    try {
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;

      if (geminiKey) {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        const json = await res.json();
        const text = json.candidates[0].content.parts[0].text;
        aiPlan = JSON.parse(text);
      } else if (groqKey) {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
          })
        });
        const json = await res.json();
        aiPlan = JSON.parse(json.choices[0].message.content);
      }
    } catch (err) {
      console.error("AI onboarding analysis fallback to default plan:", err);
    }

    const updatedProfile: Partial<Profile> = {
      ...data,
      calorieGoal,
      proteinGoal: Math.round((calorieGoal * 0.3) / 4),
      carbsGoal: Math.round((calorieGoal * 0.4) / 4),
      fatsGoal: Math.round((calorieGoal * 0.3) / 9),
      waterGoalMl: data.waterGoalL * 1000,
      aiPlan,
    };
    setProfile(updatedProfile as any);

    // Save to Supabase profiles table
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (userId) {
        await supabase.from("profiles").upsert({
          id: userId,
          email: authData.user?.email,
          name: authData.user?.user_metadata?.full_name || "PulsePeak User",
          phone: authData.user?.user_metadata?.phone || "",
          goal: data.goal,
          calorie_goal: calorieGoal,
          water_goal_ml: data.waterGoalL * 1000,
          protein_goal: Math.round((calorieGoal * 0.3) / 4),
          carbs_goal: Math.round((calorieGoal * 0.4) / 4),
          fats_goal: Math.round((calorieGoal * 0.3) / 9),
          weight_kg: data.weightKg,
          ai_plan: aiPlan,
        });
      }
    } catch (err) { console.error("Supabase profile save error:", err); }

    setAnalyzing(false);
    nav({ to: "/dashboard" });
  };

  return (
    <div className="min-h-dvh bg-background relative">
      {showPhonePopup && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gradient-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-glow flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-sm">
              <Phone className="h-8 w-8" />
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground text-center">Complete Your Profile</h3>
            <p className="text-sm text-muted-foreground mt-2 text-center">As a Google login user, please enter your phone number before setting up your personalized AI plan.</p>
            
            <form onSubmit={handleSavePhone} className="w-full mt-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-card/80 backdrop-blur-md px-3 py-3.5 transition-all focus-within:ring-2 focus-within:ring-primary/50">
                  <Phone className="h-4 w-4 ml-1 text-muted-foreground" />
                  <select 
                    value={countryCode} 
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent text-sm outline-none appearance-none pr-2 font-medium"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+1">🇨🇦 +1</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+27">🇿🇦 +27</option>
                  </select>
                  <div className="h-4 w-px bg-border" />
                  <input 
                    type="tel" 
                    value={phoneInput} 
                    onChange={(e) => { setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneError(""); }} 
                    placeholder="Phone number" 
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" 
                    required 
                  />
                </div>
                {phoneError && <p className="mt-1.5 text-xs font-medium text-destructive px-1 animate-in slide-in-from-top-1">{phoneError}</p>}
              </div>

              <button 
                type="submit" 
                disabled={savingPhone || phoneInput.length < 10}
                className="w-full rounded-2xl bg-gradient-hero py-4 font-display text-base font-semibold text-primary-foreground shadow-glow transition active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                {savingPhone ? "Saving..." : "Save Phone Number"}
              </button>
            </form>
          </div>
        </div>
      )}

      {analyzing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gradient-card border border-border rounded-3xl p-8 max-w-sm w-full text-center shadow-glow flex flex-col items-center animate-in zoom-in-95 duration-300">
            <div className="relative h-20 w-20 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gold/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-gold border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-gold">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
            </div>
            <h3 className="font-display text-2xl font-bold bg-gradient-to-r from-gold to-primary-foreground bg-clip-text text-transparent">AI Coach Analyzing...</h3>
            <p className="text-sm text-muted-foreground mt-3">Synthesizing your goals, dietary preferences, and habits into a personalized master plan.</p>
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-md px-6 pt-8 pb-32">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="mt-10">
          {step === 0 && (
            <Step title="What's your goal?" subtitle="We'll tailor your plan.">
              <div className="space-y-2">
                {([
                  { v: "lose", t: "Lose weight", d: "Calorie deficit & sustainable cut" },
                  { v: "maintain", t: "Maintain weight", d: "Stay where you are" },
                  { v: "gain", t: "Build muscle", d: "Lean surplus + protein focus" },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setData({ ...data, goal: o.v })}
                    className={`w-full rounded-2xl border p-4 text-left transition ${data.goal === o.v ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border bg-card"}`}
                  >
                    <div className="font-display font-semibold">{o.t}</div>
                    <div className="text-xs text-muted-foreground">{o.d}</div>
                  </button>
                ))}
              </div>
            </Step>
          )}
          {step === 1 && (
            <Step title="Tell us about you" subtitle="Used for BMR calculations.">
              <div className="grid grid-cols-2 gap-2">
                {(["male", "female"] as const).map((g) => (
                  <button key={g} onClick={() => setData({ ...data, gender: g })}
                    className={`rounded-2xl border py-4 font-display font-medium capitalize ${data.gender === g ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border bg-card"}`}>
                    {g}
                  </button>
                ))}
              </div>
              <NumberField label="Age" value={data.age!} onChange={(v) => setData({ ...data, age: v })} suffix="yrs" />
            </Step>
          )}
          {step === 2 && (
            <Step title="Body metrics" subtitle="Be honest — we won't judge.">
              <NumberField label="Height" value={data.heightCm!} onChange={(v) => setData({ ...data, heightCm: v })} suffix="cm" />
              <NumberField label="Weight" value={data.weightKg!} onChange={(v) => setData({ ...data, weightKg: v })} suffix="kg" />
            </Step>
          )}
          {step === 3 && (
            <Step title="Activity level" subtitle="How active are you weekly?">
              <div className="space-y-2">
                {([
                  { v: 1.2, t: "Sedentary", d: "Desk job, little exercise" },
                  { v: 1.375, t: "Lightly active", d: "1-3 workouts / week" },
                  { v: 1.55, t: "Moderately active", d: "3-5 workouts / week" },
                  { v: 1.725, t: "Very active", d: "6-7 workouts / week" },
                ] as const).map((o) => (
                  <button key={o.v} onClick={() => setData({ ...data, activity: o.v })}
                    className={`w-full rounded-2xl border p-4 text-left ${data.activity === o.v ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border bg-card"}`}>
                    <div className="font-display font-semibold">{o.t}</div>
                    <div className="text-xs text-muted-foreground">{o.d}</div>
                  </button>
                ))}
              </div>
            </Step>
          )}
          {step === 4 && (
            <Step title="Dietary Preference" subtitle="How do you prefer to eat?">
              <div className="space-y-2">
                {([
                  { v: "Omnivore", t: "Omnivore", d: "Eat everything (Meat, Veggies, Dairy)" },
                  { v: "Vegetarian", t: "Vegetarian", d: "Plant-based + Dairy & Eggs" },
                  { v: "Vegan", t: "Vegan", d: "100% Plant-based only" },
                  { v: "Keto", t: "Keto", d: "Very low carb, high fat" },
                  { v: "Paleo", t: "Paleo", d: "Whole foods, no grains/dairy" },
                ] as const).map((o) => (
                  <button key={o.v} onClick={() => setData({ ...data, diet: o.v })}
                    className={`w-full rounded-2xl border p-4 text-left ${data.diet === o.v ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border bg-card"}`}>
                    <div className="font-display font-semibold">{o.t}</div>
                    <div className="text-xs text-muted-foreground">{o.d}</div>
                  </button>
                ))}
              </div>
            </Step>
          )}
          {step === 5 && (
            <Step title="Workout Style" subtitle="What is your primary training type?">
              <div className="space-y-2">
                {([
                  { v: "Strength training", t: "Strength Training", d: "Lifting weights, bodybuilding, powerlifting" },
                  { v: "Cardio & Running", t: "Cardio & Running", d: "Running, cycling, swimming, HIIT" },
                  { v: "Yoga & Pilates", t: "Yoga & Pilates", d: "Flexibility, core strength, low impact" },
                  { v: "Mixed & Calisthenics", t: "Mixed & Calisthenics", d: "Bodyweight mastery + cross-training" },
                  { v: "None", t: "None", d: "Focusing purely on diet for now" },
                ] as const).map((o) => (
                  <button key={o.v} onClick={() => setData({ ...data, workoutType: o.v })}
                    className={`w-full rounded-2xl border p-4 text-left ${data.workoutType === o.v ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border bg-card"}`}>
                    <div className="font-display font-semibold">{o.t}</div>
                    <div className="text-xs text-muted-foreground">{o.d}</div>
                  </button>
                ))}
              </div>
            </Step>
          )}
          {step === 6 && (
            <Step title="Daily Targets & Habits" subtitle="Setting your lifestyle benchmarks.">
              <div className="space-y-4">
                <NumberField label="Target Weight" value={data.targetWeightKg!} onChange={(v) => setData({ ...data, targetWeightKg: v })} suffix="kg" />
                <NumberField label="Sleep Goal" value={data.sleepHours!} onChange={(v) => setData({ ...data, sleepHours: v })} suffix="hrs" />
                <NumberField label="Water Goal" value={data.waterGoalL!} onChange={(v) => setData({ ...data, waterGoalL: v })} suffix="L" />
              </div>
            </Step>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md gap-3 px-6 pb-8 pt-4 bg-background/80 backdrop-blur-md border-t border-border/40">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 rounded-2xl border border-border bg-card py-4 font-display font-medium active:scale-[0.98] transition">
              Back
            </button>
          )}
          <button
            onClick={() => (step === totalSteps - 1 ? finish() : setStep(step + 1))}
            className="flex-[2] rounded-2xl bg-gradient-hero py-4 font-display font-semibold text-primary-foreground shadow-glow active:scale-[0.98] transition"
          >
            {step === totalSteps - 1 ? "Analyze with AI Coach" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-6 space-y-3">{children}</div>
    </div>
  );
}

function NumberField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (v: number) => void; suffix: string }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="flex items-baseline gap-1">
        <input type="number" value={value} onChange={(e) => onChange(+e.target.value)} className="w-20 bg-transparent text-right font-display text-xl font-semibold outline-none" />
        <span className="text-sm text-muted-foreground">{suffix}</span>
      </span>
    </label>
  );
}
