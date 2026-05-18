// Sample data for PulsePeak MVP (no backend yet)
export type Food = {
  id: string;
  name: string;
  brand?: string;
  serving: string;
  kcal: number;
  protein: number;
  carbs: number;
  fats: number;
  verified?: boolean;
};

export const FOODS: Food[] = [
  { id: "1", name: "Greek Yogurt", brand: "Fage", serving: "170g", kcal: 100, protein: 18, carbs: 6, fats: 0, verified: true },
  { id: "2", name: "Oatmeal", brand: "Quaker", serving: "40g dry", kcal: 150, protein: 5, carbs: 27, fats: 3, verified: true },
  { id: "3", name: "Banana", serving: "1 medium", kcal: 105, protein: 1.3, carbs: 27, fats: 0.4 },
  { id: "4", name: "Grilled Chicken Breast", serving: "150g", kcal: 248, protein: 46, carbs: 0, fats: 5, verified: true },
  { id: "5", name: "Brown Rice", serving: "1 cup cooked", kcal: 216, protein: 5, carbs: 45, fats: 1.8 },
  { id: "6", name: "Avocado", serving: "1/2 fruit", kcal: 160, protein: 2, carbs: 9, fats: 15 },
  { id: "7", name: "Salmon Fillet", serving: "150g", kcal: 280, protein: 39, carbs: 0, fats: 13, verified: true },
  { id: "8", name: "Almonds", serving: "30g", kcal: 174, protein: 6, carbs: 6, fats: 15 },
  { id: "9", name: "Whole Wheat Bread", serving: "2 slices", kcal: 160, protein: 8, carbs: 28, fats: 2 },
  { id: "10", name: "Eggs", serving: "2 large", kcal: 156, protein: 13, carbs: 1, fats: 11 },
  { id: "11", name: "Sweet Potato", serving: "150g baked", kcal: 130, protein: 2, carbs: 30, fats: 0.2 },
  { id: "12", name: "Protein Shake", brand: "Whey Gold", serving: "1 scoop", kcal: 120, protein: 24, carbs: 3, fats: 1, verified: true },
  { id: "13", name: "Spinach", serving: "100g", kcal: 23, protein: 3, carbs: 4, fats: 0.4 },
  { id: "14", name: "Olive Oil", serving: "1 tbsp", kcal: 119, protein: 0, carbs: 0, fats: 13.5 },
  { id: "15", name: "Apple", serving: "1 medium", kcal: 95, protein: 0.5, carbs: 25, fats: 0.3 },
  { id: "16", name: "Grilled Chicken Salad", brand: "Recipe", serving: "1 bowl", kcal: 350, protein: 35, carbs: 12, fats: 14, verified: true },
  { id: "17", name: "Berry Protein Smoothie", brand: "Recipe", serving: "1 glass", kcal: 280, protein: 25, carbs: 32, fats: 4, verified: true },
  { id: "18", name: "Quinoa Buddha Bowl", brand: "Recipe", serving: "1 bowl", kcal: 420, protein: 16, carbs: 58, fats: 14, verified: true },
  { id: "19", name: "Salmon Avocado Toast", brand: "Recipe", serving: "2 slices", kcal: 380, protein: 22, carbs: 28, fats: 18, verified: true },
  { id: "20", name: "Lentil Soup", brand: "Recipe", serving: "1 bowl", kcal: 220, protein: 14, carbs: 38, fats: 2 },
  { id: "21", name: "Tofu Stir Fry", brand: "Recipe", serving: "1 plate", kcal: 310, protein: 19, carbs: 22, fats: 16, verified: true },
  { id: "22", name: "Chia Seed Pudding", brand: "Recipe", serving: "1 cup", kcal: 190, protein: 6, carbs: 20, fats: 9 },
  { id: "23", name: "Cottage Cheese & Berries", serving: "1 cup", kcal: 180, protein: 24, carbs: 14, fats: 3, verified: true },
  { id: "24", name: "Sweet Potato Fries", serving: "100g", kcal: 160, protein: 2, carbs: 34, fats: 4 },
  { id: "25", name: "Veggie Omelette", brand: "Recipe", serving: "3 eggs", kcal: 260, protein: 20, carbs: 4, fats: 18, verified: true },
  { id: "26", name: "Almond Butter Rice Cakes", serving: "2 cakes", kcal: 190, protein: 5, carbs: 22, fats: 9 },
  { id: "27", name: "Turkey & Cheese Wrap", brand: "Recipe", serving: "1 wrap", kcal: 320, protein: 28, carbs: 26, fats: 11, verified: true },
  { id: "28", name: "Peanut Butter Banana Toast", brand: "Recipe", serving: "1 slice", kcal: 250, protein: 8, carbs: 34, fats: 10 },
  { id: "29", name: "Matcha Latte", serving: "1 cup", kcal: 110, protein: 4, carbs: 12, fats: 3 },
  { id: "30", name: "Dark Chocolate", serving: "25g", kcal: 150, protein: 2, carbs: 13, fats: 11, verified: true },
];

