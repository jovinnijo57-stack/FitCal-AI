export interface Ingredient {
  id: string;        // ID matching a store product (for cart integration)
  name: string;      // Human-readable ingredient name
  qty: number;       // Base quantity required (in grams/ml/units)
  unit: string;      // e.g. "g", "ml", "pcs"
}

export interface Recipe {
  id: string;
  title: string;
  category: string;
  time: string;       // e.g. "30 min"
  serves: number;
  calories: string;   // e.g. "220 kcal"
  protein: string;    // e.g. "12g"
  fat: string;        // e.g. "8g"
  carbs: string;      // e.g. "35g"
  image: string;      // Image URL
  ingredients: Ingredient[];
  instructions: string[];
}

export interface MealPlanItem {
  id: string;
  recipeId: string;
  plannedDate: string; // YYYY-MM-DD
  recipeDetails: Recipe;
}

export interface AiAnalysisResult {
  water: string;
  time: string;
  steps: string[];
}

export const DEFAULT_RECIPES: Recipe[] = [
  {
    id: "r1",
    title: "Soft Steamed Idli",
    category: "Breakfast",
    time: "15 min",
    serves: 2,
    calories: "120 kcal",
    protein: "4g",
    fat: "0.5g",
    carbs: "26g",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { id: "i-rice", name: "Idli Rice", qty: 200, unit: "g" },
      { id: "i-urad", name: "Urad Dal", qty: 50, unit: "g" },
      { id: "i-salt", name: "Salt", qty: 5, unit: "g" },
      { id: "i-water", name: "Water", qty: 150, unit: "ml" }
    ],
    instructions: [
      "Soak rice and urad dal separately for 4-6 hours.",
      "Grind urad dal to a fluffy batter and rice to a slightly coarse batter.",
      "Mix both batters together, add salt, and ferment overnight (8-12 hours).",
      "Pour batter into greased idli molds.",
      "Steam for 10-12 minutes until clean when pricked with a toothpick.",
      "Serve hot with coconut chutney and sambar."
    ]
  },
  {
    id: "r2",
    title: "Crispy Masala Dosa",
    category: "Breakfast",
    time: "25 min",
    serves: 2,
    calories: "320 kcal",
    protein: "7g",
    fat: "10g",
    carbs: "54g",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { id: "i-dosa-batter", name: "Dosa Batter", qty: 300, unit: "ml" },
      { id: "i-potatoes", name: "Boiled Potatoes", qty: 200, unit: "g" },
      { id: "i-onion", name: "Onions", qty: 50, unit: "g" },
      { id: "i-mustard", name: "Mustard Seeds", qty: 2, unit: "g" },
      { id: "i-ghee", name: "Ghee / Oil", qty: 15, unit: "ml" }
    ],
    instructions: [
      "Prepare potato masala by sautéing onions, mustard seeds, and boiled mashed potatoes with turmeric.",
      "Heat a non-stick tawa and spread a ladle of dosa batter in a circular motion.",
      "Drizzle ghee around the edges and cook until crispy and golden brown.",
      "Place potato masala in the center and fold the dosa.",
      "Serve immediately with sambar and spicy chutneys."
    ]
  },
  {
    id: "r3",
    title: "Aromatic Chicken Biryani",
    category: "Indian Favorites",
    time: "45 min",
    serves: 3,
    calories: "550 kcal",
    protein: "32g",
    fat: "18g",
    carbs: "62g",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { id: "i-basmati", name: "Basmati Rice", qty: 250, unit: "g" },
      { id: "i-chicken", name: "Chicken Pieces", qty: 300, unit: "g" },
      { id: "i-yogurt", name: "Yogurt", qty: 100, unit: "g" },
      { id: "i-onion-fried", name: "Fried Onions", qty: 50, unit: "g" },
      { id: "i-ghee", name: "Ghee", qty: 20, unit: "ml" },
      { id: "i-spices", name: "Biryani Masala", qty: 15, unit: "g" }
    ],
    instructions: [
      "Marinate chicken with yogurt, biryani masala, salt, and ginger-garlic paste for 1 hour.",
      "Wash and soak basmati rice for 30 minutes, then parboil with whole spices.",
      "In a heavy-bottomed pot, layer the marinated chicken, cooked rice, fried onions, mint leaves, and ghee.",
      "Cover tightly (Dum) and cook on low heat for 25-30 minutes.",
      "Gently fluff the rice layers and serve hot with raita."
    ]
  },
  {
    id: "r4",
    title: "Classic Palak Paneer",
    category: "Indian Favorites",
    time: "30 min",
    serves: 2,
    calories: "310 kcal",
    protein: "16g",
    fat: "22g",
    carbs: "12g",
    image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { id: "i-spinach", name: "Fresh Spinach", qty: 250, unit: "g" },
      { id: "i-paneer", name: "Paneer Cubes", qty: 150, unit: "g" },
      { id: "i-tomato", name: "Tomato Puree", qty: 80, unit: "g" },
      { id: "i-cream", name: "Fresh Cream", qty: 15, unit: "ml" },
      { id: "i-garlic", name: "Garlic cloves", qty: 10, unit: "g" }
    ],
    instructions: [
      "Blanch spinach leaves in hot water for 2 minutes, then shock in cold water and puree.",
      "Pan-fry paneer cubes until lightly golden, then soak in warm water to keep them soft.",
      "Sauté chopped garlic, onions, and tomato puree until oil separates.",
      "Add spinach puree, salt, and spices. Simmer for 5 minutes.",
      "Gently stir in paneer cubes, add fresh cream, and serve warm with rotis."
    ]
  },
  {
    id: "r5",
    title: "Mediterranean Chickpea Salad",
    category: "Global Favorites",
    time: "15 min",
    serves: 2,
    calories: "290 kcal",
    protein: "12g",
    fat: "6g",
    carbs: "45g",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { id: "i-chickpeas", name: "Boiled Chickpeas", qty: 200, unit: "g" },
      { id: "i-cucumber", name: "Cucumber", qty: 100, unit: "g" },
      { id: "i-cherry-tom", name: "Cherry Tomatoes", qty: 80, unit: "g" },
      { id: "i-feta", name: "Feta Cheese", qty: 30, unit: "g" },
      { id: "i-olive-oil", name: "Olive Oil", qty: 10, unit: "ml" }
    ],
    instructions: [
      "Rinse and drain boiled chickpeas and place in a large mixing bowl.",
      "Dice cucumbers, halve cherry tomatoes, and crumble feta cheese.",
      "Add vegetables and feta cheese to the bowl with chickpeas.",
      "Drizzle olive oil, lemon juice, salt, pepper, and oregano.",
      "Toss gently and serve chilled or at room temperature."
    ]
  },
  {
    id: "r6",
    title: "Creamy Mango Lassi",
    category: "Drinks",
    time: "5 min",
    serves: 1,
    calories: "220 kcal",
    protein: "8g",
    fat: "4g",
    carbs: "38g",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { id: "i-mango", name: "Ripe Mango Pulp", qty: 150, unit: "g" },
      { id: "i-yogurt-lassi", name: "Fresh Thick Yogurt", qty: 200, unit: "g" },
      { id: "i-honey", name: "Honey or Sugar", qty: 10, unit: "g" },
      { id: "i-cardamom", name: "Cardamom powder", qty: 1, unit: "g" },
      { id: "i-ice", name: "Ice Cubes", qty: 4, unit: "pcs" }
    ],
    instructions: [
      "Combine ripe mango pulp, yogurt, honey, and cardamom powder in a blender.",
      "Add ice cubes and blend until smooth and frothy.",
      "Pour into glass and garnish with saffron strands or chopped nuts.",
      "Serve chilled immediately."
    ]
  },
  {
    id: "r7",
    title: "Kadhi Pakora",
    category: "Indian Favorites",
    time: "35 min",
    serves: 2,
    calories: "240 kcal",
    protein: "8g",
    fat: "11g",
    carbs: "28g",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { id: "i-besan", name: "Besan (Gram Flour)", qty: 100, unit: "g" },
      { id: "i-sour-yogurt", name: "Sour Yogurt / Curd", qty: 150, unit: "g" },
      { id: "i-onion", name: "Onion", qty: 50, unit: "g" },
      { id: "i-oil", name: "Mustard Oil", qty: 20, unit: "ml" },
      { id: "i-spices-kadhi", name: "Kadhi Spices", qty: 10, unit: "g" }
    ],
    instructions: [
      "Mix sour yogurt, besan, and water into a smooth, thin lump-free mixture.",
      "Prepare pakoras by mixing besan, sliced onions, spices, and frying small dollops of batter.",
      "Simmer the curd-besan mixture on medium heat with turmeric and salt until it thickens.",
      "Add fried pakoras to the simmering kadhi and cook for 5-10 minutes.",
      "Prepare a tempering with mustard oil, fenugreek seeds, dry red chilies, and hing, and pour over the Kadhi."
    ]
  },
  {
    id: "r8",
    title: "Soft Gulab Jamun",
    category: "Desserts",
    time: "25 min",
    serves: 4,
    calories: "300 kcal",
    protein: "4g",
    fat: "11g",
    carbs: "48g",
    image: "https://images.unsplash.com/photo-1622207012971-820522f64609?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { id: "i-khoya", name: "Khoya / Mawa", qty: 150, unit: "g" },
      { id: "i-maida", name: "Maida (Flour)", qty: 30, unit: "g" },
      { id: "i-sugar", name: "Sugar", qty: 200, unit: "g" },
      { id: "i-rosewater", name: "Rose Water", qty: 5, unit: "ml" },
      { id: "i-ghee-fry", name: "Ghee for frying", qty: 100, unit: "ml" }
    ],
    instructions: [
      "Prepare a sugar syrup by boiling sugar and water with cardamom until slightly sticky.",
      "Knead khoya and maida together into a smooth, crack-free dough.",
      "Shape the dough into small smooth rounds.",
      "Fry the balls in low-medium heat ghee until deep golden brown.",
      "Drain and soak immediately in the warm sugar syrup for 2 hours before serving."
    ]
  }
];

