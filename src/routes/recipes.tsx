import { createFileRoute } from "@tanstack/react-router";
import { PhoneShell, ScreenHeader } from "@/components/PhoneShell";
import { 
  Plus, Calendar, Search, Mic, MicOff, Clock, Sparkles, 
  Trash2, X, ChevronRight, ShoppingCart, Info, Flame, ChevronLeft 
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { 
  useRecipes, 
  useMealPlans, 
  useCreateRecipe, 
  useAddMealPlan, 
  useDeleteMealPlan 
} from "@/hooks/useCulinary";
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

  // Search & Voice Recognition
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const datePickerRef = useRef<HTMLInputElement>(null);

  // Selected date for planner
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  // Modals state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [showScheduleDropdownId, setShowScheduleDropdownId] = useState<string | null>(null);
  
  // AI analysis state for the detail modal
  const [analyzingRecipeId, setAnalyzingRecipeId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

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
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", name: "", qty: 100 }
  ]);
  const [instructions, setInstructions] = useState<string[]>([""]);

  // Calculate Monday - Sunday for the selected date's week
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  useEffect(() => {
    const parts = selectedDate.split("-");
    if (parts.length !== 3) return;
    const current = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || 
                            r.category.toLowerCase() === selectedCategory.toLowerCase() ||
                            (selectedCategory === "Indian Favorites" && r.category.toLowerCase() === "indian") ||
                            (selectedCategory === "Global Favorites" && !["indian"].includes(r.category.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  // Helper for meal plan filtering
  const dailyPlans = mealPlans.filter(p => p.plannedDate === selectedDate);

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

  // Create Recipe Handler
  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a recipe title.");
      return;
    }

    const filteredIngredients = ingredients.filter(i => i.name.trim() !== "");
    const filteredInstructions = instructions.filter(i => i.trim() !== "");

    await createRecipeMutation.mutateAsync({
      title: newTitle,
      category: newCategory,
      time: newTime,
      serves: newServes,
      calories: newCalories,
      protein: newProtein,
      fat: newFat,
      carbs: newCarbs,
      image: newImage || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60",
      ingredients: filteredIngredients.map(i => ({ ...i, unit: i.unit || "g" })),
      instructions: filteredInstructions
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
    recipe.ingredients.forEach(ing => {
      const existing = cart.find((item: any) => item.name.toLowerCase() === ing.name.toLowerCase());
      if (existing) {
        existing.qty += ing.qty;
      } else {
        cart.push({ ...ing, id: ing.id || crypto.randomUUID() });
      }
    });
    localStorage.setItem("pulsepeak_cart", JSON.stringify(cart));
    toast.success(`Added ${recipe.ingredients.length} ingredients from "${recipe.title}" to cart! 🛒`);
  };

  const addAllPlannedToCart = () => {
    if (dailyPlans.length === 0) {
      toast.error("No recipes scheduled for today to add to cart.");
      return;
    }
    const cart = JSON.parse(localStorage.getItem("pulsepeak_cart") || "[]");
    let totalAdded = 0;
    dailyPlans.forEach(plan => {
      plan.recipeDetails.ingredients.forEach(ing => {
        const existing = cart.find((item: any) => item.name.toLowerCase() === ing.name.toLowerCase());
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

  // Gemini AI Analysis API Call
  const handleAiAnalysis = async (recipe: Recipe) => {
    setAnalyzingRecipeId(recipe.id);
    setAiAnalysis(null);

    // 1. Check static fallback
    if (STATIC_AI_ANALYSIS[recipe.id]) {
      setAiAnalysis(STATIC_AI_ANALYSIS[recipe.id]);
      setAnalyzingRecipeId(null);
      toast.success("Loaded chef's detailed analysis instantly.");
      return;
    }

    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      // Create instant realistic mock
      const mockResult = {
        water: "2.5 cups",
        time: recipe.time,
        steps: recipe.instructions.map((step, idx) => {
          if (idx === 0 && recipe.ingredients[0]) {
            return `Sauté the ${recipe.ingredients[0].qty}g of ${recipe.ingredients[0].name} in the pan.`;
          }
          return step;
        })
      };
      setAiAnalysis(mockResult);
      setAnalyzingRecipeId(null);
      toast.info("Using fallback smart analysis.");
      return;
    }

    try {
      const prompt = `Analyze this recipe: "${recipe.title}". 
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
        // Strip markdown backticks
        const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
        setAiAnalysis(JSON.parse(cleanJson));
        toast.success("Successfully analyzed prep details using Gemini AI! ✨");
      } else {
        throw new Error("Empty response");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to run Gemini AI analysis. Loading mock details.");
      setAiAnalysis({
        water: "2 cups",
        time: recipe.time,
        steps: recipe.instructions
      });
    } finally {
      setAnalyzingRecipeId(null);
    }
  };

  return (
    <PhoneShell>
      {/* Inline styles for custom animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 25s linear infinite;
        }
      `}} />

      {activeTab === "planner" && (
        <ScreenHeader 
          title="Meal Planner" 
          subtitle="Weekly Schedule & Plans" 
        />
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

            {/* Search Bar & Voice Control */}
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search recipes or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-full border border-border bg-card text-xs focus:border-[#007000] focus:outline-none transition shadow-sm text-foreground"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleVoiceSearch}
                className={`p-3 rounded-full border transition active:scale-95 ${
                  isListening 
                    ? "bg-red-500/10 border-red-500/30 text-red-500 animate-pulse" 
                    : "bg-card border-border hover:bg-muted text-muted-foreground"
                }`}
                title="Voice Search"
              >
                {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
              </button>
            </div>

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
              <div className="space-y-4">
                {/* First 4 recipes */}
                <div className="grid grid-cols-2 gap-3.5">
                  {filteredRecipes.slice(0, 4).map((recipe) => (
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
                          src={recipe.image} 
                          alt={recipe.title} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        
                        {/* Category Badge */}
                        <span className="absolute top-2.5 left-2.5 bg-black/60 text-white font-bold text-[8px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {recipe.category}
                        </span>
                        
                        {/* Schedule Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowScheduleDropdownId(showScheduleDropdownId === recipe.id ? null : recipe.id);
                          }}
                          className="absolute top-2.5 right-2.5 bg-black/60 p-1.5 rounded-full text-white hover:bg-[#007000] hover:scale-105 active:scale-95 transition shadow-md z-10"
                          title="Schedule Meal"
                        >
                          <Calendar className="h-3.5 w-3.5" />
                        </button>
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
                        </div>
                      </div>

                      {/* Schedule Date Dropdown overlay inside Card */}
                      {showScheduleDropdownId === recipe.id && (
                        <div 
                          className="absolute inset-x-2 bottom-2 z-20 bg-card border border-border shadow-glow rounded-2xl p-2.5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <p className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold px-1">Select date:</p>
                          <input 
                            type="date" 
                            value={selectedDate}
                            onChange={async (e) => {
                              setSelectedDate(e.target.value);
                              setShowScheduleDropdownId(null);
                              await addMealPlanMutation.mutateAsync({ recipeId: recipe.id, dateStr: e.target.value });
                              toast.success(`Scheduled ${recipe.title}! 📅`);
                            }}
                            className="w-full text-[10px] bg-muted border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:border-[#007000]"
                          />
                          <div className="grid grid-cols-2 gap-1 mt-1 border-t border-border/50 pt-1">
                            <button
                              onClick={async () => {
                                setShowScheduleDropdownId(null);
                                const todayStr = new Date().toISOString().split("T")[0];
                                await addMealPlanMutation.mutateAsync({ recipeId: recipe.id, dateStr: todayStr });
                                toast.success(`Scheduled ${recipe.title} for Today! 📅`);
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
                  {/* Trending Recipes: Auto-scrolling marquee of recipe images. */}
                  <div className="space-y-2 py-3 border-y border-border/60 my-2 overflow-hidden">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Trending Recipes
                      </h3>
                    </div>
                    <div className="relative w-full overflow-hidden rounded-2xl bg-muted/40 p-2">
                      <div className="animate-marquee gap-3 flex hover:[animation-play-state:paused]">
                        {/* Set 1 */}
                        {recipes.slice(0, 6).map((recipe) => (
                          <div 
                            key={recipe.id}
                            className="relative w-28 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-border"
                          >
                            <img 
                              src={recipe.image} 
                              alt={recipe.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {/* Set 2 (Duplicates) */}
                        {recipes.slice(0, 6).map((recipe) => (
                          <div 
                            key={`${recipe.id}-dup`}
                            className="relative w-28 h-20 rounded-xl overflow-hidden shadow-sm flex-shrink-0 border border-border"
                          >
                            <img 
                              src={recipe.image} 
                              alt={recipe.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remaining recipes in the grid */}
                {filteredRecipes.length > 4 && (
                  <div className="grid grid-cols-2 gap-3.5">
                    {filteredRecipes.slice(4).map((recipe) => (
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
                            src={recipe.image} 
                            alt={recipe.title} 
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                          
                          {/* Category Badge */}
                          <span className="absolute top-2.5 left-2.5 bg-black/60 text-white font-bold text-[8px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                            {recipe.category}
                          </span>
                          
                          {/* Schedule Button */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowScheduleDropdownId(showScheduleDropdownId === recipe.id ? null : recipe.id);
                            }}
                            className="absolute top-2.5 right-2.5 bg-black/60 p-1.5 rounded-full text-white hover:bg-[#007000] hover:scale-105 active:scale-95 transition shadow-md z-10"
                            title="Schedule Meal"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                          </button>
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
                          </div>
                        </div>

                        {/* Schedule Date Dropdown overlay inside Card */}
                        {showScheduleDropdownId === recipe.id && (
                          <div 
                            className="absolute inset-x-2 bottom-2 z-20 bg-card border border-border shadow-glow rounded-2xl p-2.5 flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <p className="text-[8px] uppercase tracking-wider text-muted-foreground font-bold px-1">Select date:</p>
                            <input 
                              type="date" 
                              value={selectedDate}
                              onChange={async (e) => {
                                setSelectedDate(e.target.value);
                                setShowScheduleDropdownId(null);
                                await addMealPlanMutation.mutateAsync({ recipeId: recipe.id, dateStr: e.target.value });
                                toast.success(`Scheduled ${recipe.title}! 📅`);
                              }}
                              className="w-full text-[10px] bg-muted border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:border-[#007000]"
                            />
                            <div className="grid grid-cols-2 gap-1 mt-1 border-t border-border/50 pt-1">
                              <button
                                onClick={async () => {
                                    setShowScheduleDropdownId(null);
                                    const todayStr = new Date().toISOString().split("T")[0];
                                    await addMealPlanMutation.mutateAsync({ recipeId: recipe.id, dateStr: todayStr });
                                    toast.success(`Scheduled ${recipe.title} for Today! 📅`);
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
                      {new Date(selectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
                  const weekdayName = day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();

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
                      <span className={`text-[8px] tracking-wider ${isSelected ? "text-white/80" : "text-muted-foreground"} font-bold`}>
                        {weekdayName}
                      </span>
                      <span className="text-sm mt-1 font-display font-extrabold">
                        {dayNum}
                      </span>
                      {isSelected && (
                        <span className="h-1 w-1 rounded-full bg-white mt-1" />
                      )}
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
                  Selected Day: <span className="font-bold text-foreground">{new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </span>
              </div>
            </div>

            {/* Daily Menu Schedule */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                  <span>Daily Schedule</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-semibold">
                    {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </span>
                </h3>

                <div className="flex items-center gap-1.5">
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
                  <p className="text-xs text-muted-foreground">No dishes scheduled for this date.</p>
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
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60";
                                }}
                              />
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold text-primary tracking-wider">{recipe.category}</p>
                              <h4 className="text-xs font-bold text-foreground mt-0.5 capitalize leading-tight line-clamp-1">{recipe.title}</h4>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/45 backdrop-blur-sm p-0 sm:p-4" onClick={() => setShowAddRecipeModal(false)}>
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
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Recipe Title</label>
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
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Category</label>
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
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Time (minutes)</label>
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
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Servings</label>
                  <input 
                    type="number" 
                    value={newServes}
                    onChange={(e) => setNewServes(Number(e.target.value))}
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Calories</label>
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
                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Protein (g)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 15g" 
                    value={newProtein}
                    onChange={(e) => setNewProtein(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Fats (g)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 12g" 
                    value={newFat}
                    onChange={(e) => setNewFat(e.target.value)}
                    className="w-full mt-1 px-2.5 py-2 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Carbs (g)</label>
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
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Image URL (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Paste URL starting with https://..." 
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border bg-card text-xs focus:border-[#007000] focus:outline-none text-foreground"
                />
              </div>

              {/* Form Ingredients editor */}
              <div className="space-y-2 border-t border-border/40 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ingredients</span>
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
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Instructions Steps</span>
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
              {createRecipeMutation.isPending ? "Saving..." : "Save Recipe to Database"}
            </button>
          </form>
        </div>
      )}

      {/* Modal: Recipe Detail & AI Prep Viewer */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/45 backdrop-blur-sm p-0 sm:p-4" onClick={() => { setSelectedRecipe(null); setAiAnalysis(null); }}>
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border/80 shadow-glow p-5 flex flex-col max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 text-foreground"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted block sm:hidden" />
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider bg-[#007000] text-white px-2.5 py-0.5 rounded-md font-bold">
                  {selectedRecipe.category}
                </span>
                <p className="font-display text-lg font-extrabold mt-1.5 capitalize text-foreground">{selectedRecipe.title}</p>
              </div>
              <button 
                onClick={() => { setSelectedRecipe(null); setAiAnalysis(null); }} 
                className="rounded-xl border border-border bg-muted/40 p-1.5 text-muted-foreground hover:text-foreground active:scale-95 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Image Hero Frame */}
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted flex items-center justify-center relative">
              <img 
                src={selectedRecipe.image} 
                alt={selectedRecipe.title} 
                className="h-full w-full object-cover" 
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=60";
                }}
              />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] mt-4 border-b border-border/50 pb-3">
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

            <div className="mt-4 space-y-4">
              
              {/* Ingredients List */}
              <div>
                <p className="text-xs font-extrabold text-foreground mb-2 flex items-center gap-1.5">
                  <ShoppingCart className="h-4 w-4 text-[#007000]" />
                  <span>Ingredients List:</span>
                </p>
                <ul className="space-y-1.5">
                  {selectedRecipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="flex justify-between items-center text-xs text-muted-foreground py-1 border-b border-border/30 last:border-0">
                      <span className="capitalize">{ing.name}</span>
                      <span className="font-bold text-foreground">{ing.qty} {ing.unit || "g"}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cooking Instructions Steps */}
              <div>
                <p className="text-xs font-extrabold text-foreground mb-2 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-[#007000]" />
                  <span>Preparation Steps:</span>
                </p>
                <div className="space-y-2">
                  {selectedRecipe.instructions.map((step, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-muted-foreground leading-relaxed">
                      <span className="font-bold text-[#007000] min-w-[15px]">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gemini AI Cooking Analysis Block */}
              <div className="border-t border-border/50 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-foreground">Gemini AI Culinary Helper</span>
                  </div>
                  {!aiAnalysis && !analyzingRecipeId && (
                    <button
                      onClick={() => handleAiAnalysis(selectedRecipe)}
                      className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md hover:bg-amber-500/15"
                    >
                      Analyze now
                    </button>
                  )}
                </div>

                {analyzingRecipeId === selectedRecipe.id ? (
                  <div className="p-3 bg-muted/40 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground animate-pulse">
                    Analyzing ingredients & volumes with Gemini API...
                  </div>
                ) : aiAnalysis ? (
                  <div className="p-3.5 bg-gradient-gold border border-gold/30 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground font-semibold">Water Needed:</span>
                        <span className="ml-1 font-bold text-foreground">{aiAnalysis.water}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold">Cooking Time:</span>
                        <span className="ml-1 font-bold text-foreground">{aiAnalysis.time}</span>
                      </div>
                    </div>
                    <div className="border-t border-border/30 pt-2 space-y-2">
                      <p className="text-[10px] uppercase font-bold text-[#007000] tracking-wider">Inline Qty Cooking Steps:</p>
                      {aiAnalysis.steps.map((step: string, idx: number) => (
                        <div key={idx} className="flex gap-2 text-[11px] text-muted-foreground leading-relaxed">
                          <span className="font-bold text-amber-500">{idx + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Click analyze to estimate cooking water levels and inline quantities using Google Gemini.
                  </p>
                )}
              </div>

              {/* Single Add to Cart Action removed per request */}
            </div>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
