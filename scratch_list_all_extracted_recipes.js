import fs from "fs";

const content = fs.readFileSync("scratch_extracted_user_message.txt", "utf8");

// The file contains recipes formatted like:
// [EMOJI] [RECIPE NAME]
// Products
// [Products list]
// Preparation
// [Preparation steps]

// Let's use a regex or split parser to get all recipes
const lines = content.split("\n");
const recipes = [];
let currentRecipe = null;
let captureState = null; // 'products' or 'preparation'

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Detect recipe title, e.g. "🥣 IDLI" or "🥞 DOSA" or "🍄 MUSHROOM CURRY"
  // Emojis range is broad, so let's match any emoji or icon, then a space, then uppercase letters
  const match = line.match(
    /^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2700-\u27BF]|[\u2600-\u26FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83E[\uDD00-\uDFFF])\s+([A-Z\s&]+)$/,
  );
  if (match) {
    if (currentRecipe) {
      recipes.push(currentRecipe);
    }
    currentRecipe = {
      title: match[2].trim(),
      emoji: match[1],
      products: [],
      preparation: [],
    };
    captureState = null;
    continue;
  }

  if (line.toLowerCase() === "products") {
    captureState = "products";
    continue;
  }

  if (line.toLowerCase() === "preparation") {
    captureState = "preparation";
    continue;
  }

  if (captureState === "products" && currentRecipe) {
    currentRecipe.products = line.split(",").map((p) => p.trim());
    captureState = null;
  } else if (captureState === "preparation" && currentRecipe) {
    currentRecipe.preparation.push(line);
  }
}

if (currentRecipe) {
  recipes.push(currentRecipe);
}

console.log(`Successfully parsed ${recipes.length} recipes.`);
recipes.forEach((r, idx) => {
  console.log(`${idx + 1}. ${r.emoji} ${r.title}`);
  console.log(`   Products: ${r.products.join(", ")}`);
  console.log(`   Prep Steps count: ${r.preparation.length}`);
});

fs.writeFileSync("scratch_parsed_recipes.json", JSON.stringify(recipes, null, 2), "utf8");
console.log("Saved to scratch_parsed_recipes.json");
