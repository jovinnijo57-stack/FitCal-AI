import fs from "fs";
import path from "path";

const brainDir = "C:\\Users\\User\\.gemini\\antigravity\\brain";

try {
  const folders = fs.readdirSync(brainDir);
  console.log(`Searching through ${folders.length} folders...`);

  folders.forEach((folder) => {
    const fullFolderPath = path.join(brainDir, folder);
    const logFile = path.join(fullFolderPath, ".system_generated", "logs", "transcript.jsonl");

    if (fs.existsSync(logFile)) {
      try {
        const content = fs.readFileSync(logFile, "utf8");
        const lines = content.split("\n");
        lines.forEach((line) => {
          if (!line.trim()) return;
          try {
            const obj = JSON.parse(line);
            if (obj.source === "USER_EXPLICIT" && obj.content && obj.content.includes("🥘 APPAM")) {
              // Check if it's longer than 4500 (meaning it's not the truncated one)
              if (obj.content.length > 4500) {
                console.log(`SUCCESS! Found in folder ${folder}, length: ${obj.content.length}`);
                fs.writeFileSync(
                  "C:\\Users\\User\\OneDrive\\Desktop\\project\\fit-ai-life-main\\extracted_recipes_full.txt",
                  obj.content,
                );
              } else {
                console.log(
                  `Found truncated version in folder ${folder}, length: ${obj.content.length}`,
                );
              }
            }
          } catch (e) {}
        });
      } catch (e) {
        // ignore errors reading file
      }
    }
  });
  console.log("Search completed.");
} catch (e) {
  console.error(e);
}
