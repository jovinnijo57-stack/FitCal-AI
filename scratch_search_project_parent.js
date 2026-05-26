import fs from "fs";
import path from "path";

const parentDir = "c:\\Users\\User\\OneDrive\\Desktop\\project";

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

console.log("Searching parent folder...");
walk(parentDir, (filePath) => {
  if (
    filePath.endsWith(".tsx") ||
    filePath.endsWith(".ts") ||
    filePath.endsWith(".txt") ||
    filePath.endsWith(".json") ||
    filePath.endsWith(".md")
  ) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.includes("BHINDI FRY") && content.includes("PONGAL")) {
        console.log(`Found: ${filePath} (len: ${content.length})`);
      }
    } catch (e) {}
  }
});