export const STATIC_AI_ANALYSIS: Record<string, AiAnalysisResult> = {
  "r1": {
    water: "1.5 cups (for steaming)",
    time: "15 minutes",
    steps: [
      "Add 150ml of water to the idli cooker base and heat it up.",
      "Grease idli plates and fill with 300ml of fermented batter.",
      "Steam for exactly 10 minutes under medium pressure.",
      "Remove, let cool for 2 minutes, and scoop out soft idlis."
    ]
  },
  "r2": {
    water: "None / Not required",
    time: "25 minutes",
    steps: [
      "Prepare the filling: Heat 15ml of ghee, fry onions and spices, then sauté 200g of boiled potatoes.",
      "Spread 150ml Dosa batter thinly on a hot tawa in a circular motion.",
      "Drizzle 5ml ghee on edges and cook on medium heat until golden brown.",
      "Add 100g potato masala in center, fold and serve crisp."
    ]
  },
  "r3": {
    water: "4 cups (for boiling rice)",
    time: "45 minutes",
    steps: [
      "Parboil 250g Basmati Rice in 4 cups of boiling salted water until 70% cooked.",
      "Marinate 300g Chicken with 100g Yogurt and spices for 1 hour.",
      "Layer marinated chicken at the bottom, topped with cooked rice and 50g fried onions.",
      "Drizzle 20ml Ghee, cover tightly, and steam on Dum for 30 minutes."
    ]
  },
  "r4": {
    water: "2 cups (for blanching)",
    time: "30 minutes",
    steps: [
      "Blanch 250g Spinach in 2 cups of boiling water for 2 minutes, then puree.",
      "Sauté 10g Garlic and chopped onions in 10ml oil until transparent.",
      "Add 80g Tomato Puree and cook until dry, then mix in spinach puree.",
      "Stir in 150g Paneer cubes, 15ml Cream, and simmer for 5 minutes."
    ]
  },
  "r5": {
    water: "None / Not required",
    time: "15 minutes",
    steps: [
      "Toss 200g of boiled Chickpeas and 100g chopped Cucumber in a bowl.",
      "Add 80g halved Cherry Tomatoes and crumble 30g Feta Cheese over it.",
      "Drizzle 10ml Olive oil and squeeze fresh lemon juice.",
      "Season with salt, pepper, and oregano, then mix well."
    ]
  },
  "r6": {
    water: "None / Not required",
    time: "5 minutes",
    steps: [
      "Place 150g of ripe Mango Pulp and 200g thick Yogurt in a blender.",
      "Add 10g of Honey and 1g of Cardamom powder.",
      "Add 4 Ice cubes and blend for 1-2 minutes until thick and smooth.",
      "Pour into glasses and serve chilled."
    ]
  },
  "r7": {
    water: "3 cups (for Kadhi gravy)",
    time: "35 minutes",
    steps: [
      "Whisk 150g Sour Yogurt with 40g Besan and 3 cups of water until smooth.",
      "Sauté Kadhi spices in 20ml Mustard Oil, then pour in the yogurt mixture.",
      "Simmer on low-medium heat for 25 minutes while stirring.",
      "Drop in the prepared Onion pakoras and simmer for another 5 minutes."
    ]
  },
  "r8": {
    water: "1.5 cups (for sugar syrup)",
    time: "25 minutes",
    steps: [
      "Boil 200g Sugar in 1.5 cups of water with cardamom for 10 minutes.",
      "Knead 150g Khoya with 30g Maida and shape into crack-free small balls.",
      "Fry the balls in 100ml Ghee on low heat until dark golden brown.",
      "Soak the fried balls directly into the warm sugar syrup for 2 hours."
    ]
  }
};
