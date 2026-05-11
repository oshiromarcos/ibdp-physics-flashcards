import { useEffect, useMemo, useState } from "react";
import katex from "katex";
import "katex/contrib/mhchem";
import "katex/dist/katex.min.css";
import "./App.css";
import rawCards from "./data/all-cards.json";

const TOPIC_ORDER = [
  "Physics", "Inquiry 1", "Inquiry 2", "Inquiry 3", "Tool 3", "T1", "T2", "T3",
  "A1", "A2", "A3", "A4", "A5",
  "B1", "B2", "B3", "B4", "B5",
  "C1", "C2", "C3", "C4", "C5",
  "D1", "D2", "D3", "D4",
  "E1", "E2", "E3", "E4", "E5",
];

const THEME_LABELS = {
  common: "Common tools",
  A: "Theme A — Space, Time, and Motion",
  B: "Theme B — The Particulate Nature of Matter",
  C: "Theme C — Wave Behaviour",
  D: "Theme D — Fields",
  E: "Theme E — Nuclear and Quantum Physics",
};

const cards = rawCards.map((card, index) => ({
  ...card,
  id: card.id || `card-${index + 1}`,
  levels: card.levels || (card.level === "HL" ? ["HL"] : ["SL", "HL"]),
  frontImages: card.frontImages || (card.frontImage ? [card.frontImage] : []),
  backImages: card.backImages || (card.backImage ? [card.backImage] : []),
  bookletFormulas: card.bookletFormulas || [],
}));

const REVIEW_THEME = {
  accent: "#7c2d12",
  accentSoft: "#fed7aa",
  pageStart: "#fff7ed",
  pageEnd: "#fae8ff",
  cardFront: "#fffaf0",
  cardBack: "#ffedd5",
  glow: "rgba(251, 146, 60, 0.28)",
};

function themeForTopic(topicCode, studyMode) {
  if (studyMode === "review") return REVIEW_THEME;

  const themes = {
    Inquiry: {
      accent: "#334155",
      accentSoft: "#e2e8f0",
      pageStart: "#f8fafc",
      pageEnd: "#eef2ff",
      cardFront: "#ffffff",
      cardBack: "#f8fafc",
      glow: "rgba(51, 65, 85, 0.18)",
    },
    Tool: {
      accent: "#6d28d9",
      accentSoft: "#ede9fe",
      pageStart: "#f5f3ff",
      pageEnd: "#eef2ff",
      cardFront: "#ffffff",
      cardBack: "#f5f3ff",
      glow: "rgba(109, 40, 217, 0.18)",
    },
    A: {
      accent: "#4f46e5",
      accentSoft: "#e0e7ff",
      pageStart: "#eef2ff",
      pageEnd: "#fdf2f8",
      cardFront: "#ffffff",
      cardBack: "#f5f3ff",
      glow: "rgba(79, 70, 229, 0.2)",
    },
    B: {
      accent: "#0f766e",
      accentSoft: "#ccfbf1",
      pageStart: "#ecfdf5",
      pageEnd: "#fff7ed",
      cardFront: "#fffdf7",
      cardBack: "#ecfeff",
      glow: "rgba(15, 118, 110, 0.2)",
    },
    C: {
      accent: "#be123c",
      accentSoft: "#ffe4e6",
      pageStart: "#fff1f2",
      pageEnd: "#eff6ff",
      cardFront: "#ffffff",
      cardBack: "#fff1f2",
      glow: "rgba(190, 18, 60, 0.18)",
    },
    D: {
      accent: "#0369a1",
      accentSoft: "#e0f2fe",
      pageStart: "#f0f9ff",
      pageEnd: "#ecfeff",
      cardFront: "#ffffff",
      cardBack: "#f0f9ff",
      glow: "rgba(3, 105, 161, 0.18)",
    },
    E: {
      accent: "#b45309",
      accentSoft: "#fef3c7",
      pageStart: "#fffbeb",
      pageEnd: "#fef2f2",
      cardFront: "#ffffff",
      cardBack: "#fffbeb",
      glow: "rgba(180, 83, 9, 0.18)",
    },
  };

  const code = String(topicCode);
  if (code.startsWith("Inquiry") || code === "Physics") return themes.Inquiry;
  if (code.startsWith("Tool") || code.startsWith("T")) return themes.Tool;
  return themes[code.charAt(0)] || themes.A;
}

function topicGroup(topicCode) {
  const code = String(topicCode);
  if (code.startsWith("Inquiry") || code.startsWith("Tool") || code.startsWith("T") || code === "Physics") return "common";
  return code.charAt(0);
}

function imageSrc(path) {
  if (!path) return "";
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}

