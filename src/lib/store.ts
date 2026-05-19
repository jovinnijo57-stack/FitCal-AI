// Lightweight global store using React context + localStorage persistence + Supabase PostgreSQL sync.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createElement } from "react";
import type { Food, Exercise } from "./mock-data";
import { supabase } from "./supabase";

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
export type MealEntry = { id: string; meal: MealType; food: Food; servings: number };
export type ExerciseEntry = { id: string; exercise: Exercise; minutes: number; kcal: number };

export type Profile = {
  email?: string;
  phone?: string;
  name: string;
  age: number;
  gender: "male" | "female";
  heightCm: number;
  weightKg: number;
  goal: "lose" | "maintain" | "gain";
  activity: number; // 1.2-1.9
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
  waterGoalMl: number;
  aiPlan?: any;
};

type State = {
  profile: Profile;
  meals: MealEntry[];
  exercises: ExerciseEntry[];
  waterMl: number;
  theme: "light" | "dark";
};

const defaultState: State = {
  profile: {
    email: "",
    phone: "",
    name: "",
    age: 28,
    gender: "male",
    heightCm: 178,
    weightKg: 0,
    goal: "lose",
    activity: 1.55,
    calorieGoal: 0,
    proteinGoal: 150,
    carbsGoal: 220,
    fatsGoal: 70,
    waterGoalMl: 2500,
  },
  meals: [],
  exercises: [],
  waterMl: 0,
  theme: "light",
};

