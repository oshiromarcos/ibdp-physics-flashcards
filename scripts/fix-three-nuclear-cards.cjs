const fs = require("fs");

const dataPath = "src/data/all-cards.json";
const backupPath = "src/data/all-cards-before-three-nuclear-card-fixes.json";

const cards = JSON.parse(fs.readFileSync(dataPath, "utf8"));

if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, JSON.stringify(cards, null, 2));
}

function reportCode(card) {
  const raw = String(card.id || "unknown-card");
  const levels = card.levels || (card.level === "HL" ? ["HL"] : ["SL", "HL"]);
  const shared = levels.includes("SL") && levels.includes("HL");
  return shared ? raw.replace(/^(sl|hl)-/i, "") : raw;
}

function setImages(card, frontImages = [], backImages = []) {
  card.frontImages = frontImages;
  card.backImages = backImages;
  delete card.frontImage;
  delete card.backImage;
}

let changed = [];

for (const card of cards) {
  const code = reportCode(card);

  if (code === "hl-e3-005") {
    card.front = String.raw`True or False? The following nuclides are all possible isotopes of iron:

\[
{}^{54}_{26}\mathrm{Fe},\quad
{}^{56}_{26}\mathrm{Fe},\quad
{}^{57}_{26}\mathrm{Fe},\quad
{}^{58}_{26}\mathrm{Fe}
\]`;

    card.back = String.raw`True.

They are all possible isotopes of iron because they all have the same atomic number:

\[
Z = 26
\]

so they all contain 26 protons.

They have different mass numbers, so they contain different numbers of neutrons.`;

    setImages(card, [], []);
    card.bookletFormulas = [];
    changed.push(code);
  }

  if (code === "hl-e1-008") {
    card.back = String.raw`Large-angle deflections of a tiny number of alpha particles suggest that the atom contains a very small, dense, positively charged nucleus.

Most alpha particles pass straight through because most of the atom is empty space.

A small number are deflected through large angles because they pass close to the nucleus and experience a strong electrostatic repulsion from its positive charge.

So this observation supports the nuclear model of the atom: most of the atom's mass and positive charge are concentrated in a tiny central nucleus.`;

    setImages(card, [], []);
    card.bookletFormulas = [];
    changed.push(code);
  }

  if (code === "anki-hl-0208") {
    card.back = String.raw`At the distance of closest approach, the alpha particle has momentarily stopped, so its initial kinetic energy has been converted into electric potential energy.

\[
E_k = \frac{1}{4\pi\varepsilon_0}\frac{q_\alpha q_{\mathrm{Au}}}{r_{\min}}
\]

For an alpha particle:

\[
q_\alpha = +2e
\]

For gold:

\[
q_{\mathrm{Au}} = +79e
\]

So:

\[
r_{\min}=
\frac{1}{4\pi\varepsilon_0}
\frac{(2e)(79e)}{25\,\mathrm{MeV}}
\]

Using:

\[
\frac{e^2}{4\pi\varepsilon_0}=1.44\,\mathrm{MeV\,fm}
\]

\[
r_{\min}=
\frac{2\times79\times1.44}{25}\,\mathrm{fm}
\]

\[
r_{\min}\approx 9.1\,\mathrm{fm}
\]

Therefore:

\[
r_{\min}\approx 9.1\times10^{-15}\,\mathrm{m}
\]

assuming the gold nucleus is effectively stationary because it is much more massive than the alpha particle.`;

    setImages(card, [], []);
    card.bookletFormulas = [];
    changed.push(code);
  }
}

fs.writeFileSync(dataPath, JSON.stringify(cards, null, 2));

console.log("Fixed cards:", changed.join(", "));
console.log("Number fixed:", changed.length);
console.log("Backup:", backupPath);
