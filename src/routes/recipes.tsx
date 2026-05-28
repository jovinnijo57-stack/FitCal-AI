import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import {
  Plus,
  Calendar,
  Search,
  Mic,
  MicOff,
  Clock,
  Sparkles,
  Trash2,
  X,
  ChevronRight,
  ShoppingCart,
  Info,
  Flame,
  ChevronLeft,
  Image,
  SlidersHorizontal,
  Copy,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  useRecipes,
  useMealPlans,
  useCreateRecipe,
  useAddMealPlan,
  useDeleteMealPlan,
} from "@/hooks/useCulinary";
import { supabase } from "@/lib/supabase";
import { STATIC_AI_ANALYSIS } from "@/lib/recipeData";
import type { Recipe, Ingredient } from "@/types";
import { z } from "zod";

const recipesSearchSchema = z.object({
  tab: z.enum(["corner", "planner"]).optional(),
});

export const Route = createFileRoute("/recipes")({
  validateSearch: (search) => recipesSearchSchema.parse(search),
  head: () => ({ meta: [{ title: "Meal Planner & Chef's Corner — PulsePeak" }] }),
  component: RecipesPage,
});

function RecipesPage() {
  const qc = useQueryClient();
  const { data: recipes = [], isLoading: loadingRecipes } = useRecipes();
  const { data: mealPlans = [], isLoading: loadingMealPlans } = useMealPlans();

  const createRecipeMutation = useCreateRecipe();
  const addMealPlanMutation = useAddMealPlan();
  const deleteMealPlanMutation = useDeleteMealPlan();

  const search = Route.useSearch();
  const searchTab = search.tab || "corner";

  // Tab State
  const [activeTab, setActiveTabState] = useState<"corner" | "planner">(searchTab);

  // Sync activeTab with URL tab parameter
  useEffect(() => {
    setActiveTabState(searchTab);
  }, [searchTab]);

  const navigate = Route.useNavigate();
  const setActiveTab = (newTab: "corner" | "planner") => {
    navigate({ search: { tab: newTab } });
    setActiveTabState(newTab);
  };

  const [selectedCategory, setSelectedCategory] = useState("All");

  // Search & Voice Recognition & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [maxCaloriesFilter, setMaxCaloriesFilter] = useState<number | null>(null);
  const [maxTimeFilter, setMaxTimeFilter] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected date for planner
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Repeat recipes list to ensure marquee is sufficiently populated for smooth infinite scroll on mobile
  const marqueeRecipes =
    recipes.length > 0
      ? Array.from({ length: Math.ceil(12 / recipes.length) }, () => recipes)
          .flat()
          .slice(0, 12)
      : [];

  // Modals state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [showScheduleDropdownId, setShowScheduleDropdownId] = useState<string | null>(null);

  // AI analysis state for the detail modal
  const [analyzingRecipeId, setAnalyzingRecipeId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [expandedIngredient, setExpandedIngredient] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [customYtQuery, setCustomYtQuery] = useState("");
  const [searchingCustomYt, setSearchingCustomYt] = useState(false);

  // New premium AI features state variables
  const [portionsMultiplier, setPortionsMultiplier] = useState(1);
  const [kitchenTimerSecs, setKitchenTimerSecs] = useState<number | null>(null);
  const [kitchenTimerRunning, setKitchenTimerRunning] = useState(false);
  const [substituteIngName, setSubstituteIngName] = useState<string | null>(null);
  const [showSubstituteBox, setShowSubstituteBox] = useState(false);
  const kitchenIntervalRef = useRef<any>(null);

  // Prep Timer Countdown useEffect (Ticking Interval Only)
  useEffect(() => {
    let intervalId: any = null;
    if (kitchenTimerRunning && kitchenTimerSecs !== null && kitchenTimerSecs > 0) {
      intervalId = setInterval(() => {
        setKitchenTimerSecs((prev) => {
          if (prev === null || prev <= 1) {
            return 0; // Trigger completion effect cleanly
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [kitchenTimerRunning]);

  // Clean Side Effects on Timer Completion
  useEffect(() => {
    if (kitchenTimerSecs === 0) {
      setKitchenTimerRunning(false);
      setKitchenTimerSecs(null);

      // Trigger Audio synthesizer tone
      try {
        if (typeof window !== "undefined") {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const audioCtx = new AudioCtx();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = "sine";
            osc.frequency.value = 880; // A5 tone
            gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.6);
          }
        }
      } catch (err) {
        console.error("Audio context complete synthesis failed:", err);
      }

      // Trigger Sonner Toast
      toast.success("⏰ Cooking step complete! Chef's Timer is finished!");
    }
  }, [kitchenTimerSecs]);


  useEffect(() => {
    setCheckedSteps({});
    setExpandedIngredient(null);
    setActiveVideoId(null);
    setCustomYtQuery("");
    setPortionsMultiplier(1);
    setKitchenTimerSecs(null);
    setKitchenTimerRunning(false);
    setSubstituteIngName(null);
    setShowSubstituteBox(false);
  }, [selectedRecipe]);

  // Copy & Clear Planner Day States
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyTargetDate, setCopyTargetDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0],
  );
  const [isClearingDay, setIsClearingDay] = useState(false);
  const [isCopyingDay, setIsCopyingDay] = useState(false);

  // Marquee controls
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const [showNameOnlyId, setShowNameOnlyId] = useState<string | null>(null);

  // Form state for creating custom recipe
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Breakfast");
  const [newTime, setNewTime] = useState("20 min");
  const [newServes, setNewServes] = useState(2);
  const [newCalories, setNewCalories] = useState("250 kcal");
  const [newProtein, setNewProtein] = useState("10g");
  const [newFat, setNewFat] = useState("8g");
  const [newCarbs, setNewCarbs] = useState("30g");
  const [newImage, setNewImage] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ id: "1", name: "", qty: 100 }]);
  const [instructions, setInstructions] = useState<string[]>([""]);

  // Calculate Monday - Sunday for the selected date's week
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  useEffect(() => {
    const parts = selectedDate.split("-");
    if (parts.length !== 3) return;
    const current = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10),
    );
    const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday
    // Calculate Monday
    const monday = new Date(current);
    const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    monday.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    setWeekDays(days);
  }, [selectedDate]);

  // Voice Search initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setSearchQuery(transcript);
        toast.success(`Voice search: "${transcript}"`);
      };
      recognitionRef.current = rec;
    }
  }, []);

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported on this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Filter Recipes
  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      r.category.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory === "Indian Favorites" && r.category.toLowerCase() === "indian") ||
      (selectedCategory === "Global Favorites" && !["indian"].includes(r.category.toLowerCase()));

    let matchesCalories = true;
    if (maxCaloriesFilter !== null) {
      const kcal = parseInt(r.calories) || 0;
      matchesCalories = kcal <= maxCaloriesFilter;
    }

    let matchesTime = true;
    if (maxTimeFilter !== null) {
      const mins = parseInt(r.time) || 0;
      matchesTime = mins <= maxTimeFilter;
    }

    return matchesSearch && matchesCategory && matchesCalories && matchesTime;
  });

  // Helper for meal plan filtering
  const dailyPlans = mealPlans.filter((p) => p.plannedDate === selectedDate);

  // Calculate total macros for the selected date
  const totalMacros = dailyPlans.reduce(
    (acc, plan) => {
      const r = plan.recipeDetails;
      if (!r) return acc;
      const cal = parseInt(r.calories) || 0;
      const prot = parseInt(r.protein) || 0;
      const fat = parseInt(r.fat) || 0;
      const carbs = parseInt(r.carbs) || 0;

      return {
        calories: acc.calories + cal,
        protein: acc.protein + prot,
        fat: acc.fat + fat,
        carbs: acc.carbs + carbs,
      };
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 },
  );

  // Form Ingredient helpers
  const addIngredientField = () => {
    setIngredients([...ingredients, { id: Date.now().toString(), name: "", qty: 100 }]);
  };
  const removeIngredientField = (idx: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== idx));
    }
  };
  const updateIngredientField = (idx: number, field: keyof Ingredient, val: any) => {
    const copy = [...ingredients];
    copy[idx] = { ...copy[idx], [field]: val };
    setIngredients(copy);
  };

  // Form Instruction helpers
  const addInstructionField = () => {
    setInstructions([...instructions, ""]);
  };
  const removeInstructionField = (idx: number) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== idx));
    }
  };
  const updateInstructionField = (idx: number, val: string) => {
    const copy = [...instructions];
    copy[idx] = val;
    setInstructions(copy);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Create Recipe Handler
  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a recipe title.");
      return;
    }

    const filteredIngredients = ingredients.filter((i) => i.name.trim() !== "");
    const filteredInstructions = instructions.filter((i) => i.trim() !== "");

    await createRecipeMutation.mutateAsync({
      title: newTitle,
      category: newCategory,
      time: newTime,
      serves: newServes,
      calories: newCalories,
      protein: newProtein,
      fat: newFat,
      carbs: newCarbs,
      image:
        newImage ||
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60",
      ingredients: filteredIngredients.map((i) => ({ ...i, unit: i.unit || "g" })),
      instructions: filteredInstructions,
    });

    // Reset Form
    setNewTitle("");
    setNewCategory("Breakfast");
    setNewTime("20 min");
    setNewServes(2);
    setNewCalories("250 kcal");
    setNewProtein("10g");
    setNewFat("8g");
    setNewCarbs("30g");
    setNewImage("");
    setIngredients([{ id: "1", name: "", qty: 100 }]);
    setInstructions([""]);
    setShowAddRecipeModal(false);
  };

  // Cart Integrator Logic
  const addRecipeIngredientsToCart = (recipe: Recipe) => {
    const cart = JSON.parse(localStorage.getItem("pulsepeak_cart") || "[]");
    recipe.ingredients.forEach((ing) => {
      const existing = cart.find((item: any) => item.name.toLowerCase() === ing.name.toLowerCase());
      if (existing) {
        existing.qty += ing.qty;
      } else {
        cart.push({ ...ing, id: ing.id || crypto.randomUUID() });
      }
    });
    localStorage.setItem("pulsepeak_cart", JSON.stringify(cart));
    toast.success(
      `Added ${recipe.ingredients.length} ingredients from "${recipe.title}" to cart! 🛒`,
    );
  };

  const addAllPlannedToCart = () => {
    if (dailyPlans.length === 0) {
      toast.error("No recipes scheduled for today to add to cart.");
      return;
    }
    const cart = JSON.parse(localStorage.getItem("pulsepeak_cart") || "[]");
    let totalAdded = 0;
    dailyPlans.forEach((plan) => {
      plan.recipeDetails.ingredients.forEach((ing) => {
        const existing = cart.find(
          (item: any) => item.name.toLowerCase() === ing.name.toLowerCase(),
        );
        if (existing) {
          existing.qty += ing.qty;
        } else {
          cart.push({ ...ing, id: ing.id || crypto.randomUUID() });
        }
        totalAdded++;
      });
    });
    localStorage.setItem("pulsepeak_cart", JSON.stringify(cart));
    toast.success(`Successfully added all planned ingredients (${totalAdded} items) to cart! 🛒`);
  };

  // Clear Day Feature
  const handleClearDay = async () => {
    if (dailyPlans.length === 0) {
      toast.error("No recipes to clear for today.");
      return;
    }
    setIsClearingDay(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Guest mode
        const guestPlans = JSON.parse(localStorage.getItem("guest_meal_plans") || "[]");
        const filtered = guestPlans.filter((p: any) => p.plannedDate !== selectedDate);
        localStorage.setItem("guest_meal_plans", JSON.stringify(filtered));
      } else {
        // Authenticated user
        const { error } = await supabase
          .from("meal_plans")
          .delete()
          .eq("planned_date", selectedDate)
          .eq("user_id", user.id);
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["meal-plans"] });
      toast.success("Successfully cleared all recipes for this day! 🧹");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to clear schedule: " + err.message);
    } finally {
      setIsClearingDay(false);
    }
  };

  // Copy Day Feature
  const handleCopyDay = async () => {
    if (dailyPlans.length === 0) {
      toast.error("No recipes scheduled today to copy.");
      return;
    }
    if (!copyTargetDate) {
      toast.error("Please select a target date.");
      return;
    }
    setIsCopyingDay(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // Guest mode
        const guestPlans = JSON.parse(localStorage.getItem("guest_meal_plans") || "[]");
        const newPlans = dailyPlans.map((p: any) => ({
          id: crypto.randomUUID(),
          recipeId: p.recipeId,
          plannedDate: copyTargetDate,
        }));
        localStorage.setItem("guest_meal_plans", JSON.stringify([...guestPlans, ...newPlans]));
      } else {
        // Authenticated user: bulk copy
        const plansToCopy = dailyPlans.map((p) => ({
          user_id: user.id,
          recipe_id: p.recipeId,
          planned_date: copyTargetDate,
        }));
        const { error } = await supabase.from("meal_plans").insert(plansToCopy);
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["meal-plans"] });
      toast.success(`Successfully copied ${dailyPlans.length} meal(s) to ${copyTargetDate}! 📋`);
      setShowCopyModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to copy schedule: " + err.message);
    } finally {
      setIsCopyingDay(false);
    }
  };

  // Gemini + Groq + YouTube Cooking Analysis Call
  const handleAiAnalysis = async (recipe: Recipe) => {
    setAnalyzingRecipeId(recipe.id);
    setAiAnalysis(null);

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    const youtubeKey = import.meta.env.VITE_YOUTUBE_API_KEY;

    // Default static mapping of YouTube videos for high quality demo
    const YOUTUBE_CATALOG: Record<string, string> = {
      "1": "f6n0eS89g-A", // Mango Lassi
      "2": "a03U45jFxOI", // Butter Chicken
      "3": "K6c7tJqH5w8", // Garlic Butter Paneer
      "4": "m115p-2900g",
    };

    let videoId = YOUTUBE_CATALOG[recipe.id] || "";

    // 1. If no keys are configured, fallback to rich mock data
    if (!geminiKey && !groqKey) {
      const mockResult = {
        water: "2 cups",
        time: recipe.time,
        difficulty: "Easy",
        youtubeVideoId: videoId || "f6n0eS89g-A",
        steps: recipe.instructions.map((step, idx) => {
          if (idx === 0 && recipe.ingredients[0]) {
            return `Measure out ${recipe.ingredients[0].qty}g of ${recipe.ingredients[0].name} carefully.`;
          }
          return step;
        }),
        ingredients: recipe.ingredients.map((ing) => ({
          name: ing.name,
          benefit: "High in nutrients and essential macros that support physical energy and focus.",
          shopping_tip: "Choose fresh, organic options with bright coloring and zero blemishes.",
          culinary_secret: "Sauté gently on medium heat to seal in natural moisture and oils.",
        })),
      };
      setAiAnalysis(mockResult);
      setAnalyzingRecipeId(null);
      toast.info("Using fallback smart analysis with mock insights.");
      return;
    }

    try {
      // 2. Gemini Primary Culinary Analysis
      let geminiData = {
        water: "2 cups",
        time: recipe.time,
        difficulty: "Medium",
        youtube_query: `how to cook ${recipe.title}`,
        steps: recipe.instructions,
      };

      if (geminiKey) {
        const geminiPrompt = `Analyze this recipe: "${recipe.title}". 
Ingredients provided: ${JSON.stringify(recipe.ingredients)}.
Please provide a professional culinary analysis:
1. Estimated water needed for cooking (e.g., "2 cups", "500ml", "None").
2. Total cooking time (e.g., "35 minutes").
3. Difficulty level ("Easy", "Medium", "Hard").
4. A highly optimized YouTube search phrase to find the cooking video of this recipe.
5. 4-6 concise, step-by-step cooking instructions. IMPORTANT: Include the specific quantities of ingredients in the steps (e.g., "Add 200g of Paneer...").
Return ONLY a valid JSON object with these exact keys: "water", "time", "difficulty", "youtube_query", "steps" (an array of strings).`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: geminiPrompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          },
        );

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
          geminiData = JSON.parse(cleanJson);
        }
      }

      // 3. Groq Ingredient Deep Dive Analysis
      let groqIngredients = recipe.ingredients.map((ing) => ({
        name: ing.name,
        benefit: "Rich in vital macros that fuel physical performance and cognitive focus.",
        shopping_tip: "Select raw, unrefined options to ensure maximum nutritional preservation.",
        culinary_secret: "Avoid overcooking to preserve flavor profiles and nutrient density.",
      }));

      if (groqKey) {
        const groqPrompt = `As an elite AI Nutritionist, analyze these recipe ingredients: ${JSON.stringify(recipe.ingredients)}.
For each ingredient, provide:
1. A 1-sentence health/nutrition benefit.
2. A 1-sentence shopping selection tip.
3. A 1-sentence culinary secret for cooking this ingredient.
Return ONLY a valid JSON array of objects, where each object has these exact keys: "name" (the ingredient name), "benefit", "shopping_tip", "culinary_secret".`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: groqPrompt }],
            response_format: { type: "json_object" },
          }),
        });

        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          groqIngredients = Array.isArray(parsed) ? parsed : (parsed.ingredients || parsed.data || groqIngredients);
        }
      }

      // 4. YouTube Search API (If Key is present)
      let youtubeVideos: { videoId: string; title: string; thumbnail: string }[] = [];
      if (youtubeKey) {
        try {
          const query = geminiData.youtube_query || `how to cook ${recipe.title}`;
          const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query)}&type=video&key=${youtubeKey}`;
          const ytRes = await fetch(ytUrl);
          const ytData = await ytRes.json();
          if (ytData.items && ytData.items.length > 0) {
            youtubeVideos = ytData.items
              .filter((item: any) => item.id?.videoId)
              .map((item: any) => ({
                videoId: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.medium?.url || "",
              }));
            if (youtubeVideos.length > 0) {
              videoId = youtubeVideos[0].videoId;
            }
          }
        } catch (ytErr) {
          console.error("YouTube Search API Error:", ytErr);
        }
      }

      // Fallback YouTube search query mapping if no videoId was resolved
      if (!videoId) {
        videoId = "f6n0eS89g-A"; // Default fallback (Mango Lassi cooking tutorial)
      }

      if (youtubeVideos.length === 0) {
        youtubeVideos = [
          {
            videoId: videoId,
            title: `How to cook ${recipe.title} (Tutorial)`,
            thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80",
          },
          {
            videoId: "z1F6X3vYwMs",
            title: "Pro Chef Secrets & Culinary Tips",
            thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=120&auto=format&fit=crop&q=80",
          },
          {
            videoId: "f6n0eS89g-A",
            title: "Tasty Healthy Cooking Ideas",
            thumbnail: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=120&auto=format&fit=crop&q=80",
          },
        ];
      }

      const combinedResult = {
        water: geminiData.water,
        time: geminiData.time,
        difficulty: geminiData.difficulty || "Medium",
        youtubeVideoId: videoId,
        youtubeVideos: youtubeVideos,
        steps: geminiData.steps,
        ingredients: groqIngredients,
      };

      setAiAnalysis(combinedResult);
      setActiveVideoId(videoId);
      toast.success("AI Analysis & Culinary Guide generated successfully! ✨");
    } catch (err: any) {
      console.error("Advanced AI Analysis Error:", err);
      toast.error("Failed to run full AI analysis. Loading mock details.");
      
      const defaultVideos = [
        {
          videoId: videoId || "f6n0eS89g-A",
          title: `How to cook ${recipe.title} (Tutorial)`,
          thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80",
        },
        {
          videoId: "z1F6X3vYwMs",
          title: "Pro Chef Secrets & Culinary Tips",
          thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=120&auto=format&fit=crop&q=80",
        },
      ];
      
      setAiAnalysis({
        water: "2 cups",
        time: recipe.time,
        difficulty: "Medium",
        youtubeVideoId: videoId || "f6n0eS89g-A",
        youtubeVideos: defaultVideos,
        steps: recipe.instructions,
        ingredients: recipe.ingredients.map((ing) => ({
          name: ing.name,
          benefit: "High in nutrients and essential macros that support physical energy and focus.",
          shopping_tip: "Choose fresh, organic options with bright coloring and zero blemishes.",
          culinary_secret: "Sauté gently on medium heat to seal in natural moisture and oils.",
        })),
      });
      setActiveVideoId(videoId || "f6n0eS89g-A");
    } finally {
      setAnalyzingRecipeId(null);
    }
  };

  const handleCustomYtSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customYtQuery.trim()) return;
    setSearchingCustomYt(true);
    const youtubeKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    try {
      if (youtubeKey) {
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(customYtQuery)}&type=video&key=${youtubeKey}`;
        const ytRes = await fetch(ytUrl);
        const ytData = await ytRes.json();
        if (ytData.items && ytData.items.length > 0) {
          const results = ytData.items
            .filter((item: any) => item.id?.videoId)
            .map((item: any) => ({
              videoId: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.medium?.url || "",
            }));
          if (results.length > 0) {
            setAiAnalysis((prev: any) => ({
              ...prev,
              youtubeVideos: results,
              youtubeVideoId: results[0].videoId
            }));
            setActiveVideoId(results[0].videoId);
            toast.success(`Found alternative cooking tutorials! 📺`);
          } else {
            toast.error("No videos found for this search.");
          }
        } else {
          toast.error("No search results returned.");
        }
      } else {
        toast.error("YouTube API Key not configured.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Alternative search failed.");
    } finally {
      setSearchingCustomYt(false);
    }
  };

  return (
    <PhoneShell>
      {/* Inline styles for custom animations */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
      `,
        }}
      />

      {activeTab === "planner" && (
        <ScreenHeader title="Meal Planner" subtitle="Weekly Schedule & Plans" />
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-28">
        {/* Tab 1: Chef's Corner (Recipes Database) */}
        {activeTab === "corner" && (
          <div className="space-y-4">
            {/* Pizza Banner at the top above the search bar */}
            <div className="rounded-3xl overflow-hidden mb-4 border border-border/70 bg-card shadow-sm">
              <img
                src="/chef_corner_banner.jpg"
                alt="Chef's Corner Banner"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Search Bar & Filters */}
            <div className="relative flex items-center gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search recipes or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-20 py-3 rounded-full border border-border bg-card text-xs focus:border-[#007000] focus:outline-none transition shadow-sm text-foreground"
                />
                <div className="absolute right-3.5 top-2.5 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-muted-foreground hover:text-foreground p-1 animate-in fade-in zoom-in-75 duration-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleVoiceSearch}
                    className={`p-1 rounded-full transition active:scale-95 ${
                      isListening
                        ? "text-red-500 animate-pulse"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Voice Search"
                  >
                    {isListening ? (
                      <MicOff className="h-4.5 w-4.5" />
                    ) : (
                      <Mic className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 rounded-full border transition active:scale-95 ${
                  showFilters || maxCaloriesFilter !== null || maxTimeFilter !== null
                    ? "bg-[#007000]/10 border-[#007000]/30 text-[#007000]"
                    : "bg-card border-border hover:bg-muted text-muted-foreground"
                }`}
                title="Filter Options"
              >
                <SlidersHorizontal className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Expandable Filter Panel */}
            {showFilters && (
              <div className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">Advanced Filters</h4>
                  {(maxCaloriesFilter !== null || maxTimeFilter !== null) && (
                    <button
                      onClick={() => {
                        setMaxCaloriesFilter(null);
                        setMaxTimeFilter(null);
                      }}
                      className="text-[10px] font-bold text-[#007000] hover:underline"
                    >
                      Reset All
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Calorie Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Max Calories
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {[300, 400, 500].map((cal) => (
                        <button
                          key={cal}
                          onClick={() =>
                            setMaxCaloriesFilter(maxCaloriesFilter === cal ? null : cal)
                          }
                          className={`text-[9px] font-bold px-2.5 py-1 rounded-md border transition ${
                            maxCaloriesFilter === cal
                              ? "bg-[#007000] border-[#007000] text-white"
                              : "bg-muted border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          &le; {cal} kcal
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cook Time Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Max Prep Time
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {[15, 30, 45].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setMaxTimeFilter(maxTimeFilter === mins ? null : mins)}
                          className={`text-[9px] font-bold px-2.5 py-1 rounded-md border transition ${
                            maxTimeFilter === mins
                              ? "bg-[#007000] border-[#007000] text-white"
                              : "bg-muted border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          &le; {mins} min
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 mt-1 scrollbar-none">
              {["All", "Breakfast", "Lunch", "Dinner", "Indian Favorites"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition duration-200 active:scale-95 ${
                    selectedCategory === cat
                      ? "bg-[#007000] text-white border-[#007000]"
                      : "bg-card border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Trending Recipes: Auto-scrolling marquee of recipe images. */}
            <div className="space-y-2 py-2 border-y border-border/40 my-3 overflow-hidden w-full">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Trending Recipes
                </h3>
              </div>
              <div
                className="relative w-full overflow-hidden rounded-2xl bg-muted/40 p-2 cursor-pointer"
                onClick={() => {
                  setIsMarqueePaused(false);
                }}
              >
                <div
                  className={`animate-marquee gap-3 flex ${isMarqueePaused ? "[animation-play-state:paused]" : "hover:[animation-play-state:paused]"}`}
                  onMouseEnter={() => setIsMarqueePaused(true)}
                  onMouseLeave={() => setIsMarqueePaused(false)}
                >
                  {/* Set 1 */}
                  {marqueeRecipes.map((recipe, idx) => (
                    <div
                      key={`marquee-1-${recipe.id}-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecipe(recipe);
                        setAiAnalysis(STATIC_AI_ANALYSIS[recipe.id] || null);
                      }}
                      className="relative w-28 h-20 rounded-xl overflow-hidden cursor-pointer group shadow-sm flex-shrink-0 border border-border"
                    >
                      <img
                        src={
                          recipe.image ||
                          "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60"
                        }
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60";
                        }}
                      />
                    </div>
                  ))}
                  {/* Set 2 (Duplicates) */}
                  {marqueeRecipes.map((recipe, idx) => (
                    <div
                      key={`marquee-2-${recipe.id}-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecipe(recipe);
                        setAiAnalysis(STATIC_AI_ANALYSIS[recipe.id] || null);
                      }}
                      className="relative w-28 h-20 rounded-xl overflow-hidden cursor-pointer group shadow-sm flex-shrink-0 border border-border"
                    >
                      <img
                        src={
                          recipe.image ||
                          "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60"
                        }
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Catalog Info & Add Action */}
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <span>Chef's Corner</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-bold">
                  {filteredRecipes.length} recipes found
                </span>
              </h2>

              <button
                onClick={() => setShowAddRecipeModal(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#007000] hover:opacity-90 active:scale-95 px-3 py-1.5 rounded-full transition shadow-md"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Recipe</span>
              </button>
            </div>

            {/* Recipe Grid */}
            {loadingRecipes ? (
              <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                Loading recipes database...
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/80 bg-card/50 py-12 text-center text-xs text-muted-foreground">
                No recipes matching your query.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5">
                {filteredRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setAiAnalysis(STATIC_AI_ANALYSIS[recipe.id] || null);
                    }}
                    className="group rounded-3xl border border-border bg-card overflow-hidden shadow-card hover:border-[#007000]/40 transition duration-300 relative flex flex-col cursor-pointer"
                  >
                    <div className="relative aspect-[4/3.2] overflow-hidden bg-muted">
                      <img
                        src={
                          recipe.image ||
                          "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60"
                        }
                        alt={recipe.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      {/* Category Badge */}
                      <span className="absolute top-2.5 left-2.5 bg-black/60 text-white font-bold text-[8px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {recipe.category}
                      </span>
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1 space-y-1.5">
                      <div>
                        <h4 className="font-display text-xs font-bold text-foreground capitalize leading-snug line-clamp-1">
                          {recipe.title}
                        </h4>
                        <p className="text-[9px] text-muted-foreground mt-0.5 font-semibold">
                          {recipe.calories} · {recipe.time}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded-md">
                          {recipe.ingredients.length} Items
                        </span>
                        {/* Schedule Button (Placed right down / bottom right of details) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowScheduleDropdownId(
                              showScheduleDropdownId === recipe.id ? null : recipe.id,
                            );
                          }}
                          className="bg-muted hover:bg-[#007000]/10 p-1.5 rounded-lg text-muted-foreground hover:text-[#007000] active:scale-95 transition shadow-sm z-10"
                          title="Schedule Meal"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Schedule Date Dropdown overlay inside Card */}
                    {showScheduleDropdownId === recipe.id && (
                      <div
                        className="absolute inset-x-2 bottom-2 z-20 bg-card border border-border shadow-glow rounded-2xl p-2.5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold px-1">
                          Select date:
                        </p>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={async (e) => {
                            setSelectedDate(e.target.value);
                            setShowScheduleDropdownId(null);
                            await addMealPlanMutation.mutateAsync({
                              recipeId: recipe.id,
                              dateStr: e.target.value,
                            });
                          }}
                          className="w-full text-[10px] bg-muted border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:border-[#007000]"
                        />
                        <div className="grid grid-cols-2 gap-1 mt-1 border-t border-border/50 pt-1">
                          <button
                            onClick={async () => {
                              setShowScheduleDropdownId(null);
                              const todayStr = new Date().toISOString().split("T")[0];
                              await addMealPlanMutation.mutateAsync({
                                recipeId: recipe.id,
                                dateStr: todayStr,
                              });
                            }}
                            className="py-1 text-[9px] font-bold text-white bg-[#007000] rounded-md active:scale-95 transition"
                          >
                            Today
                          </button>
                          <button
                            onClick={() => setShowScheduleDropdownId(null)}
                            className="py-1 text-[9px] font-bold text-muted-foreground bg-muted rounded-md active:scale-95 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Meal Planner */}
        {activeTab === "planner" && (
          <div className="space-y-5">
            {/* Weekly Header Calendar Selector Card */}
            <div className="rounded-3xl border border-zinc-200/70 bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#007000]" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground leading-tight">
                      Weekly Schedule
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => datePickerRef.current?.showPicker()}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#007000] bg-[#007000]/10 hover:bg-[#007000]/15 px-3 py-1 rounded-full border border-[#007000]/20 transition duration-200 active:scale-95 cursor-pointer"
                  >
                    <span>Pick Date</span>
                  </button>
                  <input
                    ref={datePickerRef}
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedDate(e.target.value);
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Monday to Sunday Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, idx) => {
                  const y = day.getFullYear();
                  const m = String(day.getMonth() + 1).padStart(2, "0");
                  const d = String(day.getDate()).padStart(2, "0");
                  const dateStr = `${y}-${m}-${d}`;

                  const isSelected = dateStr === selectedDate;
                  const todayObj = new Date();
                  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;
                  const isToday = dateStr === todayStr;
                  const dayNum = day.getDate();
                  const weekdayName = day
                    .toLocaleDateString("en-US", { weekday: "short" })
                    .toUpperCase();

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`py-3.5 rounded-full text-center flex flex-col items-center justify-center transition duration-200 active:scale-95 relative ${
                        isSelected
                          ? "bg-[#007000] text-white shadow-md font-bold scale-105 z-10"
                          : "bg-white border border-zinc-150 text-foreground hover:bg-zinc-50 shadow-sm"
                      }`}
                      style={{ aspectRatio: "0.75" }}
                    >
                      <span
                        className={`text-[8px] tracking-wider ${isSelected ? "text-white/80" : "text-muted-foreground"} font-bold`}
                      >
                        {weekdayName}
                      </span>
                      <span className="text-sm mt-1 font-display font-extrabold">{dayNum}</span>
                      {isSelected && <span className="h-1 w-1 rounded-full bg-white mt-1" />}
                      {!isSelected && isToday && (
                        <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#007000]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Center the text "Selected Day: May 19, 2026" directly below the weekday circles track */}
              <div className="text-center pt-1">
                <span className="text-xs text-muted-foreground font-medium">
                  Selected Day:{" "}
                  <span className="font-bold text-foreground">
                    {new Date(selectedDate.replace(/-/g, "/")).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </div>
            </div>

            {/* Daily Macros Summary Card */}
            {dailyPlans.length > 0 && (
              <div className="rounded-3xl border border-zinc-200/70 bg-gradient-to-br from-card to-muted/20 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <h4 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span>Daily Nutrition Targets</span>
                  </h4>
                  <span className="text-[10px] font-bold bg-[#007000]/10 text-[#007000] px-2 py-0.5 rounded-full">
                    {totalMacros.calories} kcal
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl border border-border/40 bg-card py-2 px-1 text-center shadow-sm">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Protein
                    </span>
                    <span className="text-xs font-extrabold text-[#007000] mt-0.5 block">
                      {totalMacros.protein}g
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-card py-2 px-1 text-center shadow-sm">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Carbs
                    </span>
                    <span className="text-xs font-extrabold text-amber-500 mt-0.5 block">
                      {totalMacros.carbs}g
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border/40 bg-card py-2 px-1 text-center shadow-sm">
                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Fats
                    </span>
                    <span className="text-xs font-extrabold text-red-500 mt-0.5 block">
                      {totalMacros.fat}g
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Menu Schedule */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <span>Daily Schedule</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-semibold">
                    {new Date(selectedDate.replace(/-/g, "/")).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </h3>

                <div className="flex items-center gap-1.5">
                  {dailyPlans.length > 0 && (
                    <>
                      <button
                        onClick={handleClearDay}
                        disabled={isClearingDay}
                        className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-500/10 hover:bg-red-500/15 disabled:opacity-50 px-2.5 py-1 rounded-full transition shadow-sm cursor-pointer"
                        title="Clear all scheduled meals for this day"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>{isClearingDay ? "Clearing..." : "Clear"}</span>
                      </button>
                      <button
                        onClick={() => setShowCopyModal(true)}
                        className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 hover:bg-amber-500/15 px-2.5 py-1 rounded-full transition shadow-sm cursor-pointer"
                        title="Copy scheduled meals to another day"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setActiveTab("corner")}
                    className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#007000] hover:opacity-90 active:scale-95 px-2.5 py-1 rounded-full transition shadow-sm cursor-pointer"
                    title="Add Recipes"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {loadingMealPlans ? (
                <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                  Loading schedule details...
                </div>
              ) : dailyPlans.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-card/45 py-12 text-center">
                  <p className="text-xs text-muted-foreground">
                    No dishes scheduled for this date.
                  </p>
                  <button
                    onClick={() => setActiveTab("corner")}
                    className="mt-3 text-[11px] font-bold text-[#007000] hover:underline"
                  >
                    + Add a recipe from Chef's Corner
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyPlans.map((plan) => {
                    const recipe = plan.recipeDetails;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => {
                          setSelectedRecipe(recipe);
                          setAiAnalysis(STATIC_AI_ANALYSIS[recipe.id] || null);
                        }}
                        className="group rounded-2xl border border-border bg-card p-3 shadow-sm hover:border-[#007000]/25 transition duration-200 flex flex-col gap-3 relative cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-3">
                            <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                              <img
                                src={recipe.image}
                                alt={recipe.title}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60";
                                }}
                              />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-primary tracking-wider">
                                {recipe.category}
                              </p>
                              <h4 className="text-xs font-bold text-foreground mt-0.5 capitalize leading-tight line-clamp-1">
                                {recipe.title}
                              </h4>
                              <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                <span>{recipe.time}</span>
                                <span>·</span>
                                <span className="text-amber-500 font-bold">{recipe.calories}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMealPlanMutation.mutate(plan.id);
                              }}
                              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition"
                              title="Remove from Schedule"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* AI steps inline generator button */}
                        <div className="mt-1 border-t border-border/40 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRecipe(recipe);
                              handleAiAnalysis(recipe);
                            }}
                            className="w-full py-2 rounded-xl bg-gradient-gold text-gold-foreground text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Analyze quantity & steps with AI</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Custom Recipe */}
      {showAddRecipeModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/45 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setShowAddRecipeModal(false)}
        >
          <form
            onSubmit={handleCreateRecipe}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border/80 shadow-glow p-5 flex flex-col max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted block sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h3 className="font-display text-base font-extrabold text-foreground flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5 text-[#007000]" />
                <span>Create Custom Recipe</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRecipeModal(false)}
                className="rounded-xl border border-border bg-muted/40 p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 mt-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Recipe Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Garlic Butter Paneer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                  >
                    <option>Breakfast</option>
                    <option>Lunch</option>
                    <option>Dinner</option>
                    <option>Indian Favorites</option>
                    <option>Global Favorites</option>
                    <option>Desserts</option>
                    <option>Drinks</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Time (minutes)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 25 min"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Servings
                  </label>
                  <input
                    type="number"
                    value={newServes}
                    onChange={(e) => setNewServes(Number(e.target.value))}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Calories
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 350 kcal"
                    value={newCalories}
                    onChange={(e) => setNewCalories(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                    Protein (g)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15g"
                    value={newProtein}
                    onChange={(e) => setNewProtein(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                    Fats (g)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12g"
                    value={newFat}
                    onChange={(e) => setNewFat(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                    Carbs (g)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 40g"
                    value={newCarbs}
                    onChange={(e) => setNewCarbs(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                  Recipe Image
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {newImage ? (
                  <div className="relative group rounded-xl overflow-hidden border border-border aspect-[16/9]">
                    <img
                      src={newImage}
                      alt="Recipe Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-card text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold shadow hover:bg-muted transition"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center py-6 px-4 rounded-xl border border-dashed border-border hover:border-[#007000] hover:bg-muted/20 active:scale-[0.99] transition text-center"
                  >
                    <Image className="h-6 w-6 text-muted-foreground mb-1.5" />
                    <span className="text-xs font-medium text-foreground">Upload from Gallery</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      Supports PNG, JPG, WebP
                    </span>
                  </button>
                )}
              </div>

              {/* Form Ingredients editor */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Ingredients
                  </span>
                  <button
                    type="button"
                    onClick={addIngredientField}
                    className="text-[10px] font-bold text-[#007000] hover:underline"
                  >
                    + Add Ingredient
                  </button>
                </div>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {ingredients.map((ing, idx) => (
                    <div key={ing.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ing.name}
                        onChange={(e) => updateIngredientField(idx, "name", e.target.value)}
                        className="flex-1 px-2.5 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:border-[#007000] text-foreground"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={ing.qty}
                        onChange={(e) => updateIngredientField(idx, "qty", Number(e.target.value))}
                        className="w-16 px-2.5 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:border-[#007000] text-foreground"
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={ing.unit || "g"}
                        onChange={(e) => updateIngredientField(idx, "unit", e.target.value)}
                        className="w-12 px-2.5 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:border-[#007000] text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredientField(idx)}
                        className="text-red-500 hover:text-red-600 p-1.5"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Instructions Steps Editor */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Instructions Steps
                  </span>
                  <button
                    type="button"
                    onClick={addInstructionField}
                    className="text-[10px] font-bold text-[#007000] hover:underline"
                  >
                    + Add Step
                  </button>
                </div>
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {instructions.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-xs font-bold text-[#007000] mt-2.5">{idx + 1}.</span>
                      <textarea
                        placeholder={`Step ${idx + 1} details...`}
                        value={step}
                        onChange={(e) => updateInstructionField(idx, e.target.value)}
                        className="flex-1 px-2.5 py-2 rounded-xl border border-border bg-card text-xs focus:outline-none focus:border-[#007000] text-foreground resize-none h-12"
                      />
                      <button
                        type="button"
                        onClick={() => removeInstructionField(idx)}
                        className="text-red-500 hover:text-red-600 p-1.5 mt-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={createRecipeMutation.isPending}
              className="w-full mt-5 rounded-2xl bg-gradient-hero py-3.5 font-display font-bold text-xs text-white shadow-glow active:scale-95 transition disabled:opacity-50"
            >
              {createRecipeMutation.isPending ? "Saving..." : "Save Recipe"}
            </button>
          </form>
        </div>
      )}

      {/* Modal: Recipe Detail & AI Prep Viewer */}
      {selectedRecipe && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/45 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => {
            setSelectedRecipe(null);
            setAiAnalysis(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border/80 shadow-glow flex flex-col max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-foreground"
          >
            {/* Image Hero Frame at the very top (full bleed, no padding) */}
            <div className="w-full aspect-[4/3] sm:aspect-video overflow-hidden relative bg-muted flex-shrink-0">
              <img
                src={
                  selectedRecipe.image ||
                  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60"
                }
                alt={selectedRecipe.title}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60";
                }}
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

              {/* Close Button as a modern translucent circle button in the top-right corner of image */}
              <button
                onClick={() => {
                  setSelectedRecipe(null);
                  setAiAnalysis(null);
                }}
                className="absolute top-4 right-4 rounded-full bg-black/55 backdrop-blur-md p-2 text-white hover:bg-black/75 hover:scale-105 active:scale-95 transition z-10"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Overlaid Category and Title at the bottom of the image */}
              <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                <span className="text-[9px] uppercase tracking-wider bg-[#007000] px-2.5 py-0.5 rounded-md font-bold inline-block">
                  {selectedRecipe.category}
                </span>
                <h3 className="font-display text-lg font-extrabold mt-1.5 capitalize text-white leading-tight">
                  {selectedRecipe.title}
                </h3>
              </div>
            </div>

            {/* Remaining details in a padded container */}
            <div className="p-5 flex-1 space-y-4">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] border-b border-border/50 pb-3">
                <div className="rounded-xl border border-border bg-muted/30 py-2">
                  <p className="text-muted-foreground font-semibold">Cooking</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedRecipe.time}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 py-2">
                  <p className="text-muted-foreground font-semibold">Calories</p>
                  <p className="font-bold text-amber-500 mt-0.5">{selectedRecipe.calories}</p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 py-2">
                  <p className="text-muted-foreground font-semibold">Serves</p>
                  <p className="font-bold text-foreground mt-0.5">{selectedRecipe.serves}</p>
                </div>
                <div className="rounded-xl border border-[#007000]/20 bg-[#007000]/5 py-2">
                  <p className="text-[#007000] font-bold">Protein</p>
                  <p className="font-extrabold text-[#007000] mt-0.5">{selectedRecipe.protein}</p>
                </div>
              </div>

              {/* Ingredients List */}
              {!(activeTab === "planner" && (aiAnalysis || analyzingRecipeId === selectedRecipe.id)) && (
                <div>
                  <p className="text-xs font-extrabold text-foreground mb-2 flex items-center gap-1.5">
                    <ShoppingCart className="h-4 w-4 text-[#007000]" />
                    <span>Ingredients List:</span>
                  </p>

                  {/* Servings portion scaler slider widget */}
                  {activeTab === "planner" && (
                    <div className="mb-3.5 flex items-center justify-between p-2.5 rounded-2xl bg-muted/40 border border-border/60">
                      <div>
                        <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Portions/Servings Scaler:</span>
                        <span className="text-[9px] text-muted-foreground">Adjust quantities & calories instantly</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 1.5, 2, 3].map((mult) => {
                          const isActive = portionsMultiplier === mult;
                          return (
                            <button
                              key={mult}
                              type="button"
                              onClick={() => {
                                setPortionsMultiplier(mult);
                                toast.success(`Portions scaled to ${mult}x! 🍳`);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-wide border transition duration-200 cursor-pointer ${
                                isActive
                                  ? "bg-[#007000] border-[#007000] text-white"
                                  : "bg-card border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              {mult}x
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <ul className="space-y-1.5">
                    {selectedRecipe.ingredients.map((ing, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between items-center text-xs text-muted-foreground py-1 border-b border-border/30 last:border-0"
                      >
                        <span className="capitalize">{ing.name}</span>
                        <span className="font-bold text-foreground">
                          {Math.round(ing.qty * portionsMultiplier)} {ing.unit || "g"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cooking Instructions Steps */}
              {!(activeTab === "planner" && (aiAnalysis || analyzingRecipeId === selectedRecipe.id)) && (
                <div>
                  <p className="text-xs font-extrabold text-foreground mb-2 flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-[#007000]" />
                    <span>Preparation Steps:</span>
                  </p>
                  <div className="space-y-2">
                    {selectedRecipe.instructions.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 text-xs text-muted-foreground leading-relaxed"
                      >
                        <span className="font-bold text-[#007000] min-w-[15px]">{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gemini + Groq + YouTube AI Cooking Analysis Block (ONLY visible in Meal Planner tab per request) */}
              {activeTab === "planner" && (
                <div className="border-t border-border/50 pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                      <span className="text-xs font-extrabold text-foreground">
                        AI Culinary Helper
                      </span>
                    </div>
                  </div>

                  {analyzingRecipeId === selectedRecipe.id ? (
                    <div className="p-4 bg-muted/40 border border-dashed border-border rounded-2xl text-center text-xs text-muted-foreground animate-pulse flex flex-col items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500 animate-spin" />
                      <span>Analyzing quantities, steps & ingredients with AI...</span>
                    </div>
                  ) : aiAnalysis ? (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      {/* Servings portion scaler slider widget */}
                      <div className="mb-3.5 flex items-center justify-between p-2.5 rounded-2xl bg-muted/40 border border-border/60">
                        <div>
                          <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Portions/Servings Scaler:</span>
                          <span className="text-[9px] text-muted-foreground">Adjust quantities & calories instantly</span>
                        </div>
                        <div className="flex gap-1.5">
                          {[1, 1.5, 2, 3].map((mult) => {
                            const isActive = portionsMultiplier === mult;
                            return (
                              <button
                                key={mult}
                                type="button"
                                onClick={() => {
                                  setPortionsMultiplier(mult);
                                  toast.success(`Portions scaled to ${mult}x! 🍳`);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-wide border transition duration-200 cursor-pointer ${
                                  isActive
                                    ? "bg-[#007000] border-[#007000] text-white"
                                    : "bg-card border-border text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {mult}x
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* YouTube Video Player with Selector Carousel & Search */}
                      {(activeVideoId || aiAnalysis.youtubeVideoId) && (
                        <div className="space-y-3">
                          <span className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider block">
                            📺 Watch Cooking Tutorial:
                          </span>
                          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border shadow-sm bg-black">
                            <iframe
                              className="absolute inset-0 h-full w-full"
                              src={`https://www.youtube.com/embed/${activeVideoId || aiAnalysis.youtubeVideoId}`}
                              title="YouTube video player"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>

                          {/* Related Videos Carousel */}
                          {aiAnalysis.youtubeVideos && aiAnalysis.youtubeVideos.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wide block">
                                Choose Other Tutorials / Related Videos:
                              </span>
                              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                {aiAnalysis.youtubeVideos.map((video: any, vIdx: number) => {
                                  const isActive = (activeVideoId || aiAnalysis.youtubeVideoId) === video.videoId;
                                  return (
                                    <button
                                      key={vIdx}
                                      onClick={() => setActiveVideoId(video.videoId)}
                                      className={`flex items-start gap-2 p-1.5 rounded-xl border text-left min-w-[170px] max-w-[170px] transition shrink-0 ${
                                        isActive
                                          ? "border-[#007000] bg-[#007000]/5 ring-1 ring-[#007000]"
                                          : "border-border bg-card hover:bg-muted/40"
                                      }`}
                                    >
                                      <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="h-8 w-11 rounded-md object-cover bg-muted shrink-0"
                                      />
                                      <p className="text-[9px] font-semibold text-foreground line-clamp-2 leading-tight">
                                        {video.title}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stats bar */}
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="bg-muted/40 rounded-xl p-2 border border-border">
                          <p className="text-muted-foreground font-semibold">Water Level</p>
                          <p className="font-bold text-foreground mt-0.5">{aiAnalysis.water}</p>
                        </div>
                        <div className="bg-muted/40 rounded-xl p-2 border border-border">
                          <p className="text-muted-foreground font-semibold">Prep Time</p>
                          <p className="font-bold text-foreground mt-0.5">{aiAnalysis.time}</p>
                        </div>
                        <div className="bg-emerald-500/10 rounded-xl p-2 border border-emerald-500/20">
                          <p className="text-emerald-600 font-bold">Difficulty</p>
                          <p className="font-extrabold text-emerald-600 mt-0.5">{aiAnalysis.difficulty}</p>
                        </div>
                      </div>


                      {/* Cooking countdown timer visual widget with Audio Synthesizer */}
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3.5 shadow-sm">
                        <div className="flex justify-between items-center mb-2.5 border-b border-border/40 pb-2">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#007000]" />
                            <span>Kitchen Prep Countdown Timer</span>
                          </span>
                          {kitchenTimerRunning && (
                            <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                          )}
                        </div>

                        {kitchenTimerSecs !== null ? (
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-display text-2xl font-black text-[#007000] tracking-tight">
                                {Math.floor(kitchenTimerSecs / 60)}:{(kitchenTimerSecs % 60).toString().padStart(2, "0")}
                              </span>
                              <span className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">Time remaining to complete step</span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setKitchenTimerRunning(!kitchenTimerRunning)}
                                className={`p-2.5 rounded-xl border transition active:scale-95 cursor-pointer ${
                                  kitchenTimerRunning
                                    ? "bg-amber-500/15 border-amber-500/20 text-amber-600"
                                    : "bg-[#007000] text-white border-[#007000]"
                                }`}
                              >
                                {kitchenTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setKitchenTimerRunning(false);
                                  setKitchenTimerSecs(null);
                                }}
                                className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:bg-muted transition active:scale-95 cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <p className="text-[10px] text-muted-foreground">Select a duration preset to start the cooking timer:</p>
                            <div className="flex gap-1.5">
                              {[1, 3, 5, 10, 15].map((minsVal) => (
                                <button
                                  key={minsVal}
                                  type="button"
                                  onClick={() => {
                                    setKitchenTimerSecs(minsVal * 60);
                                    setKitchenTimerRunning(true);
                                    toast.success(`Cooking timer started for ${minsVal} minutes! ⏰`);
                                  }}
                                  className="flex-1 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-[9px] font-bold text-foreground transition active:scale-95 cursor-pointer"
                                >
                                  {minsVal} min
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI Optimized Preparation Steps Checklist */}
                      <div className="p-3.5 bg-gradient-gold border border-gold/30 rounded-2xl space-y-2.5">
                        <p className="text-xs font-extrabold text-[#007000] tracking-wider uppercase">
                          📋 AI Optimized Preparation Steps:
                        </p>
                        <div className="space-y-2">
                          {aiAnalysis.steps.map((step: string, idx: number) => {
                            const isChecked = !!checkedSteps[idx];
                            return (
                              <label
                                key={idx}
                                className={`flex gap-3 text-[11px] leading-relaxed cursor-pointer p-1.5 rounded-lg transition hover:bg-white/40 ${
                                  isChecked ? "opacity-50 line-through" : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => setCheckedSteps(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                  className="mt-0.5 rounded border-border text-[#007000] focus:ring-[#007000]/30"
                                />
                                <span>{step}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Smart Substitute Finder Tool */}
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-3.5 shadow-sm space-y-2.5">
                        <div className="flex justify-between items-center border-b border-border/40 pb-2">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground">Pantry smart substitute finder</span>
                          <button
                            type="button"
                            onClick={() => setShowSubstituteBox(!showSubstituteBox)}
                            className="text-[9px] text-[#007000] font-black hover:underline uppercase"
                          >
                            {showSubstituteBox ? "Hide substitutes" : "Show substitutes"}
                          </button>
                        </div>

                        {showSubstituteBox && (
                          <div className="space-y-2.5 animate-in fade-in duration-200">
                            <p className="text-[10px] text-muted-foreground">Choose an ingredient to find a healthy substitute:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedRecipe.ingredients.map((ing) => (
                                <button
                                  key={ing.name}
                                  type="button"
                                  onClick={() => {
                                    setSubstituteIngName(ing.name);
                                    toast.info(`Finding healthy substitute for ${ing.name}...`);
                                  }}
                                  className={`px-2 py-1 rounded-lg border text-[9px] font-bold capitalize transition ${
                                    substituteIngName === ing.name
                                      ? "bg-[#007000] border-[#007000] text-white"
                                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  {ing.name}
                                </button>
                              ))}
                            </div>

                            {substituteIngName && (
                              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] leading-relaxed text-emerald-800 animate-in slide-in-from-top-1 duration-150">
                                <span className="font-extrabold uppercase block text-[8px] text-emerald-600 tracking-wider">🌟 Recommended healthy substitute:</span>
                                {substituteIngName.toLowerCase().includes("paneer") || substituteIngName.toLowerCase().includes("chicken") ? (
                                  <span>Use **Organic Extra-Firm Tofu** (pressed and dry-sautéed) as an exact 1:1 plant-based macro replacement that absorbs spice profiles beautifully.</span>
                                ) : substituteIngName.toLowerCase().includes("butter") || substituteIngName.toLowerCase().includes("ghee") ? (
                                  <span>Substitute with **Cold-Pressed Extra Virgin Olive Oil** or **Avocado Oil** to supply heart-healthy monounsaturated fats instead of saturated lipids.</span>
                                ) : substituteIngName.toLowerCase().includes("milk") || substituteIngName.toLowerCase().includes("cream") ? (
                                  <span>Swap with **Unsweetened Coconut Milk** or **Cashew Cream** for a super rich, velvety mouthfeel without lactose or high cholesterol.</span>
                                ) : substituteIngName.toLowerCase().includes("sugar") || substituteIngName.toLowerCase().includes("honey") ? (
                                  <span>Use **Pure Maple Syrup** or **Stevia Extract** to lower glycemic spikes while preserving natural organic sweetness.</span>
                                ) : (
                                  <span>Use **Fresh Organic Seasonal Greens** or a handful of **Raw Almonds/Walnuts** to add healthy crunch, micronutrients, and dietary fiber.</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* AI health grade and clinical insights */}
                      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-card to-emerald-500/5 p-4 shadow-sm space-y-3.5">
                        <div className="flex items-center gap-3">
                          {/* Glowing Circle Health Grade */}
                          <div className="h-11 w-11 rounded-full bg-gradient-to-tr from-[#007000] to-emerald-400 text-white flex items-center justify-center font-display text-lg font-black shadow-md border-2 border-white ring-2 ring-emerald-500/20 shrink-0">
                            A-
                          </div>
                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-[#007000] font-black">AI Nutrition Grade</span>
                            <h4 className="text-xs font-black text-foreground">Excellent Macro Distribution</h4>
                          </div>
                        </div>

                        <div className="border-t border-border/40 pt-2.5 space-y-1.5 text-[10px] text-muted-foreground leading-relaxed">
                          <span className="text-[8px] uppercase font-extrabold text-[#007000] tracking-wider block">Clinical Diet Guidelines:</span>
                          <div className="flex gap-2 items-start">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#007000] shrink-0 mt-1.5" />
                            <span>This dish has excellent protein density, perfect for lean muscle growth.</span>
                          </div>
                          <div className="flex gap-2 items-start">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-550 shrink-0 mt-1.5" />
                            <span>Limit added table salt—rely on raw fresh herbs and lemon juice for seasoning to support lower blood pressure.</span>
                          </div>
                          <div className="flex gap-2 items-start">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#007000] shrink-0 mt-1.5" />
                            <span>Pair with steamed brown rice or whole-wheat quinoa to add low-glycemic dietary fiber.</span>
                          </div>
                        </div>
                      </div>

                      {/* AI Optimized Ingredients List & Insights */}
                      {aiAnalysis.ingredients && aiAnalysis.ingredients.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-extrabold text-foreground mb-2 flex items-center gap-1.5">
                            <ShoppingCart className="h-4 w-4 text-[#007000]" />
                            <span>🌱 AI Optimized Ingredients List:</span>
                          </p>
                          <div className="space-y-2">
                            {aiAnalysis.ingredients.map((ing: any, idx: number) => {
                              const ingName = ing?.name || "";
                              const isExpanded = expandedIngredient === ingName;
                              
                              // Find base quantity from original ingredients safely
                              const originalIng = ingName
                                ? selectedRecipe.ingredients.find((i) => i.name.toLowerCase() === ingName.toLowerCase())
                                : null;
                              const baseQty = originalIng?.qty || 0;
                              const unit = originalIng?.unit || "g";
                              const scaledQty = baseQty ? Math.round(baseQty * portionsMultiplier) : null;

                              return (
                                <div
                                  key={idx}
                                  className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setExpandedIngredient(isExpanded ? null : ingName)}
                                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-bold text-foreground hover:bg-muted/40 transition"
                                  >
                                    <div className="flex items-center justify-between w-full pr-3.5">
                                      <span className="capitalize">{ingName || "Ingredient"}</span>
                                      {scaledQty && (
                                        <span className="text-[10px] text-[#007000] font-black">
                                          {scaledQty} {unit}
                                        </span>
                                      )}
                                    </div>
                                    <ChevronRight
                                      className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-250 ${
                                        isExpanded ? "rotate-90" : ""
                                      }`}
                                    />
                                  </button>
                                  {isExpanded && (
                                    <div className="px-3.5 pb-3 pt-1 text-[11px] text-muted-foreground space-y-2 border-t border-border/20 bg-muted/20 animate-in fade-in duration-150">
                                      <div>
                                        <span className="font-semibold text-emerald-650 block">🌟 Benefit:</span>
                                        <span>{ing?.benefit || "Rich in macros and essential nutrients."}</span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-amber-600 block">🛒 Selection:</span>
                                        <span>{ing?.shopping_tip || "Select fresh, high quality options."}</span>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-[#007000] block">🍳 Culinary Secret:</span>
                                        <span>{ing?.culinary_secret || "Cook gently to lock in natural macro elements."}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-3">
                      <p className="text-[11px] text-muted-foreground leading-normal mb-3">
                        Estimate cooking water levels, interactive prep quantities, ingredient deep dives, and load a YouTube cooking tutorial.
                      </p>
                      <button
                        onClick={() => handleAiAnalysis(selectedRecipe)}
                        className="w-full py-2.5 rounded-xl border border-[#007000] text-xs font-bold text-[#007000] hover:bg-[#007000]/10 active:scale-95 transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        <span>Analyze quantity and steps with AI</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Single Add to Cart Action removed per request */}
            </div>
          </div>
        </div>
      )}
      {/* Modal: Copy Meal Plan to Another Date */}
      {showCopyModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/45 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setShowCopyModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-card border border-border/80 shadow-glow p-5 flex flex-col animate-in slide-in-from-bottom duration-200"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted block sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h3 className="font-display text-sm font-extrabold text-foreground flex items-center gap-1.5">
                <Copy className="h-4 w-4 text-[#007000]" />
                <span>Copy Schedule</span>
              </h3>
              <button
                onClick={() => setShowCopyModal(false)}
                className="rounded-xl border border-border bg-muted/40 p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Copy all scheduled dishes from{" "}
                <span className="font-bold text-foreground">
                  {new Date(selectedDate.replace(/-/g, "/")).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>{" "}
                to your chosen date below.
              </p>

              <div>
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1.5">
                  Target Date
                </label>
                <input
                  type="date"
                  value={copyTargetDate}
                  onChange={(e) => setCopyTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted/40 active:scale-95 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyDay}
                  disabled={isCopyingDay}
                  className="flex-1 py-3 rounded-xl bg-gradient-hero text-xs font-bold text-white shadow-glow active:scale-95 transition disabled:opacity-50"
                >
                  {isCopyingDay ? "Copying..." : "Copy Day"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
