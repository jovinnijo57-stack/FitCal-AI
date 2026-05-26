import fs from "fs";

try {
  const content = fs.readFileSync("scratch_extracted_user_message.txt", "utf8");
  console.log(`Content length: ${content.length} chars.`);

  // Let's find all headers with emojis or uppercase titles
  const lines = content.split("\n");
  const recipes = [];
  let currentRecipe = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Check if line is a category header like "🍳 Breakfast Recipes"
    if (
      trimmed.includes("Recipes") &&
      (trimmed.includes("🍳") ||
        trimmed.includes("🍲") ||
        trimmed.includes("🍛") ||
        trimmed.includes("🥤") ||
        trimmed.includes("🍰"))
    ) {
      console.log(`\nCategory: ${trimmed}`);
      return;
    }

    // Check if line is a recipe title like "🥣 IDLI" or "🥞 DOSA" or "🥘 APPAM"
    const match = trimmed.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\S)\s+([A-Z\s&]+)$/);
    if (match) {
      const emoji = match[1];
      const name = match[2].trim();
      recipes.push({ name, emoji });
    }
  });

  console.log(`\nFound ${recipes.length} recipes:`);
  console.log(recipes.map((r) => `${r.emoji} ${r.name}`).join(", "));
} catch (e) {
  console.error(e);
}
