import fs from "fs";
import path from "path";

const searchDir = "c:\\Users\\User\\OneDrive\\Desktop\\project\\fit-ai-life-main\\src";

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

console.log("Searching for text in src...");
walk(searchDir, (filePath) => {
  if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      if (content.includes("delicious") || content.includes("Chef's Corner")) {
        console.log(`Found in: ${filePath}`);
        // Let's print out lines containing those
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          if (
            line.includes("delicious") ||
            line.includes("Chef's Corner") ||
            line.includes("Plan delicious")
          ) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    } catch (e) {}
  }
});
