import fs from "fs";
import path from "path";

const searchDir = "c:\\Users\\User\\OneDrive\\Desktop\\project\\nexgro caffaine";

function walk(dir, callback) {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch (e) {
    return;
  }
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      return;
    }
    if (stat.isDirectory()) {
      if (
        file !== "node_modules" &&
        file !== ".git" &&
        file !== ".wrangler" &&
        file !== ". Lovable" &&
        file !== "dist"
      ) {
        walk(fullPath, callback);
      }
    } else {
      callback(fullPath);
    }
  });
}

console.log("Searching in nexgro caffaine...");
walk(searchDir, (filePath) => {
  if (filePath.endsWith(".tsx") || filePath.endsWith(".ts") || filePath.endsWith(".js")) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.includes("STATIC_RECIPES") && !filePath.includes("recipeData.ts")) {
        console.log(`Found reference in: ${filePath} (len: ${content.length})`);
      }
    } catch (e) {}
  }
});
