import fs from "fs";

const logPath =
  "C:\\Users\\User\\.gemini\\antigravity\\brain\\883ebf44-b061-4cc4-9b85-12359a30ccdd\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(logPath, "utf8");
  const lines = content.split("\n");
  console.log(`Total lines: ${lines.length}`);

  lines.forEach((line, idx) => {
    if (!line.trim()) return;
    try {
      const obj = JSON.parse(line);
      if (obj.content && obj.content.includes("🍳 Breakfast Recipes")) {
        console.log(
          `Line ${idx + 1}: step_index=${obj.step_index}, source=${obj.source}, type=${obj.type}, length=${obj.content.length}`,
        );
      }
    } catch (e) {}
  });
} catch (e) {
  console.error(e);
}