export type Exercise = { id: string; name: string; kcalPerMin: number; icon: string };
export const EXERCISES: Exercise[] = [
  { id: "e1", name: "Walking", kcalPerMin: 4, icon: "🚶" },
  { id: "e2", name: "Running", kcalPerMin: 11, icon: "🏃" },
  { id: "e3", name: "Cycling", kcalPerMin: 8, icon: "🚴" },
  { id: "e4", name: "Weight Lifting", kcalPerMin: 6, icon: "🏋️" },
  { id: "e5", name: "Yoga", kcalPerMin: 3, icon: "🧘" },
  { id: "e6", name: "Swimming", kcalPerMin: 10, icon: "🏊" },
  { id: "e7", name: "HIIT", kcalPerMin: 13, icon: "⚡" },
  { id: "e8", name: "Hiking", kcalPerMin: 7, icon: "🥾" },
];

export const WEIGHT_HISTORY: { day: string; weight: number }[] = [];

export function getWeightHistory() {
  if (typeof window === "undefined") return [];
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userKey = currentUser.email ? `pulsepeak_weight_${currentUser.email}` : "pulsepeak_weight_history";
    const raw = localStorage.getItem(userKey);
    if (raw) return JSON.parse(raw);
    // If no history exists, initialize with their current profile weight
    if (currentUser.profile?.weightKg) {
      const todayStr = new Date().toLocaleDateString("en-US", { weekday: "short" });
      const initial = [{ day: todayStr, weight: currentUser.profile.weightKg }];
      localStorage.setItem(userKey, JSON.stringify(initial));
      return initial;
    }
  } catch {}
  return [];
}

export function saveWeightHistory(newWeight: number) {
  if (typeof window === "undefined") return;
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userKey = currentUser.email ? `pulsepeak_weight_${currentUser.email}` : "pulsepeak_weight_history";
    let current = getWeightHistory();
    const todayStr = new Date().toLocaleDateString("en-US", { weekday: "short" });
    if (current.length === 0) {
      current = [{ day: todayStr, weight: newWeight }];
    } else if (current[current.length - 1].day === todayStr) {
      current[current.length - 1].weight = newWeight;
    } else {
      current.push({ day: todayStr, weight: newWeight });
    }
    localStorage.setItem(userKey, JSON.stringify(current));
  } catch {}
}

export const CALORIE_HISTORY: { day: string; eaten: number; burned: number }[] = [];

export function getCalorieHistory(currentEaten?: number, currentBurned?: number) {
  if (typeof window === "undefined") return [];
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userKey = currentUser.email ? `pulsepeak_calorie_${currentUser.email}` : "pulsepeak_calorie_history";
    const raw = localStorage.getItem(userKey);
    let history = raw ? JSON.parse(raw) : [];
    const todayStr = new Date().toLocaleDateString("en-US", { weekday: "short" });
    if (currentEaten !== undefined && currentBurned !== undefined) {
      if (history.length === 0) {
        history = [{ day: todayStr, eaten: currentEaten, burned: currentBurned }];
      } else if (history[history.length - 1].day === todayStr) {
        history[history.length - 1] = { day: todayStr, eaten: currentEaten, burned: currentBurned };
      } else { history.push({ day: todayStr, eaten: currentEaten, burned: currentBurned }); }
      localStorage.setItem(userKey, JSON.stringify(history));
    }
    return history;
  } catch {}
  return [];
}

// BMR (Mifflin-St Jeor)
export function calcBMR(weight: number, height: number, age: number, gender: "male" | "female") {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(base + (gender === "male" ? 5 : -161));
}
export function calcTDEE(bmr: number, activity: number) { return Math.round(bmr * activity); }
export function goalAdjust(tdee: number, goal: "lose" | "maintain" | "gain") {
  if (goal === "lose") return tdee - 500;
  if (goal === "gain") return tdee + 350;
  return tdee;
}
