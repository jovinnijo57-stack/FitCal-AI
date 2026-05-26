export interface Ingredient {
  id: string; // ID matching a store product (for cart integration)
  name: string; // Ingredient name
  qty: number; // Quantity required
  unit?: string; // Unit like g, ml, pcs
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  time: string;
  serves: number;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  image: string;
  ingredients: Ingredient[];
  instructions: string[];
  is_custom?: boolean;
  user_id?: string;
}

export interface MealPlan {
  id: string;
  recipeId: string;
  plannedDate: string; // YYYY-MM-DD
  recipeDetails: Recipe;
}
