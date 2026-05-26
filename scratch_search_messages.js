import fs from "fs";
import path from "path";

const messagesDir =
  "C:\\Users\\User\\.gemini\\antigravity\\brain\\883ebf44-b061-4cc4-9b85-12359a30ccdd\\.system_generated\\messages";

fs.readdirSync(messagesDir).forEach((file) => {
  if (file.endsWith(".json") && file !== "cursor.json" && file !== "read.json") {
    const filePath = path.join(messagesDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      // Let's print out if it contains IDLI
      const dataStr = JSON.stringify(data);
      if (dataStr.includes("🥣 IDLI")) {
        console.log(`Found IDLI in message: ${file} (size: ${dataStr.length})`);
        // Let's write the parsed content to extracted_recipes.txt if it's large
        fs.writeFileSync(
          "C:\\Users\\User\\OneDrive\\Desktop\\project\\fit-ai-life-main\\extracted_recipes.txt",
          JSON.stringify(data, null, 2),
        );
      }
    } catch (e) {}
  }
});
