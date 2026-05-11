const fs = require("fs");

const dataPath = "src/data/all-cards.json";
const backupPath = "src/data/all-cards-before-formula-image-placement-fix.json";
const reportPath = "formula-image-placement-audit.md";

const cards = JSON.parse(fs.readFileSync(dataPath, "utf8"));

if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, JSON.stringify(cards, null, 2));
}

function plain(text = "") {
  return String(text)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\\\[[\s\S]*?\\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function reportCode(card) {
  const raw = String(card.id || "unknown-card");
  const levels = card.levels || (card.level === "HL" ? ["HL"] : ["SL", "HL"]);
  const shared = levels.includes("SL") && levels.includes("HL");
  return shared ? raw.replace(/^(sl|hl)-/i, "") : raw;
}

function imageCount(card, side = "back") {
  const arr = card[`${side}Images`];
  const one = card[`${side}Image`];
  return (Array.isArray(arr) ? arr.length : 0) + (one ? 1 : 0);
}

function clearBackImages(card) {
  card.backImages = [];
  delete card.backImage;
}

let fixed = [];
let suspects = [];

for (const card of cards) {
  const f = plain(card.front || "");
  const b = plain(card.back || "");
  const all = `${f} ${b}`;
  const nImages = imageCount(card, "back");

  // High-confidence fix: D.3 charged particle radius / q/m card.
  if (
    reportCode(card) === "d3-039" ||
    (
      all.includes("radius of a charged particle") &&
      all.includes("magnetic field") &&
      all.includes("same velocity")
    )
  ) {
    card.back = `False.

For a charged particle moving perpendicular to a uniform magnetic field, the radius of the circular path is:

\\[
r = \\frac{mv}{|q|B}
\\]

So, in the same magnetic field \\(B\\), equal radius requires the same value of:

\\[
\\frac{mv}{|q|}
\\]

or equivalently the same value of:

\\[
\\frac{v}{|q|/m}
\\]

Therefore, having the same charge-to-mass ratio alone is not enough unless the particles also have the same speed.`;

    clearBackImages(card);

    fixed.push({
      code: reportCode(card),
      topic: card.topicCode,
      reason: "Replaced separated formula image with inline LaTeX explanation."
    });

    continue;
  }

  // Audit similar cards: image appears on answer side and text suggests a formula/explanation sequence.
  if (
    nImages > 0 &&
    (
      b.includes("formula") ||
      b.includes("equation") ||
      b.includes("is:") ||
      b.includes("given by") ||
      b.includes("therefore") ||
      b.includes("so,") ||
      b.includes("hence") ||
      b.includes("radius") ||
      b.includes("relationship")
    )
  ) {
    suspects.push({
      code: reportCode(card),
      id: card.id,
      topic: card.topicCode,
      front: plain(card.front || "").slice(0, 180),
      backStart: plain(card.back || "").slice(0, 220),
      images: nImages
    });
  }
}

fs.writeFileSync(dataPath, JSON.stringify(cards, null, 2));

let report = `# Formula image placement audit

## Fixed automatically

${fixed.length ? fixed.map(x => `- ${x.code} | ${x.topic || ""} | ${x.reason}`).join("\n") : "- None"}

## Suspected cards to inspect manually

These cards have answer-side images and wording that may mean the formula/image should be integrated into the explanation instead of appearing separately.

`;

for (const s of suspects) {
  report += `\n### ${s.code} | ${s.topic || ""} | ${s.images} answer image(s)\n`;
  report += `Front: ${s.front}\n\n`;
  report += `Back starts: ${s.backStart}\n\n`;
}

fs.writeFileSync(reportPath, report);

console.log("Automatic fixes:", fixed.length);
console.log("Suspected similar cards:", suspects.length);
console.log("Backup:", backupPath);
console.log("Report:", reportPath);