function renderRichMathToHtml(text, displayModeDefault = false) {
  const raw = String(text || "");
  const parts = raw.split(/(\\\(.+?\\\)|\\\[.+?\\\])/gs);

  return parts
    .map((part) => {
      const isInlineMath = part.startsWith("\\(") && part.endsWith("\\)");
      const isDisplayMath = part.startsWith("\\[") && part.endsWith("\\]");
      if (isInlineMath || isDisplayMath) {
        const tex = part.slice(2, -2);
        return katex.renderToString(tex, {
          throwOnError: false,
          displayMode: isDisplayMath || displayModeDefault,
        });
      }
      return part;
    })
    .join("");
}

function RichText({ text }) {
  return (
    <div
      className="mathText"
      dangerouslySetInnerHTML={{ __html: renderRichMathToHtml(text) }}
    />
  );
}

function FormulaList({ formulas }) {
  if (!formulas?.length) return null;

  const hasUseful = formulas.some(
    (formula) => formula.source && !/data booklet/i.test(formula.source)
  );

  const hasBooklet = formulas.some(
    (formula) => !formula.source || /data booklet/i.test(formula.source)
  );

  const title = hasUseful && hasBooklet
    ? "Formula reminders"
    : hasUseful
      ? "Useful formula reminder"
      : "Data booklet formula";

  return (
    <section className="formulaBox" onClick={(event) => event.stopPropagation()}>
      <div className="formulaTitle">{title}</div>
      {formulas.map((formula, index) => (
        <div className="formulaItem" key={`${formula.label}-${index}`}>
          <span className="formulaLabel">{formula.label}</span>
          <span
            className="formulaMath"
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(formula.tex, {
                throwOnError: false,
                displayMode: true,
              }),
            }}
          />
          {formula.source && !/data booklet/i.test(formula.source) && (
            <span className="formulaSource">{formula.source}</span>
          )}
        </div>
      ))}
    </section>
  );
}

function CardFace({ card, side, studyMode, isSaved }) {
  const isFront = side === "front";
  const text = isFront ? card.front : card.back;
  const images = isFront ? card.frontImages : card.backImages;
  const cardLevels = card.levels || (card.level === "HL" ? ["HL"] : ["SL", "HL"]);
  const levelLabel = cardLevels.includes("SL") && cardLevels.includes("HL")
    ? "SL + HL"
    : cardLevels.includes("HL")
      ? "HL only"
      : "SL";

  return (
    <div className={`cardFace ${isFront ? "cardFront" : "cardBack"}`}>
      {isSaved && <div className="savedBadge">Saved</div>}

      <div className="cardTop">
        <div className="cardMeta">
          <span>{levelLabel}</span>
          <span>{card.topicCode}</span>
          <span>{isFront ? "Question" : "Answer"}</span>
          {studyMode === "review" && <span>Review sprint</span>}
        </div>
        <div className="subtopicTitle">{card.subtopicFull || card.topic}</div>
      </div>

      <div className="cardContent">
        <RichText text={text} />

        {images.filter(Boolean).map((image, index) => (
          <img
            key={`${image}-${index}`}
            className="cardImage"
            src={imageSrc(image)}
            alt=""
          />
        ))}

        {!isFront && <FormulaList formulas={card.bookletFormulas} />}
      </div>

      <div className="tapHint">Click card to flip</div>
    </div>
  );
}

function randomIndex(length, currentIndex = -1) {
  if (length <= 1) return 0;
  let next = currentIndex;
  while (next === currentIndex) {
    next = Math.floor(Math.random() * length);
  }
  return next;
}

function loadReviewIds() {
  try {
    return JSON.parse(localStorage.getItem("ib-physics-review-ids") || "[]");
  } catch {
    return [];
  }
}

