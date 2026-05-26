const fs = require("fs");
const path = require("path");

const rawRecipesData = [
  {
    title: "Vegetable Curry",
    category: "Lunch",
    time: "20 min",
    calories: "220 kcal",
    protein: "4g",
    fat: "12g",
    carbs: "25g",
    image:
      "https://images.unsplash.com/photo-1618449840665-9ed506d73a34?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Mixed vegetables", qty: 250, unit: "g" },
      { name: "Onion", qty: 80, unit: "g" },
      { name: "Tomato", qty: 100, unit: "g" },
      { name: "Coconut milk", qty: 200, unit: "ml" },
      { name: "Spices", qty: 10, unit: "g" },
    ],
    instructions: [
      "Sauté 1 onion and 1 chopped tomato until soft.",
      "Add 2 cups mixed vegetables (potatoes, carrots, peas).",
      "Stir in 1 tsp turmeric and 1 tsp chili powder.",
      "Pour in 1 cup coconut milk and 1/2 cup water.",
      "Simmer for 15 min until vegetables are tender.",
    ],
    aiAnalysis: {
      water: "1/2 cup",
      time: "20 minutes",
      steps: [
        "Sauté 80g onions and 100g tomato in 10ml oil for 5 minutes.",
        "Stir in 250g mixed vegetables and spices.",
        "Add 120ml water and 200ml coconut milk.",
        "Simmer covered on medium heat for 15 minutes.",
      ],
    },
  },
  {
    title: "Fish Curry",
    category: "Lunch",
    time: "25 min",
    calories: "340 kcal",
    protein: "28g",
    fat: "16g",
    carbs: "12g",
    image:
      "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Fish fillets", qty: 500, unit: "g" },
      { name: "Tamarind paste", qty: 20, unit: "g" },
      { name: "Coconut milk", qty: 60, unit: "ml" },
      { name: "Turmeric", qty: 5, unit: "g" },
      { name: "Chili powder", qty: 8, unit: "g" },
    ],
    instructions: [
      "Soak small ball of tamarind in 1/2 cup warm water.",
      "Heat oil and sauté ginger, garlic, and green chilies.",
      "Add tamarind water, 1 tsp turmeric, and 2 tsp chili powder.",
      "Gently place 500g fish pieces into the gravy.",
      "Cook for 10 min and finish with 1/4 cup coconut milk.",
    ],
    aiAnalysis: {
      water: "1/2 cup",
      time: "25 minutes",
      steps: [
        "Soak 20g tamarind in 120ml warm water.",
        "Sauté ginger, garlic, green chilies for 3 minutes.",
        "Mix tamarind extract, turmeric, chili powder, and cook for 5 minutes.",
        "Simmer 500g fish gently for 10 minutes, stir in 60ml coconut milk.",
      ],
    },
  },
  {
    title: "Beef Fry",
    category: "Lunch",
    time: "35 min",
    calories: "450 kcal",
    protein: "32g",
    fat: "28g",
    carbs: "8g",
    image:
      "https://images.unsplash.com/photo-1603360946369-fa99d57ee7ca?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Beef", qty: 500, unit: "g" },
      { name: "Onions", qty: 150, unit: "g" },
      { name: "Coconut slices", qty: 40, unit: "g" },
      { name: "Ginger", qty: 15, unit: "g" },
      { name: "Garam masala", qty: 10, unit: "g" },
    ],
    instructions: [
      "Pressure cook 500g beef with ginger and salt for 20 min.",
      "In a pan, sauté 2 sliced onions and 1/4 cup coconut slices.",
      "Add cooked beef and 2 tsp garam masala.",
      "Stir-fry on medium-high heat until the beef turns dark brown.",
      "Garnish with plenty of curry leaves.",
    ],
    aiAnalysis: {
      water: "1/4 cup (for pressure cooking)",
      time: "35 minutes",
      steps: [
        "Cook 500g beef cubes with ginger paste and salt in a pressure cooker (20 minutes).",
        "Sauté 150g onions and 40g coconut slices in 20ml oil.",
        "Add cooked beef and 10g garam masala, stir-fry until dark brown.",
      ],
    },
  },
  {
    title: "Fried Rice",
    category: "Lunch",
    time: "15 min",
    calories: "380 kcal",
    protein: "10g",
    fat: "12g",
    carbs: "58g",
    image:
      "https://images.unsplash.com/photo-1603133872878-6966b46b7f4c?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Cooked rice", qty: 400, unit: "g" },
      { name: "Soy sauce", qty: 30, unit: "ml" },
      { name: "Scallions", qty: 30, unit: "g" },
      { name: "Eggs or Mixed Veggies", qty: 120, unit: "g" },
      { name: "Oil", qty: 25, unit: "ml" },
    ],
    instructions: [
      "Heat 2 tbsp oil in a wok on high heat.",
      "Scramble 2 eggs or sauté 1 cup chopped veggies.",
      "Add 3 cups cold cooked rice.",
      "Pour 2 tbsp soy sauce and 1 tsp pepper.",
      "Toss for 3 min and top with 1/4 cup scallions.",
    ],
    aiAnalysis: {
      water: "None / Cooked rice used",
      time: "15 minutes",
      steps: [
        "Heat 25ml oil in a hot wok, sauté veggies/eggs.",
        "Add 400g cooked rice, toss continuously.",
        "Drizzle 30ml soy sauce and black pepper.",
        "Garnish with scallions and serve hot.",
      ],
    },
  },
  {
    title: "Lemon Rice",
    category: "Lunch",
    time: "15 min",
    calories: "320 kcal",
    protein: "6g",
    fat: "10g",
    carbs: "52g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Cooked rice", qty: 400, unit: "g" },
      { name: "Lemon juice", qty: 30, unit: "ml" },
      { name: "Peanuts", qty: 30, unit: "g" },
      { name: "Turmeric", qty: 3, unit: "g" },
      { name: "Curry leaves & spices", qty: 5, unit: "g" },
    ],
    instructions: [
      "Heat 1 tbsp oil; fry 2 tbsp peanuts until crunchy.",
      "Add 1 tsp mustard seeds and curry leaves.",
      "Add 1/2 tsp turmeric and turn off the heat.",
      "Mix in 3 cups cooked rice and 1 tsp salt.",
      "Squeeze the juice of 1 lemon over and mix well.",
    ],
    aiAnalysis: {
      water: "None / Rice pre-cooked",
      time: "15 minutes",
      steps: [
        "Fry 30g peanuts in 15ml oil until crunchy.",
        "Add mustard seeds, curry leaves, and 3g turmeric.",
        "Add 400g cooked rice and mix evenly off the heat.",
        "Pour 30ml fresh lemon juice and toss gently.",
      ],
    },
  },
  {
    title: "Thali Meals",
    category: "Lunch",
    time: "45 min",
    calories: "750 kcal",
    protein: "22g",
    fat: "18g",
    carbs: "110g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Basmati rice", qty: 150, unit: "g" },
      { name: "Dal", qty: 100, unit: "g" },
      { name: "Mixed vegetables (side)", qty: 200, unit: "g" },
      { name: "Curd", qty: 100, unit: "g" },
      { name: "Pickle & Papad", qty: 30, unit: "g" },
      { name: "Dessert (Payasam)", qty: 80, unit: "g" },
    ],
    instructions: [
      "Prepare 1 cup steamed rice as the center base.",
      "Arrange 4 small bowls around the rice.",
      "Fill bowls with Dal, Vegetable Curry, Curd, and Payasam.",
      "Place 1 papad and 1 tsp pickle on the side.",
      "Serve on a large round plate or banana leaf.",
    ],
    aiAnalysis: {
      water: "3.5 cups (for boiling rice and dal)",
      time: "45 minutes",
      steps: [
        "Cook 150g rice and 100g dal in separate pots.",
        "Sauté 200g mixed vegetables with mild spices.",
        "Portion curd, pickles, payasam dessert into bowls.",
        "Arrange everything around the central rice mound.",
      ],
    },
  },
  {
    title: "Chicken Fry",
    category: "Indian Favorites",
    time: "30 min",
    calories: "420 kcal",
    protein: "34g",
    fat: "24g",
    carbs: "12g",
    image:
      "https://images.unsplash.com/photo-1562967914-6c17e33bfd3f?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Chicken pieces", qty: 500, unit: "g" },
      { name: "Ginger-garlic paste", qty: 20, unit: "g" },
      { name: "Chili powder & spices", qty: 15, unit: "g" },
      { name: "Cornflour", qty: 30, unit: "g" },
    ],
    instructions: [
      "Marinate 500g chicken with G-G paste, lemon, and spices.",
      "Mix in 2 tbsp cornflour for extra crunch.",
      "Let it rest for 30 min.",
      "Deep fry in hot oil for 12–15 min.",
      "Serve hot with onion rings.",
    ],
    aiAnalysis: {
      water: "None / Deep fried",
      time: "30 minutes",
      steps: [
        "Mix 500g chicken with spices, ginger-garlic paste and marinate.",
        "Add 30g cornflour and coat evenly.",
        "Deep fry in oil at 180°C for 12-15 minutes until fully cooked.",
      ],
    },
  },
  {
    title: "Toast",
    category: "Breakfast",
    time: "5 min",
    calories: "180 kcal",
    protein: "4g",
    fat: "6g",
    carbs: "26g",
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Sliced bread", qty: 2, unit: "pcs" },
      { name: "Butter", qty: 10, unit: "g" },
      { name: "Jam or Honey", qty: 15, unit: "g" },
    ],
    instructions: [
      "Place 2 slices of bread in a toaster or on a pan.",
      "Heat until golden brown on both sides.",
      "Spread 1 tsp butter while the bread is hot.",
      "Top with 1 tsp jam or honey.",
      "Cut into triangles and serve immediately.",
    ],
    aiAnalysis: {
      water: "None",
      time: "5 minutes",
      steps: [
        "Toast 2 slices of bread.",
        "Apply 10g butter on hot surfaces.",
        "Drizzle 15g honey or spread jam.",
      ],
    },
  },
  {
    title: "Dal Tadka",
    category: "Indian Favorites",
    time: "20 min",
    calories: "210 kcal",
    protein: "11g",
    fat: "7g",
    carbs: "28g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Toor dal", qty: 150, unit: "g" },
      { name: "Garlic cloves", qty: 15, unit: "g" },
      { name: "Dried red chilies", qty: 3, unit: "pcs" },
      { name: "Cumin seeds", qty: 5, unit: "g" },
      { name: "Ghee", qty: 20, unit: "ml" },
    ],
    instructions: [
      "Pressure cook 1 cup toor dal with 3 cups water and turmeric.",
      "Heat 2 tbsp ghee in a small pan.",
      "Add 1 tsp cumin, 4 cloves garlic, and 2 red chilies.",
      "Fry until garlic turns golden brown.",
      "Pour the hot tempering over the cooked dal and mix.",
    ],
    aiAnalysis: {
      water: "3 cups (for pressure cooking)",
      time: "20 minutes",
      steps: [
        "Cook 150g dal in 3 cups water in pressure cooker (15 minutes).",
        "Heat 20ml ghee, sizzle cumin, garlic slices, and dry red chilies.",
        "Pour sizzling tempering over the mashed dal.",
      ],
    },
  },
  {
    title: "Aloo Paratha",
    category: "Indian Favorites",
    time: "25 min",
    calories: "290 kcal",
    protein: "6g",
    fat: "9g",
    carbs: "48g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Wheat flour", qty: 100, unit: "g" },
      { name: "Boiled potatoes", qty: 150, unit: "g" },
      { name: "Green chili", qty: 5, unit: "g" },
      { name: "Amchur powder", qty: 3, unit: "g" },
      { name: "Butter", qty: 15, unit: "g" },
    ],
    instructions: [
      "Mash 2 boiled potatoes with chili, salt, and 1/2 tsp amchur.",
      "Roll a ball of wheat dough into a small circle.",
      "Place 2 tbsp potato filling in the center and seal.",
      "Roll out gently into a 7-inch flatbread.",
      "Cook on a griddle with 1 tsp butter until golden spots appear.",
    ],
    aiAnalysis: {
      water: "1/3 cup (for dough)",
      time: "25 minutes",
      steps: [
        "Mix 100g wheat flour with warm water and knead to a soft dough.",
        "Combine 150g mashed potatoes with spices.",
        "Stuff, roll to 7-inches, and fry with 15g butter on a hot tawa.",
      ],
    },
  },
  {
    title: "Pav Bhaji",
    category: "Indian Favorites",
    time: "30 min",
    calories: "400 kcal",
    protein: "8g",
    fat: "18g",
    carbs: "54g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Mixed vegetables", qty: 250, unit: "g" },
      { name: "Pav bread rolls", qty: 4, unit: "pcs" },
      { name: "Butter", qty: 40, unit: "g" },
      { name: "Pav bhaji masala", qty: 15, unit: "g" },
      { name: "Onion & Tomato", qty: 150, unit: "g" },
    ],
    instructions: [
      "Boil and mash 2 potatoes, 1/2 cup peas, and 1/2 cup cauliflower.",
      "Sauté 1 onion and 1 tomato with 2 tbsp pav bhaji masala.",
      "Mix the mashed veggies with the masala and 1/2 cup water.",
      "Simmer with a large cube of butter for 10 min.",
      "Toast pav rolls with butter and serve with the bhaji.",
    ],
    aiAnalysis: {
      water: "1/2 cup",
      time: "30 minutes",
      steps: [
        "Boil 250g vegetables and mash them.",
        "Sauté onions and tomatoes in 20g butter, add bhaji spices.",
        "Add mashed vegetables, 120ml water, simmer for 10 minutes.",
        "Toast pav rolls in 20g butter and serve.",
      ],
    },
  },
  {
    title: "Bhel Puri",
    category: "Indian Favorites",
    time: "10 min",
    calories: "190 kcal",
    protein: "4g",
    fat: "6g",
    carbs: "32g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Puffed rice", qty: 60, unit: "g" },
      { name: "Sev", qty: 30, unit: "g" },
      { name: "Onion & Tomato", qty: 80, unit: "g" },
      { name: "Tamarind chutney", qty: 30, unit: "ml" },
      { name: "Fresh coriander", qty: 5, unit: "g" },
    ],
    instructions: [
      "Mix 2 cups puffed rice with 1/4 cup sev.",
      "Add 1 chopped onion and 1 chopped tomato.",
      "Stir in 2 tbsp tamarind chutney and a pinch of salt.",
      "Toss quickly so the puffed rice stays crunchy.",
      "Garnish with fresh coriander and serve immediately.",
    ],
    aiAnalysis: {
      water: "None",
      time: "10 minutes",
      steps: [
        "Mix 60g puffed rice and 30g sev.",
        "Add 80g finely chopped onions and tomatoes.",
        "Add 30ml tamarind chutney and toss immediately to serve.",
      ],
    },
  },
  {
    title: "Gajar Halwa",
    category: "Indian Favorites",
    time: "35 min",
    calories: "320 kcal",
    protein: "6g",
    fat: "14g",
    carbs: "45g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Grated carrots", qty: 250, unit: "g" },
      { name: "Full-fat milk", qty: 500, unit: "ml" },
      { name: "Sugar", qty: 100, unit: "g" },
      { name: "Ghee", qty: 30, unit: "ml" },
      { name: "Almonds & Cashews", qty: 20, unit: "g" },
    ],
    instructions: [
      "Sauté 2 cups grated carrots in 2 tbsp ghee for 5 min.",
      "Add 2 cups milk and cook until the milk evaporates.",
      "Stir in 1/2 cup sugar and cook until thick.",
      "Add 1/2 tsp cardamom powder.",
      "Garnish with chopped almonds and cashews.",
    ],
    aiAnalysis: {
      water: "None / Milk used",
      time: "35 minutes",
      steps: [
        "Roast 250g carrots in 30ml ghee.",
        "Add 500ml milk and simmer until fully absorbed.",
        "Add 100g sugar and cardamom, cook until thick, garnish with nuts.",
      ],
    },
  },
  {
    title: "Mango Pudding",
    category: "Indian Favorites",
    time: "20 min",
    calories: "180 kcal",
    protein: "3g",
    fat: "4g",
    carbs: "34g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Mango pulp", qty: 200, unit: "g" },
      { name: "Milk", qty: 200, unit: "ml" },
      { name: "Sugar", qty: 40, unit: "g" },
      { name: "Agar-agar (gelatin)", qty: 5, unit: "g" },
    ],
    instructions: [
      "Dissolve 1 tsp agar-agar in 1/4 cup warm water.",
      "Mix 1 cup mango pulp, 1 cup milk, and 2 tbsp sugar.",
      "Heat the mixture gently (do not boil).",
      "Stir in the dissolved agar-agar.",
      "Pour into molds and refrigerate for 4 hours until set.",
    ],
    aiAnalysis: {
      water: "1/4 cup (to dissolve agar)",
      time: "20 minutes + 4h cooling",
      steps: [
        "Dissolve 5g agar-agar in 60ml warm water.",
        "Mix 200g mango pulp, 200ml milk, 40g sugar and heat gently.",
        "Whisk in agar mixture, pour into cups, and chill.",
      ],
    },
  },
  {
    title: "Mango Lassi",
    category: "Indian Favorites",
    time: "10 min",
    calories: "210 kcal",
    protein: "5g",
    fat: "4g",
    carbs: "38g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Thick curd", qty: 250, unit: "g" },
      { name: "Mango pulp", qty: 120, unit: "g" },
      { name: "Sugar", qty: 30, unit: "g" },
      { name: "Cardamom powder", qty: 1, unit: "g" },
    ],
    instructions: [
      "Add 1 cup thick curd and 1/2 cup mango pulp to a blender.",
      "Add 2 tbsp sugar and a pinch of cardamom.",
      "Blend for 30 seconds until smooth and frothy.",
      "Pour into a tall glass.",
      "Serve chilled with a garnish of saffron strands.",
    ],
    aiAnalysis: {
      water: "None / Yogurt base",
      time: "5 minutes",
      steps: [
        "Place 250g curd, 120g mango pulp, 30g sugar, and cardamom in blender.",
        "Blend for 30 seconds until smooth and serve cold.",
      ],
    },
  },
  {
    title: "Virgin Mojito",
    category: "Lunch",
    time: "5 min",
    calories: "90 kcal",
    protein: "0g",
    fat: "0g",
    carbs: "22g",
    image:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Lemon wedges", qty: 2, unit: "pcs" },
      { name: "Mint leaves", qty: 8, unit: "pcs" },
      { name: "Sugar syrup", qty: 20, unit: "ml" },
      { name: "Club soda", qty: 200, unit: "ml" },
      { name: "Ice cubes", qty: 50, unit: "g" },
    ],
    instructions: [
      "Muddle 6 mint leaves and 2 lemon wedges in a glass.",
      "Add 1 tbsp sugar or simple syrup.",
      "Fill the glass with ice cubes.",
      "Top up with chilled club soda.",
      "Stir gently and garnish with a fresh mint sprig.",
    ],
    aiAnalysis: {
      water: "None / Soda used",
      time: "5 minutes",
      steps: [
        "Muddle lemon and mint directly in a glass.",
        "Add 20ml syrup, fill with ice, pour 200ml club soda.",
      ],
    },
  },
  {
    title: "Butter Chicken",
    category: "Dinner",
    time: "35 min",
    calories: "480 kcal",
    protein: "32g",
    fat: "35g",
    carbs: "10g",
    image:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Chicken cubes", qty: 500, unit: "g" },
      { name: "Tomato puree", qty: 200, unit: "g" },
      { name: "Butter", qty: 45, unit: "g" },
      { name: "Heavy cream", qty: 100, unit: "ml" },
      { name: "Kasuri methi & spices", qty: 10, unit: "g" },
    ],
    instructions: [
      "Marinate 500g chicken in yogurt and spices; grill until cooked.",
      "Sauté 1 cup tomato puree in 3 tbsp butter until thickened.",
      "Add 1 tsp sugar, salt, and 1 tsp garam masala.",
      "Toss in the grilled chicken and 1/2 cup heavy cream.",
      "Simmer for 5 min and garnish with 1 tsp crushed kasuri methi.",
    ],
    aiAnalysis: {
      water: "None / Cream based",
      time: "35 minutes",
      steps: [
        "Grill marinated 500g chicken.",
        "Sauté 200g tomato puree in 45g butter.",
        "Mix chicken, add 100ml cream and simmer for 5 minutes.",
      ],
    },
  },
  {
    title: "Veg Pulav",
    category: "Lunch",
    time: "25 min",
    calories: "320 kcal",
    protein: "6g",
    fat: "8g",
    carbs: "56g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Basmati rice", qty: 200, unit: "g" },
      { name: "Mixed vegetables", qty: 150, unit: "g" },
      { name: "Whole spices", qty: 5, unit: "g" },
      { name: "Ghee", qty: 20, unit: "ml" },
      { name: "Onion", qty: 60, unit: "g" },
    ],
    instructions: [
      "Soak 1 cup Basmati rice for 20 min.",
      "Sauté 1 cinnamon stick, 2 cloves, and 1 sliced onion in ghee.",
      "Add 1 cup mixed vegetables and sauté for 2 min.",
      "Add rice and 2 cups water; bring to a boil.",
      "Cover and cook on low heat for 12 min until water is absorbed.",
    ],
    aiAnalysis: {
      water: "2 cups (for rice)",
      time: "25 minutes",
      steps: [
        "Soak 200g Basmati rice.",
        "Sauté whole spices and 60g onion in 20ml ghee.",
        "Add 150g vegetables and rice, pour 400ml water and cook covered (12 minutes).",
      ],
    },
  },
  {
    title: "Momos (Veg)",
    category: "Dinner",
    time: "30 min",
    calories: "240 kcal",
    protein: "5g",
    fat: "4g",
    carbs: "45g",
    image:
      "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Maida flour", qty: 150, unit: "g" },
      { name: "Grated cabbage & carrot", qty: 200, unit: "g" },
      { name: "Ginger & Garlic", qty: 10, unit: "g" },
      { name: "Soy sauce", qty: 15, unit: "ml" },
    ],
    instructions: [
      "Knead 1 cup maida with water into a soft, firm dough.",
      "Sauté 1 cup grated cabbage and 1/2 cup carrot with ginger.",
      "Add 1 tsp soy sauce and salt to the veggie mix.",
      "Roll dough into thin circles, fill with 1 tbsp mixture, and pleat.",
      "Steam in a greased steamer for 10–12 min.",
    ],
    aiAnalysis: {
      water: "1/2 cup (dough) + steaming water",
      time: "30 minutes",
      steps: [
        "Knead 150g maida flour with 80ml water.",
        "Sauté cabbage and carrot with soy sauce.",
        "Stuff, pleat, and steam for 10 minutes.",
      ],
    },
  },
  {
    title: "Aloo Tikki",
    category: "Indian Favorites",
    time: "20 min",
    calories: "220 kcal",
    protein: "4g",
    fat: "10g",
    carbs: "30g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Boiled potatoes", qty: 300, unit: "g" },
      { name: "Cornflour", qty: 20, unit: "g" },
      { name: "Green chilies & spices", qty: 5, unit: "g" },
      { name: "Cilantro", qty: 10, unit: "g" },
      { name: "Oil", qty: 20, unit: "ml" },
    ],
    instructions: [
      "Mash 3 boiled potatoes with 2 tbsp cornflour.",
      "Mix in chopped chilies, salt, and cilantro.",
      "Shape into small, flat round patties.",
      "Heat 2 tbsp oil in a shallow pan.",
      "Fry patties on medium heat until both sides are dark golden brown.",
    ],
    aiAnalysis: {
      water: "None / Pan fried",
      time: "20 minutes",
      steps: [
        "Mash 300g potatoes with 20g cornflour, chilies, cilantro.",
        "Shape into round patties and fry in 20ml oil until crisp.",
      ],
    },
  },
  {
    title: "Spaghetti Carbonara",
    category: "Dinner",
    time: "20 min",
    calories: "460 kcal",
    protein: "18g",
    fat: "22g",
    carbs: "48g",
    image:
      "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Spaghetti", qty: 200, unit: "g" },
      { name: "Eggs", qty: 2, unit: "pcs" },
      { name: "Parmesan cheese", qty: 50, unit: "g" },
      { name: "Garlic cloves", qty: 10, unit: "g" },
      { name: "Black pepper & oil", qty: 15, unit: "g" },
    ],
    instructions: [
      "Boil 200g spaghetti in salted water; reserve 1/4 cup pasta water.",
      "Whisk 2 eggs with 1/2 cup grated parmesan.",
      "Sauté 2 cloves garlic in oil; remove garlic once browned.",
      "Toss hot pasta in the oil, then remove from heat.",
      "Quickly stir in egg mixture and pasta water to create a creamy sauce.",
    ],
    aiAnalysis: {
      water: "6 cups (for boiling spaghetti)",
      time: "20 minutes",
      steps: [
        "Boil 200g spaghetti in 6 cups salted water.",
        "Whisk eggs and 50g cheese.",
        "Sauté garlic, toss pasta, mix egg mix off the heat with 50ml pasta water.",
      ],
    },
  },
  {
    title: "Falafel",
    category: "Dinner",
    time: "25 min",
    calories: "280 kcal",
    protein: "10g",
    fat: "14g",
    carbs: "32g",
    image:
      "https://images.unsplash.com/photo-1547058886-af77993d452b?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Soaked chickpeas", qty: 200, unit: "g" },
      { name: "Parsley", qty: 30, unit: "g" },
      { name: "Garlic cloves", qty: 10, unit: "g" },
      { name: "Cumin", qty: 5, unit: "g" },
      { name: "All-purpose flour", qty: 20, unit: "g" },
    ],
    instructions: [
      "Blend 1 cup soaked chickpeas (not boiled) with parsley and garlic.",
      "Mix in 1 tsp cumin and 2 tbsp flour to bind.",
      "Shape into small balls or discs.",
      "Deep fry in hot oil for 4–5 min until dark brown.",
      "Serve inside pita bread with tahini or hummus.",
    ],
    aiAnalysis: {
      water: "None / Deep fried",
      time: "25 minutes",
      steps: [
        "Blend 200g chickpeas with parsley, garlic.",
        "Stir in cumin and 20g flour.",
        "Shape into balls and fry at 180°C until brown.",
      ],
    },
  },
  {
    title: "Strawberry Milkshake",
    category: "Breakfast",
    time: "5 min",
    calories: "250 kcal",
    protein: "6g",
    fat: "10g",
    carbs: "34g",
    image:
      "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Fresh strawberries", qty: 150, unit: "g" },
      { name: "Chilled milk", qty: 300, unit: "ml" },
      { name: "Sugar", qty: 25, unit: "g" },
      { name: "Vanilla ice cream", qty: 50, unit: "g" },
    ],
    instructions: [
      "Clean and hull 1 cup strawberries.",
      "Blend berries with 2 tbsp sugar into a smooth puree.",
      "Add 1.5 cups milk and 1 scoop vanilla ice cream.",
      "Blend again until frothy and thick.",
      "Pour into a glass and garnish with a strawberry slice.",
    ],
    aiAnalysis: {
      water: "None / Milk based",
      time: "5 minutes",
      steps: [
        "Puree 150g strawberries with 25g sugar.",
        "Add 300ml milk, 50g ice cream, and blend until creamy.",
      ],
    },
  },
  {
    title: "Iced Tea",
    category: "Lunch",
    time: "10 min",
    calories: "60 kcal",
    protein: "0g",
    fat: "0g",
    carbs: "15g",
    image:
      "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Tea bags", qty: 2, unit: "pcs" },
      { name: "Water", qty: 250, unit: "ml" },
      { name: "Lemon slices", qty: 3, unit: "pcs" },
      { name: "Honey", qty: 15, unit: "g" },
      { name: "Ice cubes", qty: 50, unit: "g" },
    ],
    instructions: [
      "Brew 2 tea bags in 1 cup boiling water for 5 min.",
      "Remove tea bags and stir in 1 tbsp honey.",
      "Let the tea cool to room temperature.",
      "Fill a tall glass with ice cubes and lemon slices.",
      "Pour the tea over ice and top with a splash of cold water.",
    ],
    aiAnalysis: {
      water: "1.25 cups",
      time: "10 minutes + cooling",
      steps: [
        "Steep 2 tea bags in 250ml hot water.",
        "Dissolve 15g honey. Let it cool.",
        "Pour over ice and top with 50ml cold water.",
      ],
    },
  },
  {
    title: "Lentil Soup (Dal Shorba)",
    category: "Lunch",
    time: "25 min",
    calories: "160 kcal",
    protein: "9g",
    fat: "4g",
    carbs: "22g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Moong dal", qty: 100, unit: "g" },
      { name: "Ginger-garlic paste", qty: 10, unit: "g" },
      { name: "Turmeric & spices", qty: 5, unit: "g" },
      { name: "Lemon juice", qty: 15, unit: "ml" },
      { name: "Butter or oil", qty: 10, unit: "ml" },
    ],
    instructions: [
      "Boil 1 cup moong dal with 4 cups water and turmeric until mushy.",
      "Sauté 1 tsp ginger-garlic paste in a little butter or oil.",
      "Mix the dal into the sautéed paste and whisk until smooth.",
      "Simmer for 5 min and add 1 tsp salt.",
      "Serve hot with a squeeze of lemon juice.",
    ],
    aiAnalysis: {
      water: "4 cups (for boiling dal)",
      time: "25 minutes",
      steps: [
        "Boil 100g dal in 4 cups water.",
        "Sauté ginger-garlic in 10ml butter.",
        "Whisk in dal, simmer for 5 minutes, finish with lemon juice.",
      ],
    },
  },
  {
    title: "Jeera Aloo",
    category: "Indian Favorites",
    time: "15 min",
    calories: "190 kcal",
    protein: "3g",
    fat: "8g",
    carbs: "27g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Boiled potatoes", qty: 300, unit: "g" },
      { name: "Cumin seeds", qty: 10, unit: "g" },
      { name: "Turmeric", qty: 3, unit: "g" },
      { name: "Green chili", qty: 5, unit: "g" },
      { name: "Oil", qty: 15, unit: "ml" },
    ],
    instructions: [
      "Cube 3 boiled potatoes into bite-sized pieces.",
      "Heat 2 tbsp oil and add 1.5 tsp cumin seeds until they sizzle.",
      "Add chopped green chilies and the potato cubes.",
      "Sprinkle 1/2 tsp turmeric and 1 tsp salt.",
      "Toss on high heat for 5 min until the potatoes are crispy.",
    ],
    aiAnalysis: {
      water: "None / Pan tossed",
      time: "15 minutes",
      steps: [
        "Cut 300g potatoes into cubes.",
        "Sizzle 10g cumin in 15ml oil.",
        "Add potatoes, turmeric, chilies, and fry for 5 minutes on high heat.",
      ],
    },
  },
  {
    title: "Garlic Bread",
    category: "Dinner",
    time: "10 min",
    calories: "280 kcal",
    protein: "6g",
    fat: "14g",
    carbs: "32g",
    image:
      "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Bread slices", qty: 4, unit: "pcs" },
      { name: "Softened butter", qty: 30, unit: "g" },
      { name: "Garlic cloves (minced)", qty: 15, unit: "g" },
      { name: "Oregano", qty: 2, unit: "g" },
      { name: "Grated cheese", qty: 30, unit: "g" },
    ],
    instructions: [
      "Mix 2 tbsp softened butter with 3 cloves minced garlic.",
      "Spread the garlic butter generously over 4 slices of bread.",
      "Sprinkle a pinch of oregano and 2 tbsp grated cheese.",
      "Bake at 200°C for 5–7 min until edges are golden.",
      "Serve warm as a side or a snack.",
    ],
    aiAnalysis: {
      water: "None / Baked",
      time: "10 minutes",
      steps: [
        "Mix 30g butter with minced garlic.",
        "Spread on bread, sprinkle oregano and 30g cheese.",
        "Bake at 200°C for 5-7 minutes.",
      ],
    },
  },
  {
    title: "Chicken Nuggets (Homemade)",
    category: "Dinner",
    time: "20 min",
    calories: "320 kcal",
    protein: "24g",
    fat: "16g",
    carbs: "18g",
    image:
      "https://images.unsplash.com/photo-1562967914-6c17e33bfd3f?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Chicken breast", qty: 250, unit: "g" },
      { name: "Breadcrumbs", qty: 80, unit: "g" },
      { name: "Egg", qty: 1, unit: "pcs" },
      { name: "Flour", qty: 30, unit: "g" },
      { name: "Oil", qty: 20, unit: "ml" },
    ],
    instructions: [
      "Cut 250g chicken into small cubes; season with salt and pepper.",
      "Coat chicken in 1/4 cup flour, then dip into a beaten egg.",
      "Press firmly into 1/2 cup breadcrumbs until fully coated.",
      "Deep fry in hot oil for 6–8 min until crunchy.",
      "Serve with 2 tbsp tomato ketchup.",
    ],
    aiAnalysis: {
      water: "None",
      time: "20 minutes",
      steps: [
        "Cut and season 250g chicken breast.",
        "Coat in flour, egg wash, and coat in 80g breadcrumbs.",
        "Deep fry until golden (6-8 minutes).",
      ],
    },
  },
  {
    title: "Caramel Popcorn",
    category: "Dinner",
    time: "15 min",
    calories: "260 kcal",
    protein: "3g",
    fat: "10g",
    carbs: "38g",
    image:
      "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Popped popcorn", qty: 60, unit: "g" },
      { name: "Sugar", qty: 100, unit: "g" },
      { name: "Butter", qty: 15, unit: "g" },
    ],
    instructions: [
      "Melt 1/2 cup sugar in a pan until it turns into a brown liquid.",
      "Quickly stir in 1 tbsp butter and a pinch of salt.",
      "Pour the caramel over 4 cups of popped popcorn.",
      "Toss immediately with a spatula to coat every piece.",
      "Spread on a tray to cool and harden for 10 min.",
    ],
    aiAnalysis: {
      water: "None / Melted sugar",
      time: "15 minutes",
      steps: ["Melt 100g sugar to caramel.", "Stir in 15g butter, coat 60g popcorn immediately."],
    },
  },
  {
    title: "Sweet Pancakes (Crepe Style)",
    category: "Breakfast",
    time: "15 min",
    calories: "280 kcal",
    protein: "7g",
    fat: "8g",
    carbs: "42g",
    image:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Flour", qty: 120, unit: "g" },
      { name: "Milk", qty: 250, unit: "ml" },
      { name: "Egg", qty: 1, unit: "pcs" },
      { name: "Sugar & spreads", qty: 30, unit: "g" },
    ],
    instructions: [
      "Whisk 1 cup flour, 1.5 cups milk, and 1 egg into a thin batter.",
      "Pour a thin layer onto a hot, buttered pan.",
      "Cook for 1 min per side until light brown.",
      "Spread 1 tbsp Nutella or add sliced strawberries inside.",
      "Roll or fold the pancake and serve.",
    ],
    aiAnalysis: {
      water: "None / Milk based",
      time: "15 minutes",
      steps: [
        "Whisk 120g flour, 250ml milk, and egg.",
        "Cook thin layers on a buttered pan.",
        "Add spreads and serve folded.",
      ],
    },
  },
  {
    title: "Pineapple Juice",
    category: "Breakfast",
    time: "10 min",
    calories: "120 kcal",
    protein: "1g",
    fat: "0g",
    carbs: "28g",
    image:
      "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Pineapple chunks", qty: 300, unit: "g" },
      { name: "Sugar", qty: 25, unit: "g" },
      { name: "Black salt", qty: 2, unit: "g" },
      { name: "Water", qty: 100, unit: "ml" },
    ],
    instructions: [
      "Peel and core 1 medium pineapple; cut into chunks.",
      "Blend with 1/2 cup water and 2 tbsp sugar.",
      "Strain the juice through a fine sieve to remove pulp.",
      "Add a pinch of black salt for a tangy kick.",
      "Pour into a glass over 4 ice cubes.",
    ],
    aiAnalysis: {
      water: "1/2 cup",
      time: "10 minutes",
      steps: [
        "Blend 300g pineapple with 100ml water and 25g sugar.",
        "Strain, add black salt, serve over ice.",
      ],
    },
  },
  {
    title: "Honey Lemon Ginger Tea",
    category: "Breakfast",
    time: "10 min",
    calories: "50 kcal",
    protein: "0g",
    fat: "0g",
    carbs: "12g",
    image:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Fresh ginger", qty: 15, unit: "g" },
      { name: "Lemon juice", qty: 15, unit: "ml" },
      { name: "Honey", qty: 15, unit: "g" },
      { name: "Water", qty: 350, unit: "ml" },
    ],
    instructions: [
      "Boil 2 cups water with 1 inch crushed ginger for 5 min.",
      "Strain the tea into a cup.",
      "Stir in 1 tbsp honey until dissolved.",
      "Add 1 tbsp lemon juice.",
      "Drink warm for a soothing, healthy boost.",
    ],
    aiAnalysis: {
      water: "2 cups",
      time: "10 minutes",
      steps: [
        "Boil 15g ginger in 350ml water for 5 minutes.",
        "Strain, stir in 15g honey and lemon juice.",
      ],
    },
  },
  {
    title: "Kadhi Pakora",
    category: "Indian Favorites",
    time: "35 min",
    calories: "280 kcal",
    protein: "8g",
    fat: "14g",
    carbs: "30g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Yogurt (Curd)", qty: 200, unit: "g" },
      { name: "Gram flour (Besan)", qty: 100, unit: "g" },
      { name: "Onions", qty: 100, unit: "g" },
      { name: "Turmeric & Ginger", qty: 10, unit: "g" },
      { name: "Ghee & spices", qty: 15, unit: "ml" },
    ],
    instructions: [
      "Mix 1 cup curd with 2 tbsp besan and 3 cups water; whisk well.",
      "Make a thick paste with 1/2 cup besan, spices, and sliced onions; deep fry as small balls (pakoras).",
      "Boil the curd mixture with turmeric and ginger for 15 min on low heat.",
      "Add the fried pakoras to the simmering gravy.",
      "Temper with cumin, dried red chilies, and curry leaves in 1 tbsp ghee.",
    ],
    aiAnalysis: {
      water: "3 cups",
      time: "35 minutes",
      steps: [
        "Whisk curd and gram flour with 3 cups water.",
        "Fry onion pakoras separately.",
        "Boil gravy, add pakoras, temper with ghee.",
      ],
    },
  },
  {
    title: "Baingan Bharta",
    category: "Indian Favorites",
    time: "30 min",
    calories: "170 kcal",
    protein: "4g",
    fat: "9g",
    carbs: "18g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Large eggplant", qty: 400, unit: "g" },
      { name: "Onion & Tomato", qty: 150, unit: "g" },
      { name: "Garlic cloves", qty: 15, unit: "g" },
      { name: "Green chili & oil", qty: 15, unit: "ml" },
    ],
    instructions: [
      "Roast 1 large eggplant over an open flame until the skin is charred and the inside is soft.",
      "Peel the skin and mash the pulp thoroughly.",
      "Sauté 1 chopped onion and 2 cloves garlic in oil until golden.",
      "Add 2 chopped tomatoes and spices; cook until soft.",
      "Mix in the mashed eggplant and cook for 5 min on medium heat.",
    ],
    aiAnalysis: {
      water: "None",
      time: "30 minutes",
      steps: [
        "Roast 400g eggplant, peel and mash.",
        "Sauté 150g onions and tomatoes in 15ml oil.",
        "Combine and cook eggplant pulp on medium for 5 minutes.",
      ],
    },
  },
  {
    title: "Hummus",
    category: "Lunch",
    time: "15 min",
    calories: "230 kcal",
    protein: "8g",
    fat: "14g",
    carbs: "22g",
    image:
      "https://images.unsplash.com/photo-1574708759560-63162383c27e?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Boiled chickpeas", qty: 250, unit: "g" },
      { name: "Tahini paste", qty: 60, unit: "g" },
      { name: "Garlic cloves", qty: 10, unit: "g" },
      { name: "Lemon juice", qty: 30, unit: "ml" },
      { name: "Olive oil", qty: 45, unit: "ml" },
    ],
    instructions: [
      "Blend 2 cups boiled chickpeas with 1/4 cup tahini and 2 cloves garlic.",
      "Add 2 tbsp lemon juice and a pinch of salt.",
      "Slowly pour in 3 tbsp olive oil while blending until creamy.",
      "If too thick, add 1 tbsp warm water to reach the desired consistency.",
      "Serve in a bowl topped with a drizzle of olive oil and paprika.",
    ],
    aiAnalysis: {
      water: "1-2 tbsp (optional)",
      time: "15 minutes",
      steps: [
        "Blend 250g chickpeas, 60g tahini, garlic, and lemon juice.",
        "Drizzle 45ml olive oil while running blender until smooth.",
      ],
    },
  },
  {
    title: "Greek Salad",
    category: "Lunch",
    time: "10 min",
    calories: "210 kcal",
    protein: "5g",
    fat: "18g",
    carbs: "10g",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Cucumber & Tomato", qty: 250, unit: "g" },
      { name: "Feta cheese", qty: 50, unit: "g" },
      { name: "Black olives", qty: 30, unit: "g" },
      { name: "Olive oil & Vinegar", qty: 25, unit: "ml" },
    ],
    instructions: [
      "Chop 1 cucumber and 2 tomatoes into large chunks.",
      "Mix in 1/4 cup sliced black olives and 1/2 sliced red onion.",
      "Top with 50g cubed feta cheese.",
      "Drizzle with 2 tbsp olive oil and 1 tsp vinegar.",
      "Sprinkle 1/2 tsp dried oregano over the top and toss gently.",
    ],
    aiAnalysis: {
      water: "None",
      time: "10 minutes",
      steps: [
        "Chop cucumber, tomatoes, onions.",
        "Add 30g olives, top with 50g feta.",
        "Drizzle 25ml oil/vinegar, add oregano.",
      ],
    },
  },
  {
    title: "Veg Manchurian",
    category: "Dinner",
    time: "30 min",
    calories: "290 kcal",
    protein: "5g",
    fat: "14g",
    carbs: "36g",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Grated cabbage & carrot", qty: 250, unit: "g" },
      { name: "Cornflour", qty: 40, unit: "g" },
      { name: "Soy sauce & sauce mix", qty: 45, unit: "ml" },
      { name: "Ginger-garlic paste", qty: 15, unit: "g" },
    ],
    instructions: [
      "Mix 1 cup grated cabbage and 1/2 cup carrot with 3 tbsp cornflour and spices.",
      "Form into small balls and deep fry until crispy; set aside.",
      "Sauté ginger, garlic, and green chilies in a pan with 1 tbsp oil.",
      "Add 2 tbsp soy sauce, 1 tbsp ketchup, and a little water.",
      "Toss the fried balls into the sauce and cook for 2 min until coated.",
    ],
    aiAnalysis: {
      water: "1/4 cup",
      time: "30 minutes",
      steps: [
        "Fry balls made of 250g vegetables and 40g cornflour.",
        "Sauté ginger-garlic, add 45ml sauces and 60ml water.",
        "Simmer balls in sauce for 2 minutes.",
      ],
    },
  },
  {
    title: "Chili Paneer",
    category: "Dinner",
    time: "20 min",
    calories: "340 kcal",
    protein: "16g",
    fat: "24g",
    carbs: "14g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Paneer cubes", qty: 200, unit: "g" },
      { name: "Bell peppers & Onion", qty: 150, unit: "g" },
      { name: "Soy & chili sauce", qty: 30, unit: "ml" },
      { name: "Cornflour & oil", qty: 25, unit: "g" },
    ],
    instructions: [
      "Coat 200g paneer cubes in cornflour and shallow fry until golden.",
      "Sauté 1 cubed onion and 1 cubed bell pepper on high heat for 2 min.",
      "Add 1 tbsp soy sauce and 1 tbsp chili sauce.",
      "Stir in the fried paneer cubes.",
      "Garnish with chopped spring onion greens.",
    ],
    aiAnalysis: {
      water: "None / Stir fry",
      time: "20 minutes",
      steps: [
        "Fry 200g paneer cubes coated in cornflour.",
        "Sauté 150g peppers/onion.",
        "Mix in sauces, stir in paneer, toss and garnish.",
      ],
    },
  },
  {
    title: "Chikoo Shake",
    category: "Breakfast",
    time: "5 min",
    calories: "220 kcal",
    protein: "5g",
    fat: "6g",
    carbs: "38g",
    image:
      "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Sapodilla (Chikoo)", qty: 3, unit: "pcs" },
      { name: "Milk", qty: 250, unit: "ml" },
      { name: "Sugar", qty: 15, unit: "g" },
      { name: "Ice cubes", qty: 4, unit: "pcs" },
    ],
    instructions: [
      "Peel and deseed 3 ripe chikoos.",
      "Blend the fruit with 1.5 cups chilled milk and 1 tbsp sugar.",
      "Add 3 ice cubes for a thicker, colder consistency.",
      "Blend for 45 seconds until smooth.",
      "Pour into a glass and serve immediately.",
    ],
    aiAnalysis: {
      water: "None / Milk base",
      time: "5 minutes",
      steps: [
        "Blend 3 chikoos, 250ml milk, and 15g sugar.",
        "Add ice cubes and blend for 45 seconds.",
      ],
    },
  },
  {
    title: "Fruit Custard",
    category: "Dinner",
    time: "20 min",
    calories: "210 kcal",
    protein: "5g",
    fat: "6g",
    carbs: "35g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Milk", qty: 400, unit: "ml" },
      { name: "Custard powder", qty: 20, unit: "g" },
      { name: "Sugar", qty: 45, unit: "g" },
      { name: "Mixed fruits", qty: 150, unit: "g" },
    ],
    instructions: [
      "Boil 2 cups milk with 3 tbsp sugar.",
      "Dissolve 2 tbsp custard powder in 1/4 cup cold milk; stir into the boiling milk.",
      "Cook until the mixture thickens; then cool to room temperature.",
      "Chop mixed fruits and add them to the cooled custard.",
      "Refrigerate for 2 hours and serve chilled.",
    ],
    aiAnalysis: {
      water: "None / Milk based",
      time: "20 minutes + 2h cooling",
      steps: [
        "Dissolve 20g custard powder in cold milk.",
        "Boil 400ml milk with 45g sugar, whisk in custard slurry until thick.",
        "Cool down, stir in 150g chopped fruits, and chill.",
      ],
    },
  },
  {
    title: "Kerala Fish Molee",
    category: "Indian Favorites",
    time: "30 min",
    calories: "320 kcal",
    protein: "26g",
    fat: "22g",
    carbs: "10g",
    image:
      "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Fish fillets", qty: 500, unit: "g" },
      { name: "Coconut milk (thick & thin)", qty: 300, unit: "ml" },
      { name: "Onion & Tomatoes", qty: 150, unit: "g" },
      { name: "Ginger & Green chilies", qty: 15, unit: "g" },
    ],
    instructions: [
      "Marinate 500g fish pieces with turmeric, lemon juice, and salt for 20 min.",
      "Shallow fry the fish in 1 tbsp coconut oil for 1 min per side; set aside.",
      "Sauté 1 sliced onion, 1 tbsp ginger, and 3 green chilies in oil.",
      "Pour in 2 cups thin coconut milk and bring to a slow simmer.",
      "Add the fish and 1 sliced tomato; simmer covered for 8 min, then stir in 1/2 cup thick coconut milk and remove from heat.",
    ],
    aiAnalysis: {
      water: "None / Coconut milk based",
      time: "30 minutes",
      steps: [
        "Briefly fry 500g marinated fish.",
        "Sauté aromatics, simmer in 240ml thin coconut milk.",
        "Add fish, tomato, simmer 8 minutes, finish with 60ml thick coconut milk.",
      ],
    },
  },
  {
    title: "Malabar Parotta",
    category: "Indian Favorites",
    time: "40 min",
    calories: "360 kcal",
    protein: "7g",
    fat: "14g",
    carbs: "52g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "All-purpose flour (Maida)", qty: 300, unit: "g" },
      { name: "Milk", qty: 60, unit: "ml" },
      { name: "Sugar", qty: 15, unit: "g" },
      { name: "Oil or Ghee", qty: 45, unit: "ml" },
    ],
    instructions: [
      "Knead 3 cups flour, 1 egg, 1 tbsp sugar, and 1/4 cup milk into a soft dough.",
      "Coat the dough with 1 tbsp oil and let it rest covered for 2 hours.",
      "Divide into balls; roll each ball very thin and brush with 1 tsp oil.",
      "Pleat or cut the dough into strips, roll it tightly into a spiral shape, and flatten gently.",
      "Cook on a hot griddle with 1 tsp ghee per side until golden brown and flaky layers separate.",
    ],
    aiAnalysis: {
      water: "1/2 cup (for kneading)",
      time: "40 minutes + resting",
      steps: [
        "Knead 300g flour with 60ml milk, 15g sugar, and water.",
        "Rest dough, stretch extremely thin, oil, pleat, and roll to spiral.",
        "Flatten and fry in ghee until flaky.",
      ],
    },
  },
  {
    title: "Chicken Tikka Masala",
    category: "Dinner",
    time: "35 min",
    calories: "440 kcal",
    protein: "34g",
    fat: "28g",
    carbs: "12g",
    image:
      "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Chicken cubes", qty: 500, unit: "g" },
      { name: "Yogurt & Heavy cream", qty: 150, unit: "ml" },
      { name: "Tomato puree", qty: 200, unit: "g" },
      { name: "Onion & spices", qty: 120, unit: "g" },
    ],
    instructions: [
      "Marinate 500g chicken in 1/2 cup yogurt and spices; grill for 15 min.",
      "Sauté 1 chopped onion and 1 tsp ginger-garlic paste until golden.",
      "Pour in 1 cup tomato puree and simmer until the oil separates.",
      "Stir in the grilled chicken cubes and 1/2 cup water; cook for 5 min.",
      "Finish by mixing in 1/4 cup heavy cream and a pinch of garam masala.",
    ],
    aiAnalysis: {
      water: "1/2 cup",
      time: "35 minutes",
      steps: [
        "Grill marinated 500g chicken.",
        "Cook onion, ginger-garlic, tomato puree.",
        "Add chicken, 120ml water, simmer 5 minutes, stir in 60ml cream.",
      ],
    },
  },
  {
    title: "Jeera Rice",
    category: "Lunch",
    time: "20 min",
    calories: "280 kcal",
    protein: "5g",
    fat: "8g",
    carbs: "48g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Basmati rice", qty: 200, unit: "g" },
      { name: "Cumin seeds (Jeera)", qty: 8, unit: "g" },
      { name: "Ghee", qty: 25, unit: "ml" },
      { name: "Whole spices", qty: 3, unit: "g" },
    ],
    instructions: [
      "Wash and soak 1 cup Basmati rice for 20 min; drain completely.",
      "Heat 2 tbsp ghee in a pot; add 1.5 tsp cumin seeds and 2 cloves.",
      "Once the cumin splutters, add the soaked rice and toast gently for 1 min.",
      "Pour in 2 cups water and add 1 tsp salt.",
      "Bring to a boil, then cover and simmer on low heat for 12 min until fluffy.",
    ],
    aiAnalysis: {
      water: "2 cups (for rice)",
      time: "20 minutes",
      steps: [
        "Soak 200g Basmati rice.",
        "Sizzle 8g cumin in 25ml ghee, toast rice.",
        "Add 400ml water, cook covered on low (12 minutes).",
      ],
    },
  },
  {
    title: "Aloo Matar",
    category: "Indian Favorites",
    time: "25 min",
    calories: "220 kcal",
    protein: "5g",
    fat: "6g",
    carbs: "34g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Potatoes (Aloo)", qty: 200, unit: "g" },
      { name: "Green peas (Matar)", qty: 150, unit: "g" },
      { name: "Onion & Tomato puree", qty: 150, unit: "g" },
      { name: "Spices", qty: 8, unit: "g" },
    ],
    instructions: [
      "Cube 2 potatoes and set aside with 1 cup green peas.",
      "Sauté 1 chopped onion and 1 tsp ginger paste in oil.",
      "Add 1/2 cup tomato puree, 1/2 tsp turmeric, and 1 tsp chili powder.",
      "Toss in the potatoes, peas, 1 tsp salt, and 1 cup water.",
      "Cover and cook on medium heat for 15 min until potatoes are soft.",
    ],
    aiAnalysis: {
      water: "1 cup",
      time: "25 minutes",
      steps: [
        "Sauté onion and spices.",
        "Add 200g potatoes, 150g peas, tomato, and 240ml water.",
        "Simmer covered for 15 minutes.",
      ],
    },
  },
  {
    title: "Mix Veg Raita",
    category: "Lunch",
    time: "10 min",
    calories: "110 kcal",
    protein: "5g",
    fat: "4g",
    carbs: "12g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Plain curd (Yogurt)", qty: 250, unit: "g" },
      { name: "Cucumber & Tomato", qty: 100, unit: "g" },
      { name: "Onion", qty: 40, unit: "g" },
      { name: "Roasted cumin powder", qty: 3, unit: "g" },
    ],
    instructions: [
      "Whisk 2 cups fresh curd until completely smooth.",
      "Finely chop 1/2 cucumber, 1/2 tomato, and 1 small onion.",
      "Mix the chopped vegetables directly into the whisked curd.",
      "Add 1/2 tsp salt and 1/2 tsp black pepper.",
      "Sprinkle 1/2 tsp roasted cumin powder over the top before serving chilled.",
    ],
    aiAnalysis: {
      water: "None / Yogurt based",
      time: "10 minutes",
      steps: [
        "Whisk 250g yogurt.",
        "Chop cucumber, tomatoes, and onion.",
        "Combine everything, garnish with cumin powder.",
      ],
    },
  },
  {
    title: "Onion Bhaji (Pyaza Pakoda)",
    category: "Indian Favorites",
    time: "15 min",
    calories: "260 kcal",
    protein: "6g",
    fat: "14g",
    carbs: "28g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Sliced onions", qty: 200, unit: "g" },
      { name: "Gram flour (Besan)", qty: 100, unit: "g" },
      { name: "Rice flour", qty: 20, unit: "g" },
      { name: "Green chilies", qty: 5, unit: "g" },
      { name: "Oil", qty: 25, unit: "ml" },
    ],
    instructions: [
      "Thinly slice 2 large onions and separate the layers in a bowl.",
      "Mix in 1 cup besan, 2 tbsp rice flour, and 1/2 tsp turmeric.",
      "Add chopped green chilies, salt, and 2 tbsp water to form a thick, sticky coating.",
      "Drop small, rough clumps of the onion mixture into hot oil.",
      "Deep fry on medium heat for 5 min until completely crispy and golden.",
    ],
    aiAnalysis: {
      water: "2 tbsp",
      time: "15 minutes",
      steps: [
        "Coat 200g onions in 100g besan and 20g rice flour.",
        "Mix with 30ml water to bind.",
        "Fry clusters in oil at 180°C for 5 minutes.",
      ],
    },
  },
  {
    title: "Bread Upma",
    category: "Breakfast",
    time: "15 min",
    calories: "240 kcal",
    protein: "5g",
    fat: "8g",
    carbs: "36g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Bread slices", qty: 6, unit: "pcs" },
      { name: "Onion & Tomato", qty: 100, unit: "g" },
      { name: "Mustard seeds & Curry leaves", qty: 5, unit: "g" },
      { name: "Turmeric & oil", qty: 15, unit: "g" },
    ],
    instructions: [
      "Cut 6 slices of bread into bite-sized cubes; toast them slightly.",
      "Heat 1 tbsp oil; crackle 1 tsp mustard seeds and a few curry leaves.",
      "Sauté 1 chopped onion and 1 green chili until translucent.",
      "Add 1 chopped tomato, 1/4 tsp turmeric, and 1/2 tsp salt; cook until soft.",
      "Toss the bread cubes into the masala, mix well for 2 min, and serve hot.",
    ],
    aiAnalysis: {
      water: "None / Dry toss",
      time: "15 minutes",
      steps: [
        "Cube and toast 6 slices of bread.",
        "Sauté seasoning, onions, and tomato.",
        "Add bread cubes, toss for 2 minutes.",
      ],
    },
  },
  {
    title: "Masala Chai",
    category: "Breakfast",
    time: "10 min",
    calories: "90 kcal",
    protein: "3g",
    fat: "3g",
    carbs: "12g",
    image:
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Tea leaves", qty: 10, unit: "g" },
      { name: "Milk", qty: 200, unit: "ml" },
      { name: "Ginger & Cardamom", qty: 10, unit: "g" },
      { name: "Water", qty: 200, unit: "ml" },
    ],
    instructions: [
      "Bring 1 cup water to a boil with 1 inch crushed ginger and 2 crushed cardamoms.",
      "Add 2 tsp tea leaves and let it simmer for 2 min until dark.",
      "Pour in 1 cup milk and add 2 tsp sugar.",
      "Bring the tea to a rolling boil twice, adjusting the heat so it doesn't spill.",
      "Strain through a sieve directly into cups and serve hot.",
    ],
    aiAnalysis: {
      water: "1 cup",
      time: "10 minutes",
      steps: [
        "Boil 10g ginger/cardamom in 200ml water.",
        "Steep tea leaves, add 200ml milk, sugar.",
        "Boil, strain, and serve.",
      ],
    },
  },
  {
    title: "Kaju Katli",
    category: "Indian Favorites",
    time: "25 min",
    calories: "340 kcal",
    protein: "6g",
    fat: "18g",
    carbs: "38g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Cashews (Kaju)", qty: 150, unit: "g" },
      { name: "Sugar", qty: 100, unit: "g" },
      { name: "Water", qty: 60, unit: "ml" },
      { name: "Ghee", qty: 10, unit: "ml" },
    ],
    instructions: [
      "Grind 1 cup raw cashews into a fine powder; do not over-blend to avoid oil extraction.",
      "Dissolve 1/2 cup sugar in 1/4 cup water over low heat until sticky.",
      "Stir in the cashew powder and 1 tsp ghee; stir constantly for 8 min until a dough forms.",
      "Turn the dough onto a greased surface, roll it thin while warm, and let it cool.",
      "Cut diagonally into diamond shapes and serve.",
    ],
    aiAnalysis: {
      water: "1/4 cup (for syrup)",
      time: "25 minutes",
      steps: [
        "Grind 150g cashews to powder.",
        "Dissolve 100g sugar in 60ml water, stir in cashews/ghee.",
        "Knead slightly, roll thin, cut into diamonds.",
      ],
    },
  },
  {
    title: "Shahi Paneer",
    category: "Dinner",
    time: "25 min",
    calories: "380 kcal",
    protein: "14g",
    fat: "30g",
    carbs: "12g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Paneer", qty: 200, unit: "g" },
      { name: "Onion & Tomato puree", qty: 150, unit: "g" },
      { name: "Cashews", qty: 30, unit: "g" },
      { name: "Heavy cream", qty: 45, unit: "ml" },
      { name: "Ghee & spices", qty: 15, unit: "ml" },
    ],
    instructions: [
      "Boil 1 chopped onion and 10 cashews in water for 10 min; grind to a smooth paste.",
      "Sauté the onion-cashew paste in 1 tbsp ghee until fragrant.",
      "Add 1/2 cup tomato puree, 1/2 tsp turmeric, and 1 tsp chili powder.",
      "Mix in 200g paneer cubes and 1/2 cup water; simmer for 5 min.",
      "Stir in 3 tbsp heavy cream and a pinch of saffron before serving.",
    ],
    aiAnalysis: {
      water: "1/2 cup",
      time: "25 minutes",
      steps: [
        "Grind boiled onion and 30g cashews.",
        "Sauté paste, add tomato, spices, and 120ml water.",
        "Simmer 200g paneer, finish with 45ml cream.",
      ],
    },
  },
  {
    title: "Ghee Rice",
    category: "Lunch",
    time: "20 min",
    calories: "320 kcal",
    protein: "5g",
    fat: "14g",
    carbs: "45g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Basmati rice", qty: 200, unit: "g" },
      { name: "Ghee", qty: 45, unit: "ml" },
      { name: "Cashews & Raisins", qty: 30, unit: "g" },
      { name: "Sliced onion", qty: 60, unit: "g" },
    ],
    instructions: [
      "Wash and soak 1 cup Basmati rice for 20 min; drain completely.",
      "Heat 3 tbsp ghee in a pot; fry 10 cashews and 10 raisins until golden, then remove.",
      "In the same ghee, fry 1/2 sliced onion until crispy brown; set aside for garnish.",
      "Add the soaked rice to the pot and gently stir for 2 min to coat with ghee.",
      "Pour in 2 cups water + 1 tsp salt, bring to a boil, then cover and cook on low heat for 12 min.",
    ],
    aiAnalysis: {
      water: "2 cups (for rice)",
      time: "20 minutes",
      steps: [
        "Soak 200g rice.",
        "Fry nuts and 60g onions in 45ml ghee.",
        "Toast rice, pour 400ml water and cook covered on low (12 minutes).",
      ],
    },
  },
  {
    title: "Eggplant Masala (Baingan Masala)",
    category: "Indian Favorites",
    time: "25 min",
    calories: "180 kcal",
    protein: "4g",
    fat: "12g",
    carbs: "16g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Small eggplants", qty: 400, unit: "g" },
      { name: "Onion & Tomato", qty: 150, unit: "g" },
      { name: "Ginger-garlic paste", qty: 15, unit: "g" },
      { name: "Peanut powder", qty: 20, unit: "g" },
    ],
    instructions: [
      "Make a cross-cut on 4 small eggplants; shallow fry in oil until soft, then remove.",
      "Sauté 1 chopped onion and 1 tsp ginger-garlic paste until soft.",
      "Add 1 chopped tomato, 1 tsp chili powder, and 2 tbsp roasted peanut powder.",
      "Pour in 1/2 cup water to create a thick gravy; add the fried eggplants.",
      "Cover and simmer on low heat for 8 min until the gravy coats the eggplants.",
    ],
    aiAnalysis: {
      water: "1/2 cup",
      time: "25 minutes",
      steps: [
        "Shallow fry eggplants.",
        "Cook onion, tomato, spices, and 20g peanut powder.",
        "Pour 120ml water, add eggplants, and simmer.",
      ],
    },
  },
  {
    title: "Aloo Poori",
    category: "Indian Favorites",
    time: "30 min",
    calories: "450 kcal",
    protein: "8g",
    fat: "22g",
    carbs: "62g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Wheat flour", qty: 200, unit: "g" },
      { name: "Boiled potatoes", qty: 250, unit: "g" },
      { name: "Tomato & Spices", qty: 100, unit: "g" },
      { name: "Oil", qty: 30, unit: "ml" },
    ],
    instructions: [
      "Knead 2 cups wheat flour with water and 1 tsp oil into a stiff dough; roll into small discs and deep-fry to make pooris.",
      "For the bhaji, heat 1 tbsp oil and crackle 1 tsp mustard seeds and curry leaves.",
      "Sauté 1 chopped tomato with 1/2 tsp turmeric until mushy.",
      "Add 3 mashed boiled potatoes, 1.5 cups water, and 1 tsp salt.",
      "Boil for 5 min until thick, and serve hot with the fried pooris.",
    ],
    aiAnalysis: {
      water: "1.5 cups (for curry) + 1/2 cup (dough)",
      time: "30 minutes",
      steps: [
        "Knead dough, roll, and deep fry pooris.",
        "Prepare bhaji with mustard, curry leaves, tomato, mashed potatoes, and 350ml water.",
      ],
    },
  },
  {
    title: "Besan Chilla (Savory Pancakes)",
    category: "Breakfast",
    time: "15 min",
    calories: "220 kcal",
    protein: "9g",
    fat: "8g",
    carbs: "28g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Gram flour (Besan)", qty: 120, unit: "g" },
      { name: "Onion & Tomato", qty: 100, unit: "g" },
      { name: "Ajwain (Carom seeds)", qty: 3, unit: "g" },
      { name: "Green chili & oil", qty: 15, unit: "g" },
    ],
    instructions: [
      "Mix 1 cup besan, 1/4 cup chopped onion, and 1/4 cup chopped tomato in a bowl.",
      "Add 1/2 tsp ajwain, a pinch of turmeric, salt, and chopped green chili.",
      "Pour 3/4 cup water gradually and whisk into a smooth, pourable batter.",
      "Heat a flat pan and grease with 1 tsp oil.",
      "Spread a ladle of batter in a circle; cook for 2 min on each side until golden.",
    ],
    aiAnalysis: {
      water: "3/4 cup",
      time: "15 minutes",
      steps: [
        "Whisk 120g besan, vegetables, and 180ml water to batter.",
        "Spread on hot greased pan and cook 2 minutes each side.",
      ],
    },
  },
  {
    title: "Paneer Bread Pakoda",
    category: "Indian Favorites",
    time: "20 min",
    calories: "350 kcal",
    protein: "12g",
    fat: "20g",
    carbs: "30g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Bread slices", qty: 2, unit: "pcs" },
      { name: "Paneer block", qty: 60, unit: "g" },
      { name: "Gram flour (Besan)", qty: 100, unit: "g" },
      { name: "Ajwain & spices", qty: 5, unit: "g" },
      { name: "Oil", qty: 25, unit: "ml" },
    ],
    instructions: [
      "Make a batter with 1 cup besan, 1/2 tsp ajwain, chili powder, salt, and water.",
      "Place a thin slice of paneer seasoned with chaat masala between 2 slices of bread.",
      "Cut the sandwich diagonally into triangles.",
      "Dip the sandwich triangle into the besan batter, coating it completely.",
      "Deep fry in hot oil for 4 min until crispy and golden brown.",
    ],
    aiAnalysis: {
      water: "1/2 cup (for batter)",
      time: "20 minutes",
      steps: [
        "Whisk 100g besan with 120ml water to thick batter.",
        "Assemble sandwich with paneer, cut, coat in batter, and fry.",
      ],
    },
  },
  {
    title: "Badam Milk (Almond Milk)",
    category: "Breakfast",
    time: "15 min",
    calories: "240 kcal",
    protein: "8g",
    fat: "12g",
    carbs: "25g",
    image:
      "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Almonds (Badam)", qty: 15, unit: "pcs" },
      { name: "Full-fat milk", qty: 600, unit: "ml" },
      { name: "Sugar", qty: 45, unit: "g" },
      { name: "Saffron & Cardamom", qty: 2, unit: "g" },
    ],
    instructions: [
      "Soak 15 almonds in hot water for 30 min, peel them, and grind into a smooth paste.",
      "Boil 3 cups full-fat milk in a heavy-bottomed pan.",
      "Stir in the almond paste and 3 tbsp sugar; simmer on low heat for 10 min.",
      "Add a pinch of saffron strands and 1/4 tsp cardamom powder.",
      "Serve either warm or chilled in a glass garnished with sliced almonds.",
    ],
    aiAnalysis: {
      water: "None / Milk based",
      time: "15 minutes",
      steps: [
        "Grind 15 soaked almonds to paste.",
        "Boil 600ml milk, stir in almond paste and 45g sugar, simmer 10 minutes.",
      ],
    },
  },
  {
    title: "Suji Halwa (Rava Sheera)",
    category: "Indian Favorites",
    time: "20 min",
    calories: "320 kcal",
    protein: "4g",
    fat: "14g",
    carbs: "46g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Semolina (Rava)", qty: 100, unit: "g" },
      { name: "Ghee", qty: 50, unit: "ml" },
      { name: "Sugar", qty: 100, unit: "g" },
      { name: "Water", qty: 300, unit: "ml" },
      { name: "Cardamom & nuts", qty: 10, unit: "g" },
    ],
    instructions: [
      "Heat 1/4 cup ghee in a pan; roast 1/2 cup rava on low heat until golden and fragrant.",
      "Meanwhile, boil 1.5 cups water with 1/2 cup sugar in a separate pot.",
      "Slowly pour the hot sugar water into the roasted rava while stirring continuously to avoid lumps.",
      "Cook on low heat until the rava absorbs all the water and starts leaving the sides of the pan.",
      "Stir in 1/4 tsp cardamom powder and garnish with fried nuts.",
    ],
    aiAnalysis: {
      water: "1.5 cups (for sugar syrup)",
      time: "20 minutes",
      steps: [
        "Roast 100g semolina in 50ml ghee.",
        "Pour 300ml hot syrup (sugar + water) slowly, stir continuously until thick.",
      ],
    },
  },
  {
    title: "Dal Makhani",
    category: "Indian Favorites",
    time: "40 min",
    calories: "340 kcal",
    protein: "14g",
    fat: "20g",
    carbs: "32g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Whole black lentils (Urad dal)", qty: 150, unit: "g" },
      { name: "Kidney beans (Rajma)", qty: 40, unit: "g" },
      { name: "Butter", qty: 40, unit: "g" },
      { name: "Heavy cream", qty: 60, unit: "ml" },
      { name: "Tomato puree", qty: 150, unit: "g" },
    ],
    instructions: [
      "Soak 1 cup black lentils and 1/4 cup kidney beans overnight; pressure cook until completely soft.",
      "Heat 3 tbsp butter in a pan; sauté 1 tsp ginger-garlic paste and 1 cup tomato puree.",
      "Add the cooked lentils, mashed slightly, along with 1 cup water and 1 tsp salt.",
      "Simmer on low heat for 30 min while stirring frequently to get a creamy texture.",
      "Stir in 1/4 cup heavy cream and 1 tbsp butter just before turning off the heat.",
    ],
    aiAnalysis: {
      water: "4 cups (for cooking) + 1 cup (for gravy)",
      time: "40 minutes",
      steps: [
        "Pressure cook soaked 150g urad dal and 40g rajma.",
        "Sauté aromatics, tomatoes, butter, and add cooked lentils with 240ml water.",
        "Simmer on low for 30 minutes, finish with 60ml cream.",
      ],
    },
  },
  {
    title: "Mushroom Pulav",
    category: "Dinner",
    time: "25 min",
    calories: "290 kcal",
    protein: "6g",
    fat: "8g",
    carbs: "50g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Basmati rice", qty: 200, unit: "g" },
      { name: "Sliced mushrooms", qty: 150, unit: "g" },
      { name: "Onion & Ginger-garlic", qty: 80, unit: "g" },
      { name: "Ghee", qty: 20, unit: "ml" },
    ],
    instructions: [
      "Wash and soak 1 cup Basmati rice for 20 min; drain completely.",
      "Heat 2 tbsp ghee in a pot; cook 1 sliced onion and 1 tsp ginger-garlic paste until soft.",
      "Add 1 cup sliced mushrooms and stir-fry on high heat for 3 min.",
      "Stir in 1/2 tsp garam masala, the soaked rice, and 2 cups water.",
      "Cover tightly and cook on low heat for 12 min until all liquid is absorbed.",
    ],
    aiAnalysis: {
      water: "2 cups (for rice)",
      time: "25 minutes",
      steps: [
        "Soak 200g Basmati rice.",
        "Sauté 80g onion/garlic, fry 150g mushrooms.",
        "Add rice, spices, 400ml water, and cook covered (12 minutes).",
      ],
    },
  },
  {
    title: "Matar Paneer",
    category: "Dinner",
    time: "25 min",
    calories: "320 kcal",
    protein: "14g",
    fat: "22g",
    carbs: "18g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Paneer cubes", qty: 200, unit: "g" },
      { name: "Green peas (Matar)", qty: 120, unit: "g" },
      { name: "Onion-Tomato-Cashew paste", qty: 150, unit: "g" },
      { name: "Spices", qty: 8, unit: "g" },
    ],
    instructions: [
      "Grind 1 onion and 2 tomatoes with 5 cashews into a smooth paste.",
      "Sauté the paste in 1 tbsp oil until it starts leaving the sides of the pan.",
      "Add 1/2 tsp turmeric, 1 tsp chili powder, and 1 cup green peas.",
      "Pour in 1 cup water and bring to a boil; cook for 5 min until peas are tender.",
      "Add 200g paneer cubes and simmer gently for 3 min on low heat.",
    ],
    aiAnalysis: {
      water: "1 cup",
      time: "25 minutes",
      steps: [
        "Sauté onion-tomato-cashew paste.",
        "Add peas, spices, and 240ml water. Boil for 5 minutes.",
        "Add 200g paneer cubes and simmer 3 minutes.",
      ],
    },
  },
  {
    title: "Kachumber Salad",
    category: "Lunch",
    time: "10 min",
    calories: "60 kcal",
    protein: "2g",
    fat: "0g",
    carbs: "12g",
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Cucumber", qty: 150, unit: "g" },
      { name: "Tomato", qty: 150, unit: "g" },
      { name: "Onion", qty: 80, unit: "g" },
      { name: "Lemon juice & spices", qty: 10, unit: "g" },
    ],
    instructions: [
      "Finely dice 1 cucumber, 2 tomatoes, and 1 medium onion into tiny, even pieces.",
      "Mix all the diced vegetables together in a large mixing bowl.",
      "Squeeze the juice of 1/2 lemon over the vegetables.",
      "Sprinkle 1/2 tsp chaat masala and a pinch of salt.",
      "Toss well and serve chilled as a crisp, refreshing side dish.",
    ],
    aiAnalysis: {
      water: "None",
      time: "10 minutes",
      steps: [
        "Dice 150g cucumber, 150g tomato, and 80g onion.",
        "Drizzle lemon juice and sprinkle chaat masala. Mix and serve cold.",
      ],
    },
  },
  {
    title: "Veg Pakora",
    category: "Indian Favorites",
    time: "15 min",
    calories: "240 kcal",
    protein: "6g",
    fat: "14g",
    carbs: "25g",
    image:
      "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Mixed sliced vegetables", qty: 200, unit: "g" },
      { name: "Gram flour (Besan)", qty: 100, unit: "g" },
      { name: "Carom seeds (Ajwain)", qty: 3, unit: "g" },
      { name: "Oil", qty: 25, unit: "ml" },
    ],
    instructions: [
      "Thinly slice 1 cup mixed vegetables of your choice and place them in a bowl.",
      "Add 1 cup besan, 1/2 tsp carom seeds (ajwain), chili powder, and salt.",
      "Sprinkle 1/4 cup water gently to make a thick, tight coating over the veggies.",
      "Heat oil in a deep frying pan on medium-high heat.",
      "Drop small, webbed clusters of the mixture and fry for 5 min until crisp.",
    ],
    aiAnalysis: {
      water: "1/4 cup",
      time: "15 minutes",
      steps: [
        "Toss 200g mixed veggies in 100g besan and spices.",
        "Sprinkle 60ml water, mix to bind.",
        "Deep fry in oil at 180°C for 5 minutes.",
      ],
    },
  },
  {
    title: "Bread Amleet (Street Style)",
    category: "Breakfast",
    time: "10 min",
    calories: "290 kcal",
    protein: "14g",
    fat: "18g",
    carbs: "22g",
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Eggs", qty: 2, unit: "pcs" },
      { name: "Sliced bread", qty: 2, unit: "pcs" },
      { name: "Chopped onion & green chili", qty: 30, unit: "g" },
      { name: "Butter", qty: 15, unit: "g" },
    ],
    instructions: [
      "Whisk 2 eggs with 2 tbsp chopped onions, green chili, and a pinch of salt.",
      "Melt 1 tbsp butter on a wide flat pan and pour the egg mixture evenly.",
      "Immediately place 2 slices of bread side-by-side right on top of the wet egg.",
      "Flip the entire omelette along with the bread after 1 min of cooking.",
      "Fold the overhanging edges of the egg over the bread, toast until golden, and serve.",
    ],
    aiAnalysis: {
      water: "None",
      time: "10 minutes",
      steps: [
        "Whisk 2 eggs with onion/chili.",
        "Pour on hot pan with 15g butter, lay 2 bread slices on top, flip after 1 minute, fold edges.",
      ],
    },
  },
  {
    title: "Kulfi (Traditional Ice Cream)",
    category: "Indian Favorites",
    time: "25 min",
    calories: "280 kcal",
    protein: "7g",
    fat: "14g",
    carbs: "34g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "Full-fat milk", qty: 800, unit: "ml" },
      { name: "Condensed milk", qty: 100, unit: "ml" },
      { name: "Crushed pistachios", qty: 20, unit: "g" },
      { name: "Cardamom powder", qty: 2, unit: "g" },
    ],
    instructions: [
      "Boil 4 cups full-fat milk in a wide pan until it reduces to half its volume.",
      "Stir in 1/2 cup condensed milk and simmer on low heat for 5 min.",
      "Add 1/4 tsp cardamom powder and 2 tbsp crushed pistachios; let it cool completely.",
      "Pour the cooled thick mixture into traditional kulfi molds or small paper cups.",
      "Insert a wooden stick and freeze for at least 8 hours until completely set.",
    ],
    aiAnalysis: {
      water: "None / Milk based",
      time: "25 minutes + 8h freezing",
      steps: [
        "Simmer and reduce 800ml milk to half.",
        "Mix in 100ml condensed milk, cardamoms, 20g pistachios.",
        "Freeze in molds for 8 hours.",
      ],
    },
  },
  {
    title: "Jalebi (Instant Style)",
    category: "Indian Favorites",
    time: "25 min",
    calories: "380 kcal",
    protein: "4g",
    fat: "10g",
    carbs: "68g",
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=60",
    ingredients: [
      { name: "All-purpose flour (Maida)", qty: 120, unit: "g" },
      { name: "Yogurt", qty: 30, unit: "g" },
      { name: "Baking powder", qty: 3, unit: "g" },
      { name: "Sugar", qty: 200, unit: "g" },
      { name: "Water", qty: 150, unit: "ml" },
    ],
    instructions: [
      "Mix 1 cup flour, 2 tbsp yogurt, 1/2 tsp baking powder, and water into a smooth, thick batter.",
      "Boil 1 cup sugar with 1/2 cup water for 5 min to make a sticky syrup; keep warm.",
      "Pour the batter into a squeeze bottle or a zip-lock bag with a small corner cut off.",
      "Squeeze out spiral shapes directly into medium-hot oil and fry until crisp on both sides.",
      "Drain the hot jalebis and immediately drop them into the warm sugar syrup for 2 min.",
    ],
    aiAnalysis: {
      water: "1/2 cup (for syrup) + 1/3 cup (batter)",
      time: "25 minutes",
      steps: [
        "Mix 120g flour, 30g yogurt, baking powder, and water to thick batter.",
        "Boil 200g sugar in 100ml water to make syrup.",
        "Fry spirals in oil, soak in syrup for 2 minutes.",
      ],
    },
  },
];

