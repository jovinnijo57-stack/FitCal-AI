import fs from "fs";
import path from "path";

const logPath =
  "C:\\Users\\User\\.gemini\\antigravity\\brain\\883ebf44-b061-4cc4-9b85-12359a30ccdd\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(logPath, "utf8");
  const lines = content.split("\n");
  console.log(`Read ${lines.length} lines.`);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.source === "USER_EXPLICIT" && obj.content && obj.content.includes("🥣 IDLI")) {
        console.log(`Found matching user input at step ${obj.step_index}`);
        fs.writeFileSync(
          "C:\\Users\\User\\OneDrive\\Desktop\\project\\fit-ai-life-main\\extracted_recipes.txt",
          obj.content,
        );
        console.log("Saved recipes to extracted_recipes.txt");
        break;
      }
    } catch (e) {
      // ignore JSON parse errors
    }
  }
} catch (err) {
  console.error(err);
}