export default function App() {
  const [levelMode, setLevelMode] = useState("SL");
  const [selectedSubtopic, setSelectedSubtopic] = useState("All topics");
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [reviewIds, setReviewIds] = useState(loadReviewIds);
  const [studyMode, setStudyMode] = useState("all");
  const [shuffleOn, setShuffleOn] = useState(false);

  useEffect(() => {
    localStorage.setItem("ib-physics-review-ids", JSON.stringify(reviewIds));
  }, [reviewIds]);

  const availableCards = useMemo(
    () => cards.filter((card) => card.levels.includes(levelMode)),
    [levelMode]
  );

  const topicOptions = useMemo(() => {
    const unique = new Map();
    availableCards.forEach((card) => {
      const label = card.subtopicFull || `${card.topicCode} — ${card.topic}`;
      unique.set(card.topicCode, { code: card.topicCode, label, group: topicGroup(card.topicCode) });
    });

    const sorted = [...unique.values()].sort((a, b) => {
      const ai = TOPIC_ORDER.indexOf(a.code);
      const bi = TOPIC_ORDER.indexOf(b.code);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.label.localeCompare(b.label);
    });

    const grouped = { common: [], A: [], B: [], C: [], D: [], E: [] };
    sorted.forEach((item) => {
      const group = grouped[item.group] ? item.group : "common";
      grouped[group].push(item);
    });
    return grouped;
  }, [availableCards]);

  const filteredCards = useMemo(() => {
    if (studyMode === "review") {
      return cards.filter((card) => reviewIds.includes(card.id));
    }

    if (selectedSubtopic === "All topics") return availableCards;

    return availableCards.filter((card) => card.topicCode === selectedSubtopic);
  }, [availableCards, reviewIds, selectedSubtopic, studyMode]);

  const safeIndex = Math.min(index, Math.max(filteredCards.length - 1, 0));
  const card = filteredCards[safeIndex] || filteredCards[0];
  const theme = themeForTopic(card?.topicCode || "A", studyMode);
  const isSaved = card ? reviewIds.includes(card.id) : false;
  const flatTopicOptions = useMemo(
    () => Object.values(topicOptions).flat(),
    [topicOptions]
  );

  const selectedTopicOption = flatTopicOptions.find(
    (item) => item.code === selectedSubtopic
  );

  const selectedLevelLabel =
    levelMode === "HL"
      ? "Higher Level (HL): SL cards + HL extras"
      : "Standard Level (SL)";

  const selectedTopicLabel =
    studyMode === "review"
      ? "Saved review cards"
      : selectedSubtopic === "All topics"
        ? "All topics"
        : (selectedTopicOption?.label || card?.subtopicFull || selectedSubtopic);

  useEffect(() => {
    if (index !== safeIndex) setIndex(safeIndex);
  }, [index, safeIndex]);

  function pushHistory(current) {
    setHistory((items) => [...items, current].slice(-300));
  }

  function goToNext() {
    if (filteredCards.length === 0) return;
    setFlipped(false);

    if (future.length > 0) {
      const nextFromFuture = Math.min(future[0], filteredCards.length - 1);
      setHistory((items) => [...items, safeIndex].slice(-300));
      setFuture((items) => items.slice(1));
      setIndex(nextFromFuture);
      return;
    }

    const nextIndex = shuffleOn
      ? randomIndex(filteredCards.length, safeIndex)
      : (safeIndex + 1) % filteredCards.length;

    setHistory((items) => [...items, safeIndex].slice(-300));
    setFuture([]);
    setIndex(nextIndex);
  }

  function previousCard() {
    if (filteredCards.length === 0) return;
    setFlipped(false);

    if (history.length > 0) {
      const previous = Math.min(history[history.length - 1], filteredCards.length - 1);
      setHistory((items) => items.slice(0, -1));
      setFuture((items) => [safeIndex, ...items].slice(0, 300));
      setIndex(previous);
      return;
    }

    const previous = (safeIndex - 1 + filteredCards.length) % filteredCards.length;
    setFuture((items) => [safeIndex, ...items].slice(0, 300));
    setIndex(previous);
  }

  function resetPosition() {
    setIndex(0);
    setHistory([]);
    setFuture([]);
    setFlipped(false);
  }

  function changeSubtopic(event) {
    setSelectedSubtopic(event.target.value);
    setStudyMode("all");
    resetPosition();
  }

  function changeLevel(event) {
    setLevelMode(event.target.value);
    setStudyMode("all");
    setSelectedSubtopic("All topics");
    resetPosition();
  }

  function saveForReviewLater() {
    if (!card) return;

    setReviewIds((current) => {
      if (current.includes(card.id)) return current;
      return [...current, card.id];
    });
    // Intentionally do not jump to the next card: the saved mark appears on this card.
  }

  function markKnown() {
    if (!card) return;

    setKnownCount((count) => count + 1);

    if (studyMode === "review") {
      const currentCardId = card.id;
      const remaining = filteredCards.filter((item) => item.id !== currentCardId);
      setReviewIds((current) => current.filter((id) => id !== currentCardId));

      if (remaining.length === 0) {
        setStudyMode("all");
        setSelectedSubtopic("All topics");
        resetPosition();
        return;
      }

      setFlipped(false);
      setHistory([]);
      setFuture([]);
      setIndex((current) => {
        if (shuffleOn) return randomIndex(remaining.length, -1);
        return Math.min(current, remaining.length - 1);
      });
      return;
    }

    goToNext();
  }

  function startReviewQuiz() {
    if (reviewIds.length === 0) return;

    setStudyMode("review");
    setSelectedSubtopic("All topics");
    setHistory([]);
    setFuture([]);
    setIndex(shuffleOn ? randomIndex(reviewIds.length, -1) : 0);
    setFlipped(false);
  }

  function clearReviewList() {
    setReviewIds([]);
    setStudyMode("all");
    setSelectedSubtopic("All topics");
    resetPosition();
  }

  if (!card) {
    return (
      <main
        className="appShell"
        style={{
          "--accent": REVIEW_THEME.accent,
          "--accent-soft": REVIEW_THEME.accentSoft,
          "--page-start": REVIEW_THEME.pageStart,
          "--page-end": REVIEW_THEME.pageEnd,
          "--card-front": REVIEW_THEME.cardFront,
          "--card-back": REVIEW_THEME.cardBack,
          "--glow": REVIEW_THEME.glow,
        }}
      >
        <section className="emptyState">
          <h1>No saved review cards yet</h1>
          <p>Use “Save to review later” on cards your students need to practise again.</p>
          <button onClick={() => setStudyMode("all")}>Back to all cards</button>
        </section>
      </main>
    );
  }

  return (
    <main
      className={`appShell ${studyMode === "review" ? "reviewShell" : ""}`}
      style={{
        "--accent": theme.accent,
        "--accent-soft": theme.accentSoft,
        "--page-start": theme.pageStart,
        "--page-end": theme.pageEnd,
        "--card-front": theme.cardFront,
        "--card-back": theme.cardBack,
        "--glow": theme.glow,
      }}
    >
      <section className="app">
        <section className="header">
          <div>
            <div className="modeBadge">
              {studyMode === "review" ? "Final review sprint" : "Practice mode"}
            </div>
            <h1>IB Physics Flashcards</h1>
            <p>
              {studyMode === "review"
                ? `Reviewing ${filteredCards.length} saved card(s)`
                : `${selectedLevelLabel} · ${availableCards.length} available cards`}
            </p>
            <div className="currentContext">
              <span>{selectedLevelLabel}</span>
              <span>{selectedTopicLabel}</span>
            </div>
          </div>

          <div className="stats">
            <span>Known: {knownCount}</span>
            <span>Saved review: {reviewIds.length}</span>
          </div>
        </section>

        <section className="controls">
          <label>
            Study level
            <select value={levelMode} onChange={changeLevel} disabled={studyMode === "review"}>
              <option value="SL">Standard Level (SL)</option>
              <option value="HL">Higher Level (HL): SL + HL extras</option>
            </select>
          </label>

          <label>
            Topic
            <select value={selectedSubtopic} onChange={changeSubtopic} disabled={studyMode === "review"}>
              <option value="All topics">All topics</option>
              {Object.entries(topicOptions).map(([group, items]) =>
                items.length ? (
                  <optgroup label={THEME_LABELS[group] || group} key={group}>
                    {items.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label.startsWith(item.code)
                          ? item.label
                          : `${item.code} — ${item.label}`}
                      </option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>
          </label>

          <span className="cardCounter">
            Card {safeIndex + 1} / {filteredCards.length}
          </span>
        </section>

        <section className="cardArea">
          <div className="flipScene">
            <button
              type="button"
              className={`flashcard ${flipped ? "isFlipped" : ""}`}
              onClick={() => setFlipped(!flipped)}
            >
              <CardFace card={card} side="front" studyMode={studyMode} isSaved={isSaved} />
              <CardFace card={card} side="back" studyMode={studyMode} isSaved={isSaved} />
            </button>
          </div>
        </section>

        <section className="buttons">
          <button onClick={previousCard}>Previous</button>
          <button onClick={() => setFlipped(!flipped)}>Flip</button>
          <button onClick={goToNext}>Next</button>
          <button
            className={shuffleOn ? "activeButton" : ""}
            onClick={() => setShuffleOn((value) => !value)}
          >
            Shuffle: {shuffleOn ? "On" : "Off"}
          </button>
        </section>

        <section className="buttons secondary">
          <button onClick={markKnown}>
            {studyMode === "review" ? "I know this — remove" : "I know this"}
          </button>

          <button className={isSaved ? "savedButton" : ""} onClick={saveForReviewLater}>
            {isSaved ? "Saved to review later" : "Save to review later"}
          </button>

          <button onClick={startReviewQuiz} disabled={reviewIds.length === 0}>
            Start review quiz
          </button>

          <button onClick={clearReviewList} disabled={reviewIds.length === 0}>
            Clear review list
          </button>
        </section>
      </section>
    </main>
  );
}
