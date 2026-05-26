import fs from "fs";
import path from "path";

const searchDir = "c:\\Users\\User\\OneDrive\\Desktop\\project\\nexgro caffaine\\src";

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
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
}

console.log("Searching for recipe metadata in nexgro caffaine...");
walk(searchDir, (filePath) => {
  if (
    filePath.endsWith(".tsx") ||
    filePath.endsWith(".ts") ||
    filePath.endsWith(".js") ||
    filePath.endsWith(".json")
  ) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.includes("Idli") || content.includes("Dosa") || content.includes("Upma")) {
        if (
          content.includes("calories") ||
          content.includes("kcal") ||
          content.includes("protein")
        ) {
          console.log(`Found: ${filePath}`);
        }
      }
    } catch (e) {}
  }
});
