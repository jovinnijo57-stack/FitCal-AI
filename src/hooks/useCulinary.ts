import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Recipe, MealPlan } from "@/types";
import { DEFAULT_RECIPES } from "@/lib/recipeData";
import { toast } from "sonner";

export function useRecipes() {
  return useQuery<Recipe[]>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase.from("recipes").select("*");
      if (user) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.is("user_id", null);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
        
      if (error) {
        console.error("Failed to fetch recipes from Supabase:", error);
      }
      
      const dbRecipes = data || [];
      const parsedDbRecipes = dbRecipes.map((r: any) => ({
        ...r,
        ingredients: typeof r.ingredients === "string" ? JSON.parse(r.ingredients) : r.ingredients,
      }));
      
      // Guest mode or empty database: merge local DEFAULT_RECIPES
      const dbIds = new Set(parsedDbRecipes.map((r: any) => r.id));
      const localRecipes = user 
        ? DEFAULT_RECIPES 
        : [...DEFAULT_RECIPES, ...(JSON.parse(localStorage.getItem("guest_custom_recipes") || "[]"))];
        
      const merged = [
        ...parsedDbRecipes,
        ...localRecipes.filter(r => !dbIds.has(r.id))
      ];
      
      return merged as Recipe[];
    }
  });
}

export function useMealPlans() {
  return useQuery<MealPlan[]>({
    queryKey: ["meal-plans"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Guest mode fallback
        const guestPlans = JSON.parse(localStorage.getItem("guest_meal_plans") || "[]");
        const guestCustom = JSON.parse(localStorage.getItem("guest_custom_recipes") || "[]");
        const allRecipes = [...DEFAULT_RECIPES, ...guestCustom];
        
        return guestPlans.map((item: any) => {
          const recipe = allRecipes.find(r => r.id === item.recipeId);
          return {
            id: item.id,
            recipeId: item.recipeId,
            plannedDate: item.plannedDate,
            recipeDetails: recipe as Recipe,
          };
        }).filter((item: any) => !!item.recipeDetails);
      }

      const { data, error } = await supabase.from("meal_plans").select(`
        id,
        recipe_id,
        planned_date,
        recipes (*)
      `);
      if (error) throw error;
      
      return (data || []).map((item: any) => {
        let recipeDetails = item.recipes;
        if (recipeDetails) {
          recipeDetails = {
            ...recipeDetails,
            ingredients: typeof recipeDetails.ingredients === "string" 
              ? JSON.parse(recipeDetails.ingredients) 
              : recipeDetails.ingredients
          };
        } else {
          recipeDetails = DEFAULT_RECIPES.find(r => r.id === item.recipe_id);
        }
        
        return {
          id: item.id,
          recipeId: item.recipe_id,
          plannedDate: item.planned_date,
          recipeDetails: recipeDetails as Recipe,
        };
      }).filter((item: any) => !!item.recipeDetails);
    }
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (newRecipe: Omit<Recipe, "id">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Guest mode fallback
        const guestRecipes = localStorage.getItem("guest_custom_recipes") || "[]";
        const parsed = JSON.parse(guestRecipes);
        const created = { 
          ...newRecipe, 
          id: crypto.randomUUID(), 
          is_custom: true 
        };
        parsed.push(created);
        localStorage.setItem("guest_custom_recipes", JSON.stringify(parsed));
        return created;
      }

      const { data, error } = await supabase.from("recipes").insert({ 
        title: newRecipe.title,
        category: newRecipe.category,
        time: newRecipe.time,
        serves: Number(newRecipe.serves),
        calories: newRecipe.calories,
        protein: newRecipe.protein,
        fat: newRecipe.fat,
        carbs: newRecipe.carbs,
        image: newRecipe.image || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60",
        ingredients: newRecipe.ingredients,
        instructions: newRecipe.instructions,
        is_custom: true, 
        user_id: user?.id 
      }).select().single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("New recipe saved successfully! 👨‍🍳");
    }
  });
}

export function useAddMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipeId, dateStr }: { recipeId: string; dateStr: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Guest mode fallback
        const guestPlans = localStorage.getItem("guest_meal_plans") || "[]";
        const parsed = JSON.parse(guestPlans);
        const created = { id: crypto.randomUUID(), recipeId, plannedDate: dateStr };
        parsed.push(created);
        localStorage.setItem("guest_meal_plans", JSON.stringify(parsed));
        return created;
      }
      
      // Auto-copy default local recipe to user's recipes table if not already saved
      if (recipeId.startsWith("00000000-")) {
        const { data: existing } = await supabase.from("recipes").select("id").eq("id", recipeId).maybeSingle();
        if (!existing) {
          const localRecipe = DEFAULT_RECIPES.find(r => r.id === recipeId);
          if (localRecipe) {
            await supabase.from("recipes").insert({
              id: recipeId,
              title: localRecipe.title,
              category: localRecipe.category,
              time: localRecipe.time,
              serves: localRecipe.serves,
              calories: localRecipe.calories,
              protein: localRecipe.protein,
              fat: localRecipe.fat,
              carbs: localRecipe.carbs,
              image: localRecipe.image,
              ingredients: localRecipe.ingredients,
              instructions: localRecipe.instructions,
              is_custom: true,
              user_id: user.id
            });
          }
        }
      }
      
      const { data, error } = await supabase.from("meal_plans").insert({ 
        user_id: user.id, 
        recipe_id: recipeId, 
        planned_date: dateStr 
      }).select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["meal-plans"] });
      toast.success(`Recipe added for ${variables.dateStr}! 📅`);
    }
  });
}

export function useDeleteMealPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const guestPlans = JSON.parse(localStorage.getItem("guest_meal_plans") || "[]");
        const filtered = guestPlans.filter((p: any) => p.id !== planId);
        localStorage.setItem("guest_meal_plans", JSON.stringify(filtered));
        return;
      }

      const { error } = await supabase.from("meal_plans").delete().eq("id", planId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-plans"] });
      toast.success("Meal removed from schedule.");
    }
  });
}