// Let's read the current recipeData.ts file
const filePath = path.join(__dirname, "../src/lib/recipeData.ts");
let fileContent = fs.readFileSync(filePath, "utf8");

// Parse current recipes
// Let's generate the array representation of new recipes
const startId = 18;
const addedRecipes = rawRecipesData.map((r, i) => {
  const num = startId + i;
  const idStr = String(num).padStart(12, "0");
  const id = `00000000-0000-0000-0000-${idStr}`;

  // Construct ingredient items with generated IDs
  const ingredients = r.ingredients.map((ing) => {
    const ingId = "i-" + ing.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    return {
      id: ingId,
      name: ing.name,
      qty: ing.qty,
      unit: ing.unit,
    };
  });

  return {
    id,
    title: r.title,
    category: r.category,
    time: r.time,
    serves: 2,
    calories: r.calories,
    protein: r.protein,
    fat: r.fat,
    carbs: r.carbs,
    image: r.image,
    ingredients,
    instructions: r.instructions,
  };
});

// Construct the text to append to DEFAULT_RECIPES
let recipesText = addedRecipes
  .map((r) => {
    return (
      `  {\n    id: "${r.id}",\n    title: "${r.title}",\n    category: "${r.category}",\n    time: "${r.time}",\n    serves: ${r.serves},\n    calories: "${r.calories}",\n    protein: "${r.protein}",\n    fat: "${r.fat}",\n    carbs: "${r.carbs}",\n    image: "${r.image}",\n    ingredients: [\n` +
      r.ingredients
        .map(
          (ing) =>
            `      { id: "${ing.id}", name: "${ing.name}", qty: ${ing.qty}, unit: "${ing.unit}" }`,
        )
        .join(",\n") +
      `\n    ],\n    instructions: [\n` +
      r.instructions.map((inst) => `      "${inst.replace(/"/g, '\\"')}"`).join(",\n") +
      `\n    ]\n  }`
    );
  })
  .join(",\n");

