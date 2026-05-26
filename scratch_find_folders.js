import fs from "fs";
import path from "path";

const brainDir = "C:\\Users\\User\\.gemini\\antigravity\\brain";

try {
  const dirs = fs.readdirSync(brainDir);
  console.log("Folders in brain:");
  dirs.forEach((d) => {
    const full = path.join(brainDir, d);
    try {
      const stats = fs.statSync(full);
      if (stats.isDirectory()) {
        console.log(`- ${d}`);
        const logFile = path.join(full, ".system_generated", "logs", "transcript.jsonl");
        if (fs.existsSync(logFile)) {
          const logStats = fs.statSync(logFile);
          console.log(`  Found transcript.jsonl (size: ${logStats.size})`);
        }
      }
    } catch (e) {}
  });
} catch (e) {
  console.error(e);
}
