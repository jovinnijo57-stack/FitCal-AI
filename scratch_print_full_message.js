import fs from "fs";
const content = fs.readFileSync("scratch_extracted_user_message.txt", "utf8");
console.log(content);
