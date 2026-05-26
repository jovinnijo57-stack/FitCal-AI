import fs from "fs";
import path from "path";

const logPath =
  "C:\\Users\\User\\.gemini\\antigravity\\brain\\883ebf44-b061-4cc4-9b85-12359a30ccdd\\.system_generated\\logs\\transcript.jsonl";

try {
  const fileContent = fs.readFileSync(logPath, "utf8");
  const lines = fileContent.split("\n");
  console.log(`Read ${lines.length} lines from transcript.`);

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    try {
      const step = JSON.parse(lines[i]);
      if (
        step.type === "USER_INPUT" &&
        step.content &&
        step.content.includes("Breakfast Recipes")
      ) {
        console.log(`Found USER_INPUT at index ${step.step_index}`);
        fs.writeFileSync("scratch_extracted_user_message.txt", step.content, "utf8");
        console.log("Saved user message containing recipes to scratch_extracted_user_message.txt");

        // Let's print out the first 1000 characters
        console.log("Preview of extracted message:");
        console.log(step.content.slice(0, 1000));
        break;
      }
    } catch (e) {
      // console.error(`Error parsing line ${i}: ${e.message}`);
    }
  }
} catch (err) {
  console.error("Error reading file:", err);
}
