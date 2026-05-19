import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { 
  Plus, Calendar, Heart, Search, Mic, MicOff, Clock, Sparkles, 
  Trash2, X, ChevronRight, ShoppingCart, Info, Flame, ChevronLeft 
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { 
  Recipe, Ingredient, MealPlanItem, AiAnalysisResult, 
  DEFAULT_RECIPES, STATIC_AI_ANALYSIS 
} from "@/lib/recipeData";

export const Route = createFileRoute("/recipes")({
  head: () => ({ meta: [{ title: "Meal Planner & Chef's Corner — PulsePeak" }] }),
  component: Recipes,
});

// Custom styles for infinite scroll marquee and animations
const STYLE_BLOCK = `
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  display: flex;
  width: max-content;
  animation: marquee 35s linear infinite;
}
.animate-marquee:hover {
  animation-play-state: paused;
}
.glass-panel {
  background: rgba(20, 35, 25, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.bg-gradient-green {
  background: linear-gradient(135deg, #132d1e 0%, #08140e 100%);
}
.text-gold {
  color: #f59e0b;
}
.bg-gold {
  background-color: #f59e0b;
}
.border-gold {
  border-color: #f59e0b;
}
`;

function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isListening, setIsListening] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // Custom Recipe Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("Breakfast");
  const [customTime, setCustomTime] = useState("");
  const [customServes, setCustomServes] = useState("2");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customImage, setCustomImage] = useState("");
  const [ingredientsInput, setIngredientsInput] = useState<{ name: string; qty: string; unit: string }[]>([
    { name: "", qty: "", unit: "g" }
  ]);
  const [instructionsInput, setInstructionsInput] = useState<string[]>([""]);

  // Date and Week planning states
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // AI analysis states
  const [analyzingRecipeId, setAnalyzingRecipeId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [plannerOpenRecipeId, setPlannerOpenRecipeId] = useState<string | null>(null);

  // Load Initial Data
  useEffect(() => {
    // 1. Merge default and custom recipes
    const custom = localStorage.getItem("nexgro_custom_recipes");
    const parsedCustom: Recipe[] = custom ? JSON.parse(custom) : [];
    setRecipes([...DEFAULT_RECIPES, ...parsedCustom]);

    // 2. Load meal plans
    const plans = localStorage.getItem("nexgro_meal_plans");
    if (plans) {
      setMealPlans(JSON.parse(plans));
    }

    // 3. Set current week
    updateWeekDays(new Date());
  }, []);

  // Update calendar days for selected date
  const updateWeekDays = (dateObj: Date) => {
    const day = dateObj.getDay();
    const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // get Monday
    const monday = new Date(dateObj);
    monday.setDate(diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      week.push(next);
    }
    setWeekDays(week);
  };

  // Handle Date Pick
  const handleDateChange = (dateString: string) => {
    setSelectedDate(dateString);
    updateWeekDays(new Date(dateString));
  };

  // Add customized recipes
  const handleAddIngredientRow = () => {
    setIngredientsInput([...ingredientsInput, { name: "", qty: "", unit: "g" }]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setIngredientsInput(ingredientsInput.filter((_, i) => i !== index));
  };

  const handleAddInstructionRow = () => {
    setInstructionsInput([...instructionsInput, ""]);
  };

  const handleRemoveInstructionRow = (index: number) => {
    setInstructionsInput(instructionsInput.filter((_, i) => i !== index));
  };

  const handleCreateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customTime || !customCalories) {
      toast.error("Please fill in the title, cooking time and calorie information!");
      return;
    }

    const cleanedIngredients: Ingredient[] = ingredientsInput
      .filter(i => i.name.trim() !== "" && i.qty !== "")
      .map((i, index) => ({
        id: `custom-i-${Date.now()}-${index}`,
        name: i.name.trim(),
        qty: Number(i.qty) || 1,
        unit: i.unit
      }));

    const cleanedInstructions = instructionsInput.filter(step => step.trim() !== "");

    if (cleanedIngredients.length === 0) {
      toast.error("Please add at least one ingredient!");
      return;
    }

    const newRecipe: Recipe = {
      id: `custom-r-${Date.now()}`,
      title: customTitle.trim(),
      category: customCategory,
      time: customTime,
      serves: Number(customServes) || 2,
      calories: `${customCalories} kcal`,
      protein: customProtein ? `${customProtein}g` : "0g",
      fat: customFat ? `${customFat}g` : "0g",
      carbs: customCarbs ? `${customCarbs}g` : "0g",
      image: customImage.trim() || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&auto=format&fit=crop&q=60",
      ingredients: cleanedIngredients,
      instructions: cleanedInstructions.length > 0 ? cleanedInstructions : ["Combine ingredients and cook to taste."]
    };

    const custom = localStorage.getItem("nexgro_custom_recipes");
    const parsedCustom: Recipe[] = custom ? JSON.parse(custom) : [];
    const updatedCustom = [...parsedCustom, newRecipe];

    localStorage.setItem("nexgro_custom_recipes", JSON.stringify(updatedCustom));
    setRecipes([...DEFAULT_RECIPES, ...updatedCustom]);

    // Reset Form
    setCustomTitle("");
    setCustomCategory("Breakfast");
    setCustomTime("");
    setCustomServes("2");
    setCustomCalories("");
    setCustomProtein("");
    setCustomFat("");
    setCustomCarbs("");
    setCustomImage("");
    setIngredientsInput([{ name: "", qty: "", unit: "g" }]);
    setInstructionsInput([""]);
    setShowAddModal(false);
    toast.success("Successfully added your custom recipe to Chef's Corner!");
  };

  // Add Recipe to Meal Plan Calendar
  const handleAddToCalendar = (recipe: Recipe, targetDate: string) => {
    const newItem: MealPlanItem = {
      id: `plan-${Date.now()}`,
      recipeId: recipe.id,
      plannedDate: targetDate,
      recipeDetails: recipe
    };

    const updatedPlans = [...mealPlans, newItem];
    setMealPlans(updatedPlans);
    localStorage.setItem("nexgro_meal_plans", JSON.stringify(updatedPlans));
    toast.success(`Planned "${recipe.title}" for ${targetDate}!`);
    setPlannerOpenRecipeId(null);
  };

  // Remove planned recipe
  const handleRemovePlan = (planId: string) => {
    const updatedPlans = mealPlans.filter(p => p.id !== planId);
    setMealPlans(updatedPlans);
    localStorage.setItem("nexgro_meal_plans", JSON.stringify(updatedPlans));
    toast.success("Removed meal from planner.");
  };

  // Add ingredients to shopping cart
  const handleAddToCart = (recipe: Recipe) => {
    const existingCart = localStorage.getItem("nexgro_grocery_cart");
    const cartItems = existingCart ? JSON.parse(existingCart) : [];
    
    const formattedIngredients = recipe.ingredients.map(ing => ({
      id: ing.id,
      name: ing.name,
      qty: ing.qty,
      unit: ing.unit,
      recipeTitle: recipe.title,
      addedAt: new Date().toISOString()
    }));

    const newCart = [...cartItems, ...formattedIngredients];
    localStorage.setItem("nexgro_grocery_cart", JSON.stringify(newCart));
    toast.success(`Added ${recipe.ingredients.length} ingredients from "${recipe.title}" to your Shopping Cart!`);
  };

  // AI analysis using Gemini endpoint (supporting local fallback)
  const handleAiAnalysis = async (recipe: Recipe) => {
    setAnalyzingRecipeId(recipe.id);
    setAiAnalysis(null);

    // 1. Check static fallback
    if (STATIC_AI_ANALYSIS[recipe.id]) {
      await new Promise(r => setTimeout(r, 900)); // simulation of quick response
      setAiAnalysis(STATIC_AI_ANALYSIS[recipe.id]);
      setAnalyzingRecipeId(null);
      return;
    }

    // 2. Load API key
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      // Return smart local defaults
      await new Promise(r => setTimeout(r, 1000));
      const fallbackResult: AiAnalysisResult = {
        water: "1 to 2 cups (approx. 400ml)",
        time: recipe.time,
        steps: [
          `Prep the main ingredients: ${recipe.ingredients.map(i => `${i.qty}${i.unit} of ${i.name}`).join(", ")}.`,
          `Heat your skillet/cooking pot to medium heat and add cooking oil.`,
          `Stir-fry or combine the ingredients and cook slowly for ${recipe.time}.`,
          `Adjust seasoning to taste and serve immediately.`
        ]
      };
      setAiAnalysis(fallbackResult);
      setAnalyzingRecipeId(null);
      toast.info("Using smart local fallback (No Gemini API key configured)");
      return;
    }

    try {
      const prompt = `You are a professional culinary assistant.
Analyze this recipe: "${recipe.title}".
Ingredients provided: ${JSON.stringify(recipe.ingredients)}.
Please provide a professional culinary analysis:
1. Estimated water needed for cooking (e.g., "2 cups", "500ml").
2. Total cooking time (e.g., "35 minutes").
3. 4-6 concise, step-by-step cooking instructions. IMPORTANT: Include the specific quantities of ingredients in the steps (e.g., "Add 200g of Paneer...").
Return ONLY a valid JSON object with these keys: "water", "time", "steps" (an array of strings).`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        }
      );
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        const parsed = JSON.parse(text.trim());
        setAiAnalysis(parsed);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (err) {
      console.error(err);
      setAiAnalysis({
        water: "2 cups (approx.)",
        time: recipe.time,
        steps: recipe.instructions
      });
      toast.error("Gemini API call failed. Displaying standard cooking instructions.");
    } finally {
      setAnalyzingRecipeId(null);
    }
  };

  // Voice Search (HTML5 Speech Recognition)
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice search is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening for a recipe name or category...");
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
      toast.error("Could not capture speech. Try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      toast.success(`Searching for: "${transcript}"`);
    };

    recognition.start();
  };

  // Filters calculation
  const categories = ["All", "Breakfast", "Lunch", "Dinner", "Indian Favorites", "Global Favorites", "Desserts", "Drinks"];
  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                          r.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate planned count
  const plannedCount = mealPlans.length;

  return (
    <PhoneShell>
      <style>{STYLE_BLOCK}</style>
      
      {/* Top Header */}
      <ScreenHeader 
        title="Culinary Hub" 
        subtitle="Chef's Corner & Planner"
        action={
          <div className="flex items-center gap-2">
            <div className="flex h-10 items-center justify-center gap-1 rounded-2xl bg-gradient-card border border-border px-3 text-xs font-semibold shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{plannedCount} Planned</span>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-hero text-primary-foreground shadow-glow active:scale-95 transition"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* Weekly Schedule Selector */}
      <div className="mx-5 rounded-3xl border border-border bg-gradient-card p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-500" />
            <p className="font-display text-sm font-semibold">Weekly Schedule</p>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition"
            >
              Pick Date
            </button>
            {showDatePicker && (
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  handleDateChange(e.target.value);
                  setShowDatePicker(false);
                }}
                className="absolute right-0 top-8 z-10 rounded-xl border border-border bg-card p-2 text-xs shadow-glow focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Calendar Mon-Sun Cards */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const dateStr = day.toISOString().split("T")[0];
            const isSelected = dateStr === selectedDate;
            const dayName = day.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = day.getDate();
            
            // Check if there are planned recipes on this day
            const hasMeals = mealPlans.some(p => p.plannedDate === dateStr);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`relative flex flex-col items-center rounded-xl py-2 transition-all active:scale-95 ${
                  isSelected 
                    ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30" 
                    : "bg-card/60 hover:bg-card border border-border/40"
                }`}
              >
                <span className="text-[10px] uppercase opacity-75">{dayName}</span>
                <span className="text-sm font-display mt-0.5">{dayNum}</span>
                {hasMeals && (
                  <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 text-center text-xs text-muted-foreground">
          Selected Day: <span className="font-semibold text-foreground">{new Date(selectedDate).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
        </div>
      </div>

      {/* Daily Planned Menu */}
      <div className="mx-5 mt-4">
        <h2 className="mb-2 font-display text-base font-semibold flex items-center gap-1.5">
          <span>Scheduled meals for today</span>
          <span className="text-xs font-normal text-muted-foreground">({selectedDate})</span>
        </h2>
        
        <div className="space-y-2">
          {mealPlans.filter(p => p.plannedDate === selectedDate).map((plan) => (
            <div key={plan.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm hover:border-emerald-500/20 transition-all">
              <div className="flex items-center gap-3" onClick={() => { setSelectedRecipe(plan.recipeDetails); setAiAnalysis(null); }}>
                <img 
                  src={plan.recipeDetails.image} 
                  alt={plan.recipeDetails.title}
                  className="h-12 w-12 rounded-xl object-cover" 
                />
                <div>
                  <h3 className="text-sm font-semibold leading-tight">{plan.recipeDetails.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.recipeDetails.calories} · {plan.recipeDetails.time}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleAddToCart(plan.recipeDetails)}
                  title="Add ingredients to cart"
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-primary active:scale-95 transition"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleRemovePlan(plan.id)}
                  title="Remove from plan"
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-destructive active:scale-95 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          
          {mealPlans.filter(p => p.plannedDate === selectedDate).length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 py-8 text-center text-sm text-muted-foreground flex flex-col items-center justify-center p-4">
              <p>No meals scheduled for this day.</p>
              <p className="text-xs mt-1 opacity-75">Select a recipe below to add it to your schedule!</p>
            </div>
          )}
        </div>
      </div>

      {/* Trending Horizontal Marquee Gallery */}
      <div className="mt-6 overflow-hidden">
        <h2 className="mx-5 mb-2 font-display text-base font-semibold">Trending Recipes</h2>
        <div className="w-full relative overflow-hidden bg-emerald-950/20 py-2 border-y border-border/20">
          <div className="animate-marquee">
            {/* Display twice for continuous infinite scroll */}
            {[...DEFAULT_RECIPES, ...DEFAULT_RECIPES].map((r, idx) => (
              <div 
                key={`marquee-${r.id}-${idx}`}
                onClick={() => { setSelectedRecipe(r); setAiAnalysis(null); }}
                className="mx-3 flex w-48 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card cursor-pointer transform hover:scale-105 active:scale-95 transition duration-300"
              >
                <img src={r.image} alt={r.title} className="h-24 w-full object-cover" />
                <div className="p-2.5">
                  <span className="rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[9px] font-semibold uppercase">{r.category}</span>
                  <h3 className="mt-1 text-xs font-bold truncate leading-tight">{r.title}</h3>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{r.calories}</span>
                    <span>{r.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mx-5 mt-6 space-y-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search recipes or categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-border bg-card px-10 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button 
            onClick={handleVoiceSearch}
            className={`absolute right-2 p-2 rounded-xl transition ${
              isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-muted text-muted-foreground"
            }`}
          >
            {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>
        </div>

        {/* Scrollable Categories List */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`shrink-0 rounded-xl px-4 py-1.5 text-xs font-semibold transition ${
                selectedCategory === c 
                  ? "bg-primary text-primary-foreground shadow-glow" 
                  : "bg-card border border-border/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Chef's Corner Recipe Grid */}
      <div className="mx-5 mt-4 pb-20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-base font-semibold">Chef's Corner</h2>
          <span className="text-xs text-muted-foreground">{filteredRecipes.length} recipes found</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filteredRecipes.map((r) => (
            <div 
              key={r.id} 
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-card flex flex-col transform hover:scale-[1.02] transition-all duration-300"
            >
              <div className="relative h-28 bg-muted overflow-hidden">
                <img 
                  src={r.image} 
                  alt={r.title} 
                  className="h-full w-full object-cover transition-transform hover:scale-110 duration-500" 
                />
                <span className="absolute left-2 top-2 rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-white">
                  {r.category}
                </span>
                
                {/* Save to Calendar Mini trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlannerOpenRecipeId(plannerOpenRecipeId === r.id ? null : r.id);
                  }}
                  className="absolute right-2 top-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 hover:text-emerald-300 active:scale-95 transition"
                >
                  <Calendar className="h-3.5 w-3.5" />
                </button>
              </div>
              
              <div className="p-3 flex-1 flex flex-col justify-between" onClick={() => { setSelectedRecipe(r); setAiAnalysis(null); }}>
                <div>
                  <h3 className="text-sm font-semibold leading-tight hover:text-primary transition line-clamp-1">{r.title}</h3>
                  <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span>{r.calories}</span>
                    <span>·</span>
                    <span>{r.time}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-1.5 pt-2 border-t border-border/40">
                  <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {r.ingredients.length} Items
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(r);
                    }}
                    className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary transition active:scale-95"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Date Scheduler Popup */}
              {plannerOpenRecipeId === r.id && (
                <div className="p-2 border-t border-border/80 bg-emerald-950/20 text-center animate-in fade-in duration-200">
                  <p className="text-[10px] font-bold text-emerald-400 mb-1">Add to plan date:</p>
                  <div className="flex justify-center gap-1">
                    <input 
                      type="date"
                      defaultValue={selectedDate}
                      onChange={(e) => handleAddToCalendar(r, e.target.value)}
                      className="rounded bg-card text-[10px] border border-border px-1 py-0.5 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredRecipes.length === 0 && (
            <div className="col-span-2 rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No matching recipes found. Try another search or create your own!
            </div>
          )}
        </div>
      </div>

      {/* RECIPE DETAIL DIALOG MODAL */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-gradient-card shadow-glow overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedRecipe(null)}
              className="absolute right-4 top-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Recipe Image Banner */}
            <div className="relative h-48 sm:h-56 shrink-0 bg-muted">
              <img src={selectedRecipe.image} alt={selectedRecipe.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="rounded-full bg-emerald-500 text-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                  {selectedRecipe.category}
                </span>
                <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-white leading-tight">
                  {selectedRecipe.title}
                </h2>
              </div>
            </div>

            {/* Scrollable details */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5 text-sm">
              {/* Info grid */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-card/60 border border-border/60 rounded-xl p-2">
                  <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
                  <span className="text-[10px] text-muted-foreground block">Calories</span>
                  <span className="font-bold text-xs">{selectedRecipe.calories}</span>
                </div>
                <div className="bg-card/60 border border-border/60 rounded-xl p-2">
                  <span className="text-[10px] text-muted-foreground block mb-1">Protein</span>
                  <span className="font-bold text-xs text-indigo-400">{selectedRecipe.protein}</span>
                </div>
                <div className="bg-card/60 border border-border/60 rounded-xl p-2">
                  <span className="text-[10px] text-muted-foreground block mb-1">Fat</span>
                  <span className="font-bold text-xs text-amber-500">{selectedRecipe.fat}</span>
                </div>
                <div className="bg-card/60 border border-border/60 rounded-xl p-2">
                  <span className="text-[10px] text-muted-foreground block mb-1">Carbs</span>
                  <span className="font-bold text-xs text-emerald-500">{selectedRecipe.carbs}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAiAnalysis(selectedRecipe)}
                  className="flex-1 py-3 rounded-2xl bg-gradient-gold text-gold-foreground font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  Analyze with AI
                </button>
                <button
                  onClick={() => handleAddToCart(selectedRecipe)}
                  className="py-3 px-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </button>
                <button
                  onClick={() => handleAddToCalendar(selectedRecipe, selectedDate)}
                  className="py-3 px-4 rounded-2xl bg-card border border-border hover:bg-muted text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule
                </button>
              </div>

              {/* Gemini AI response panel */}
              {analyzingRecipeId === selectedRecipe.id && (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 text-center animate-pulse flex flex-col items-center">
                  <Sparkles className="h-6 w-6 text-gold animate-spin mb-2" />
                  <p className="text-xs font-bold text-emerald-400">Analyzing with Gemini...</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Generating precise cooking steps and water measurements</p>
                </div>
              )}

              {aiAnalysis && (
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between border-b border-border/40 pb-2">
                    <div className="flex items-center gap-1.5 text-gold text-xs font-bold">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Gemini Cooking Assistant</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">AI Plan</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Water Needed</span>
                      <span className="font-semibold text-emerald-400">{aiAnalysis.water}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Total Cook Time</span>
                      <span className="font-semibold text-amber-400">{aiAnalysis.time}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-foreground">Precise Steps (with weights):</p>
                    <ol className="space-y-1.5 list-decimal list-inside text-xs leading-relaxed text-muted-foreground">
                      {aiAnalysis.steps.map((step, idx) => (
                        <li key={idx} className="pl-1">
                          <span className="text-foreground">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {/* Ingredients List */}
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-base">Ingredients needed</h3>
                <div className="divide-y divide-border/40">
                  {selectedRecipe.ingredients.map((ing) => (
                    <div key={ing.id} className="flex justify-between py-2 items-center">
                      <span className="font-medium text-foreground">{ing.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-bold">
                        {ing.qty} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Standard Instructions */}
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-base">Instructions</h3>
                <ol className="space-y-2 list-decimal list-inside leading-relaxed text-muted-foreground">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <li key={idx} className="pl-1">
                      <span className="text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM RECIPE ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-[2.5rem] border border-border bg-gradient-card shadow-glow overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-display text-xl font-bold flex items-center gap-1.5">
                  <Plus className="h-5 w-5 text-primary" />
                  <span>Create Custom Recipe</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Add to your custom recipe vault</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleCreateRecipe} className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Recipe Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Grandma's Kadhi"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Category & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Category</label>
                  <select 
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {categories.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Prep/Cook Time</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 20 min"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Calories & Serves */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Calories (kcal)</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 350"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Serves</label>
                  <input 
                    type="number" 
                    value={customServes}
                    onChange={(e) => setCustomServes(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Macros (Protein, Fat, Carbs) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Macros (Optional)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="number" 
                    placeholder="Protein (g)"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input 
                    type="number" 
                    placeholder="Fat (g)"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input 
                    type="number" 
                    placeholder="Carbs (g)"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Image URL</label>
                <input 
                  type="url" 
                  placeholder="https://example.com/photo.jpg"
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Ingredients List inputs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Ingredients</label>
                  <button 
                    type="button" 
                    onClick={handleAddIngredientRow}
                    className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>
                
                <div className="space-y-2">
                  {ingredientsInput.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input 
                        type="text" 
                        required
                        placeholder="Ingredient name"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...ingredientsInput];
                          updated[idx].name = e.target.value;
                          setIngredientsInput(updated);
                        }}
                        className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <input 
                        type="number" 
                        required
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => {
                          const updated = [...ingredientsInput];
                          updated[idx].qty = e.target.value;
                          setIngredientsInput(updated);
                        }}
                        className="w-16 rounded-xl border border-border bg-card px-2 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => {
                          const updated = [...ingredientsInput];
                          updated[idx].unit = e.target.value;
                          setIngredientsInput(updated);
                        }}
                        className="w-16 rounded-xl border border-border bg-card px-1 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="pcs">pcs</option>
                        <option value="tsp">tsp</option>
                        <option value="tbsp">tbsp</option>
                      </select>
                      {ingredientsInput.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveIngredientRow(idx)}
                          className="p-2 text-muted-foreground hover:text-destructive transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions steps inputs */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Instructions (Steps)</label>
                  <button 
                    type="button" 
                    onClick={handleAddInstructionRow}
                    className="text-xs text-primary font-semibold flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="h-3 w-3" /> Add Step
                  </button>
                </div>
                
                <div className="space-y-2">
                  {instructionsInput.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="mt-2 text-xs text-muted-foreground font-bold shrink-0">{idx + 1}.</span>
                      <textarea
                        required
                        placeholder="e.g. Boil water and add salt..."
                        rows={2}
                        value={step}
                        onChange={(e) => {
                          const updated = [...instructionsInput];
                          updated[idx] = e.target.value;
                          setInstructionsInput(updated);
                        }}
                        className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                      {instructionsInput.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveInstructionRow(idx)}
                          className="p-2 mt-1 text-muted-foreground hover:text-destructive transition"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form submit */}
              <button
                type="submit"
                className="w-full py-4 mt-4 rounded-2xl bg-gradient-hero text-primary-foreground font-display font-semibold shadow-glow active:scale-95 transition"
              >
                Create & Save Recipe
              </button>
            </form>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