type Ctx = {
  state: State;
  setProfile: (p: Partial<Profile>) => void;
  addMeal: (meal: MealType, food: Food, servings: number) => void;
  removeMeal: (id: string) => void;
  addExercise: (ex: Exercise, minutes: number) => void;
  removeExercise: (id: string) => void;
  addWater: (ml: number) => void;
  resetWater: () => void;
  toggleTheme: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

const KEY = "fitcal-ai-state-v1";

async function getUserId() {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Immediately reset state to defaultState (preserving theme) to prevent previous user data from showing
      setState(prev => ({ ...defaultState, theme: prev.theme }));

      try {
        let loaded = { ...defaultState };
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || null;
        if (userId) {
          // Fetch Profile
          const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single();
          if (profileData) {
            loaded.profile = {
              ...loaded.profile,
              email: profileData.email || authData?.user?.email || "",
              phone: profileData.phone || authData?.user?.user_metadata?.phone || "",
              name: profileData.name || authData?.user?.user_metadata?.full_name || "PulsePeak User",
              goal: profileData.goal || loaded.profile.goal,
              calorieGoal: profileData.calorie_goal || loaded.profile.calorieGoal,
              waterGoalMl: profileData.water_goal_ml || loaded.profile.waterGoalMl,
              proteinGoal: profileData.protein_goal || loaded.profile.proteinGoal,
              carbsGoal: profileData.carbs_goal || loaded.profile.carbsGoal,
              fatsGoal: profileData.fats_goal || loaded.profile.fatsGoal,
              weightKg: profileData.weight_kg || loaded.profile.weightKg,
              heightCm: profileData.height_cm || loaded.profile.heightCm,
              aiPlan: profileData.ai_plan || loaded.profile.aiPlan,
            };
          } else {
            loaded.profile.email = authData?.user?.email || "";
            loaded.profile.phone = authData?.user?.user_metadata?.phone || "";
            loaded.profile.name = authData?.user?.user_metadata?.full_name || "New User";
          }

          // Fetch Meals for today
          const todayStr = new Date().toISOString().split('T')[0];
          const { data: mealsData } = await supabase.from("meal_logs").select("*").eq("user_id", userId).eq("logged_date", todayStr);
          if (mealsData && mealsData.length > 0) {
            loaded.meals = mealsData.map((m: any) => ({
              id: m.id,
              meal: m.meal_type as MealType,
              food: {
                id: m.id,
                name: m.food_name,
                brand: m.brand,
                serving: m.serving,
                kcal: m.kcal,
                protein: Number(m.protein),
                carbs: Number(m.carbs),
                fats: Number(m.fats),
              },
              servings: Number(m.servings),
            }));
          }

          // Fetch Exercises for today
          const { data: exData } = await supabase.from("exercise_logs").select("*").eq("user_id", userId).eq("logged_date", todayStr);
          if (exData && exData.length > 0) {
            loaded.exercises = exData.map((e: any) => ({
              id: e.id,
              exercise: { id: e.id, name: e.exercise_name, kcalPerMin: Math.round(e.calories_burned / e.duration_minutes), icon: "⚡" },
              minutes: e.duration_minutes,
              kcal: e.calories_burned,
            }));
          }

          // Fetch Water for today
          const { data: waterData } = await supabase.from("water_logs").select("*").eq("user_id", userId).eq("logged_date", todayStr).single();
          if (waterData) {
            loaded.waterMl = waterData.amount_ml;
          }
        }

        setState(loaded);
      } catch {}
      setReady(true);
    }
    loadData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        loadData();
      } else if (event === "SIGNED_OUT") {
        setState(defaultState);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", state.theme === "dark");
    }
  }, [state, ready]);

  const api: Ctx = {
    state,
    setProfile: (p) => setState((s) => {
      const updatedProfile = { ...s.profile, ...p };
      try {
        // Sync with Supabase
        getUserId().then(userId => {
          if (userId) {
            supabase.from("profiles").upsert({
              id: userId,
              name: updatedProfile.name,
              phone: updatedProfile.phone,
              goal: updatedProfile.goal,
              calorie_goal: updatedProfile.calorieGoal,
              water_goal_ml: updatedProfile.waterGoalMl,
              protein_goal: updatedProfile.proteinGoal,
              carbs_goal: updatedProfile.carbsGoal,
              fats_goal: updatedProfile.fatsGoal,
              weight_kg: updatedProfile.weightKg,
              height_cm: updatedProfile.heightCm,
              ai_plan: updatedProfile.aiPlan,
            }).then();
          }
        });
      } catch {}
      return { ...s, profile: updatedProfile };
    }),
    addMeal: (meal, food, servings) => {
      const id = crypto.randomUUID();
      getUserId().then(userId => {
        if (userId) {
          supabase.from("meal_logs").insert({
            id,
            user_id: userId,
            meal_type: meal,
            food_name: food.name,
            brand: food.brand || "",
            serving: food.serving,
            servings,
            kcal: Math.round(food.kcal * servings),
            protein: food.protein * servings,
            carbs: food.carbs * servings,
            fats: food.fats * servings,
            logged_date: new Date().toISOString().split('T')[0],
          }).then();
        }
      });
      setState((s) => ({ ...s, meals: [...s.meals, { id, meal, food, servings }] }));
    },
    removeMeal: (id) => {
      supabase.from("meal_logs").delete().eq("id", id).then();
      setState((s) => ({ ...s, meals: s.meals.filter((m) => m.id !== id) }));
    },
    addExercise: (exercise, minutes) => {
      const id = crypto.randomUUID();
      const kcal = Math.round(exercise.kcalPerMin * minutes);
      getUserId().then(userId => {
        if (userId) {
          supabase.from("exercise_logs").insert({
            id,
            user_id: userId,
            exercise_name: exercise.name,
            duration_minutes: minutes,
            calories_burned: kcal,
            logged_date: new Date().toISOString().split('T')[0],
          }).then();
        }
      });
      setState((s) => ({
        ...s,
        exercises: [...s.exercises, { id, exercise, minutes, kcal }],
      }));
    },
    removeExercise: (id) => {
      supabase.from("exercise_logs").delete().eq("id", id).then();
      setState((s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== id) }));
    },
    addWater: (ml) => setState((s) => {
      const newTotal = Math.max(0, s.waterMl + ml);
      getUserId().then(userId => {
        if (userId) {
          const todayStr = new Date().toISOString().split('T')[0];
          supabase.from("water_logs").upsert({
            user_id: userId,
            amount_ml: newTotal,
            logged_date: todayStr,
          }, { onConflict: "user_id,logged_date" }).then();
        }
      });
      return { ...s, waterMl: newTotal };
    }),
    resetWater: () => setState((s) => {
      getUserId().then(userId => {
        if (userId) {
          const todayStr = new Date().toISOString().split('T')[0];
          supabase.from("water_logs").upsert({
            user_id: userId,
            amount_ml: 0,
            logged_date: todayStr,
          }, { onConflict: "user_id,logged_date" }).then();
        }
      });
      return { ...s, waterMl: 0 };
    }),
    toggleTheme: () => setState((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })),
  };

  return createElement(StoreCtx.Provider, { value: api }, children);
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useTotals() {
  const { state } = useStore();
  const eaten = state.meals.reduce(
    (acc, m) => {
      acc.kcal += m.food.kcal * m.servings;
      acc.protein += m.food.protein * m.servings;
      acc.carbs += m.food.carbs * m.servings;
      acc.fats += m.food.fats * m.servings;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fats: 0 },
  );
  const burned = state.exercises.reduce((a, e) => a + e.kcal, 0);
  return {
    eaten: { kcal: Math.round(eaten.kcal), protein: Math.round(eaten.protein), carbs: Math.round(eaten.carbs), fats: Math.round(eaten.fats) },
    burned,
    net: Math.round(eaten.kcal - burned),
    remaining: Math.round(state.profile.calorieGoal - eaten.kcal + burned),
  };
}
