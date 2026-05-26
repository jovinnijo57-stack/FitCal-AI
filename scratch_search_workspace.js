import fs from "fs";
import path from "path";

const searchDir = "C:\\Users\\User\\.gemini\\antigravity";
const workspaceDir = "c:\\Users\\User\\OneDrive\\Desktop\\project\\fit-ai-life-main";

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
        file !== ". Lovable"
      ) {
        walk(fullPath, callback);
      }
    } else {
      callback(fullPath);
    }
  });
}

console.log("Searching appDataDir...");
walk(searchDir, (filePath) => {
  if (
    filePath.endsWith(".log") ||
    filePath.endsWith(".jsonl") ||
    filePath.endsWith(".json") ||
    filePath.endsWith(".md") ||
    filePath.endsWith(".txt")
  ) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.includes("APPAM") && content.includes("🍚 PONGAL")) {
        console.log(`Found in appData: ${filePath} (len: ${content.length})`);
      }
    } catch (e) {}
  }
});

console.log("Searching workspace...");
walk(workspaceDir, (filePath) => {
  if (
    filePath.endsWith(".tsx") ||
    filePath.endsWith(".ts") ||
    filePath.endsWith(".txt") ||
    filePath.endsWith(".json") ||
    filePath.endsWith(".md")
  ) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.includes("APPAM") && content.includes("🍚 PONGAL")) {
        console.log(`Found in workspace: ${filePath} (len: ${content.length})`);
      }
    } catch (e) {}
  }
});
