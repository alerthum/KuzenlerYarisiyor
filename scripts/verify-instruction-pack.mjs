import fs from "node:fs";
const required = [
  "00_AUTONOMOUS_MASTER.md","CURSOR_TEK_PROMPT.md","AGENTS.md",
  "docs/rules/02_GRADE_3_PLUS_DIFFICULTY_STANDARD.md",
  "docs/rules/03_OPTION_AND_DISTRACTOR_PREMIUM_STANDARD.md",
  "docs/stages/01_V11_ROOT_CAUSE.md","docs/stages/15_FINAL_ACCEPTANCE.md"
];
const missing = required.filter(x => !fs.existsSync(x));
if (missing.length) {
  console.error("Eksik paket dosyaları:", missing);
  process.exit(1);
}
console.log("Zihin Arenası otonom talimat paketi doğrulandı.");
