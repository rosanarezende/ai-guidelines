import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "../../..");

async function checkSanity() {
  console.log("=== Token Budget Sanity Check ===");
  console.log("Para auditar o uso real de tokens, execute a API Anthropic:");
  console.log("POST https://api.anthropic.com/v1/messages/count_tokens");
  console.log("");
  console.log("Payload sugerido:");

  try {
    const rulesPath = path.join(ROOT_DIR, ".core", "rules", "_meta", "rules.json");
    const content = await fs.readFile(rulesPath, "utf-8");
    const catalog = JSON.parse(content);

    const instructions = catalog.rules
      .filter((r) => r.instruction_en)
      .map((r) => r.instruction_en)
      .join("\n\n");

    console.log(
      JSON.stringify(
        {
          model: "claude-3-5-sonnet-20241022",
          messages: [
            {
              role: "user",
              content: `<AI_GUIDELINES>\n${instructions}\n</AI_GUIDELINES>`,
            },
          ],
        },
        null,
        2
      )
    );
  } catch (err) {
    console.log("(Não foi possível carregar rules.json para montar o payload.)", err.message);
  }
}

if (process.argv[1] === __filename) {
  checkSanity();
}