// Find the insertion point in DEFAULT_RECIPES (before closing square bracket)
// Since DEFAULT_RECIPES is an array, we find the end of the array before STATIC_AI_ANALYSIS
const arrayEndIdx = fileContent.indexOf(
  "];\n\nexport const STATIC_AI_ANALYSIS: Record<string, AiAnalysisResult>",
);
if (arrayEndIdx === -1) {
  console.error("Could not find array end index");
  process.exit(1);
}

const beforeArrayEnd = fileContent.substring(0, arrayEndIdx);
const afterArrayEnd = fileContent.substring(arrayEndIdx);

let newContent = beforeArrayEnd + ",\n" + recipesText + "\n" + afterArrayEnd;

// Now append new analyses to STATIC_AI_ANALYSIS
// We want to insert them inside the closing curly brace of STATIC_AI_ANALYSIS
// Let's find the closing curly brace at the end of the file
const lastBraceIdx = newContent.lastIndexOf("};");
if (lastBraceIdx === -1) {
  console.error("Could not find closing brace of static analysis");
  process.exit(1);
}

const beforeLastBrace = newContent.substring(0, lastBraceIdx);
const afterLastBrace = newContent.substring(lastBraceIdx);

const analysisText = rawRecipesData
  .map((r, i) => {
    const num = startId + i;
    const idStr = String(num).padStart(12, "0");
    const id = `00000000-0000-0000-0000-${idStr}`;

    return (
      `  "${id}": {\n    water: "${r.aiAnalysis.water}",\n    time: "${r.aiAnalysis.time}",\n    steps: [\n` +
      r.aiAnalysis.steps.map((step) => `      "${step.replace(/"/g, '\\"')}"`).join(",\n") +
      `\n    ]\n  }`
    );
  })
  .join(",\n");

newContent = beforeLastBrace + ",\n" + analysisText + "\n" + afterLastBrace;

fs.writeFileSync(filePath, newContent, "utf8");
console.log(`Successfully added ${rawRecipesData.length} new recipes to recipeData.ts!`);
