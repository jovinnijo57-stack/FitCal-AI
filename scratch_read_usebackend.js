import fs from "fs";

const filePath =
  "c:/Users/User/OneDrive/Desktop/project/nexgro caffaine/src/frontend/src/hooks/useBackend.ts";

try {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, idx) => {
    if (line.includes("STATIC_RECIPES")) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
      // print 15 lines before and after
      const start = Math.max(0, idx - 15);
      const end = Math.min(lines.length - 1, idx + 15);
      for (let i = start; i <= end; i++) {
        console.log(`  [${i + 1}] ${lines[i]}`);
      }
    }
  });
} catch (e) {
  console.error(e);
}
