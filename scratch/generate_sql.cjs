const fs = require("fs");
const path = require("path");

const tsFilePath = path.join(__dirname, "../src/lib/recipeData.ts");
const tsContent = fs.readFileSync(tsFilePath, "utf8");

// Find export const DEFAULT_RECIPES
const startIdx = tsContent.indexOf("export const DEFAULT_RECIPES: Recipe[] = [");
if (startIdx === -1) {
  console.error("Could not find start of DEFAULT_RECIPES");
  process.exit(1);
}

// Find the ending square bracket of DEFAULT_RECIPES
const endIdx = tsContent.indexOf(
  "export const STATIC_AI_ANALYSIS: Record<string, AiAnalysisResult>",
);
if (endIdx === -1) {
  console.error("Could not find start of STATIC_AI_ANALYSIS");
  process.exit(1);
}

// Extract the array text
let arrayText = tsContent
  .substring(startIdx + "export const DEFAULT_RECIPES: Recipe[] = ".length, endIdx)
  .trim();

// Ensure it ends with a semicolon or is just the array
if (arrayText.endsWith(";")) {
  arrayText = arrayText.substring(0, arrayText.length - 1);
}

// Save as a temporary CommonJS file so we can require it
const tempFilePath = path.join(__dirname, "temp_recipes.cjs");
fs.writeFileSync(tempFilePath, `module.exports = ${arrayText};`, "utf8");

// Require the parsed recipes
const DEFAULT_RECIPES = require(tempFilePath);

// Clean up the temp file
try {
  fs.unlinkSync(tempFilePath);
} catch (e) {}

console.log(`Successfully parsed ${DEFAULT_RECIPES.length} recipes!`);

// Let's generate SQL insert queries
let sqlLines = [];

sqlLines.push("-- SQL Script to insert/sync all default recipes in Supabase recipes table");
sqlLines.push("-- Run this script in the Supabase SQL Editor.");
sqlLines.push("");
sqlLines.push(
  "-- Optional: Clear existing default recipes to avoid duplicates if you are doing a clean sync",
);
sqlLines.push("-- DELETE FROM public.recipes WHERE is_custom = FALSE OR user_id IS NULL;");
sqlLines.push("");

// Helper to escape single quotes for SQL
function sqlEscape(str) {
  if (typeof str !== "string") return "";
  return str.replace(/'/g, "''");
}

for (const recipe of DEFAULT_RECIPES) {
  const id = recipe.id;
  const title = sqlEscape(recipe.title);
  const category = sqlEscape(recipe.category);
  const time = sqlEscape(recipe.time);
  const serves = recipe.serves || 2;
  const calories = sqlEscape(recipe.calories);
  const protein = sqlEscape(recipe.protein);
  const fat = sqlEscape(recipe.fat);
  const carbs = sqlEscape(recipe.carbs);
  const image = sqlEscape(recipe.image);

  // Format ingredients as JSON string
  const ingredientsJson = JSON.stringify(recipe.ingredients);
  const ingredientsEscaped = sqlEscape(ingredientsJson);

  // Format instructions as ARRAY['step 1', 'step 2']
  const instructionsArrayStr =
    "ARRAY[" + recipe.instructions.map((inst) => `'${sqlEscape(inst)}'`).join(", ") + "]::TEXT[]";

  // Build query with UPSERT on ID
  const query = `INSERT INTO public.recipes (id, title, category, time, serves, calories, protein, fat, carbs, image, ingredients, instructions, is_custom, user_id)
VALUES (
  '${id}',
  '${title}',
  '${category}',
  '${time}',
  ${serves},
  '${calories}',
  '${protein}',
  '${fat}',
  '${carbs}',
  '${image}',
  '${ingredientsEscaped}'::jsonb,
  ${instructionsArrayStr},
  FALSE,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  time = EXCLUDED.time,
  serves = EXCLUDED.serves,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  fat = EXCLUDED.fat,
  carbs = EXCLUDED.carbs,
  image = EXCLUDED.image,
  ingredients = EXCLUDED.ingredients,
  instructions = EXCLUDED.instructions,
  is_custom = EXCLUDED.is_custom,
  user_id = EXCLUDED.user_id;`;

  sqlLines.push(query);
  sqlLines.push("");
}

const sqlOutputPath = path.join(__dirname, "../supabase/insert_recipes.sql");
fs.writeFileSync(sqlOutputPath, sqlLines.join("\n"), "utf8");
console.log(`Successfully generated SQL insert script at: ${sqlOutputPath}`);
