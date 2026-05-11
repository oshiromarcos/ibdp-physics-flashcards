import { useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import "./App.css";
import rawCards from "./data/all-cards.json";

const cards = rawCards.map((card, index) => ({
  ...card,
  id: card.id || `card-${index + 1}`,
  levels: card.levels || [card.level || "SL"],
}));

function imageSrc(path) {
  if (!path) return "";
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}

function topicTitle(card) {
  return `${card.topicCode} — ${card.topic}`;
}

function subtopicTitle(card) {
  return card.subtopicFull || `${card.topicCode}: ${card.topic}`;
}

function themeGroup(topicCode) {
  if (String(topicCode).startsWith("A")) return "A";
  if (String(topicCode).startsWith("B")) return "B";
  if (String(topicCode).startsWith("C")) return "C";
  if (String(topicCode).startsWith("D")) return "D";
  if (String(topicCode).startsWith("E")) return "E";
  if (String(topicCode).startsWith("Inquiry")) return "Inquiry";
  if (String(topicCode).startsWith("Tool")) return "Tool";
  return "Default";
}

function themeFor(card, studyMode) {
  if (studyMode === "review") {
    return {
      accent: "#be123c",
      accentSoft: "#ffe4e6",
      pageStart: "#fff1f2",
      pageEnd: "#fef3c7",
      cardFront: "#fff7ed",
      cardBack: "#ffe4e6",
      glow: "rgba(190, 18, 60, 0.24)",
    };
  }

  const themes = {
    A: {
      accent: "#4f46e5",
      accentSoft: "#e0e7ff",
      pageStart: "#eef2ff",
      pageEnd: "#fdf2f8",
      cardFront: "#ffffff",
      cardBack: "#f5f3ff",
      glow: "rgba(79, 70, 229, 0.22)",
    },
    B: {
      accent: "#0f766e",
      accentSoft: "#ccfbf1",
      pageStart: "#ecfdf5",
      pageEnd: "#fff7ed",
      cardFront: "#fffdf7",
      cardBack: "#ecfeff",
      glow: "rgba(15, 118, 110, 0.22)",
    },
    C: {
      accent: "#7c3aed",
      accentSoft: "#ede9fe",
      pageStart: "#f5f3ff",
      pageEnd: "#eff6ff",
      cardFront: "#ffffff",
      cardBack: "#f3e8ff",
      glow: "rgba(124, 58, 237, 0.22)",
    },
    D: {
      accent: "#0369a1",
      accentSoft: "#e0f2fe",
      pageStart: "#e0f2fe",
      pageEnd: "#f8fafc",
      cardFront: "#ffffff",
      cardBack: "#e0f2fe",
      glow: "rgba(3, 105, 161, 0.22)",
    },
    E: {
      accent: "#b45309",
      accentSoft: "#fef3c7",
      pageStart: "#fffbeb",
      pageEnd: "#fef2f2",
      cardFront: "#fffdf5",
      cardBack: "#fef3c7",
      glow: "rgba(180, 83, 9, 0.22)",
    },
    Inquiry: {
      accent: "#15803d",
      accentSoft: "#dcfce7",
      pageStart: "#f0fdf4",
      pageEnd: "#ecfeff",
      cardFront: "#ffffff",
      cardBack: "#dcfce7",
      glow: "rgba(21, 128, 61, 0.22)",
    },
    Tool: {
      accent: "#475569",
      accentSoft: "#e2e8f0",
      pageStart: "#f8fafc",
      pageEnd: "#f1f5f9",
      cardFront: "#ffffff",
      cardBack: "#e2e8f0",
      glow: "rgba(71, 85, 105, 0.22)",
    },
  };

  return themes[themeGroup(card?.topicCode)] || themes.Tool;
}

function MathText({ text }) {
  const parts = String(text || "").split(/(\\\(.+?\\\)|\\\[.+?\\\])/gs);

  return (
    <div className="mathText">
      {parts.map((part, index) => {
        const isInlineMath = part.startsWith("\\(") && part.endsWith("\\)");
        const isDisplayMath = part.startsWith("\\[") && part.endsWith("\\]");

        if (isInlineMath || isDisplayMath) {
          const tex = part.slice(2, -2);
          const html = katex.renderToString(tex, {
            throwOnError: false,
            displayMode: isDisplayMath,
          });

          return (
            <span
              key={index}
              className={isDisplayMath ? "displayMath" : ""}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}

function CardFace({ card, side, saved }) {
  const isFront = side === "front";
  const text = isFront ? card.front : card.back;
  const images = isFront
    ? card.frontImages?.length
      ? card.frontImages
      : card.frontImage
        ? [card.frontImage]
        : []
    : card.backImages?.length
      ? card.backImages
      : card.backImage
        ? [card.backImage]
        : [];

  return (
    <div className={`cardFace ${isFront ? "cardFront" : "cardBack"}`}>
      {saved && <div className="savedCorner">Saved</div>}
      <div className="cardHeader">
        <div className="cardMeta">
          <span>{card.topicCode}</span>
          <span>{isFront ? "Question" : "Answer"}</span>
        </div>

        <h2>{subtopicTitle(card)}</h2>
      </div>

      <div className="cardContent">
        <MathText text={text} />

        {images.map((image, index) => (
          <img
            key={`${image}-${index}`}
            className="cardImage"
            src={imageSrc(image)}
            alt=""
          />
        ))}
      </div>

      <div className="tapHint">Click card to flip</div>
    </div>
  );
}

export default function App() {
  const [levelMode, setLevelMode] = useState("SL");
  const [selectedTopic, setSelectedTopic] = useState("All topics");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [reviewIds, setReviewIds] = useState([]);
  const [studyMode, setStudyMode] = useState("all");
  const [shuffleOn, setShuffleOn] = useState(false);
  const [seenHistory, setSeenHistory] = useState([]);

  const levelCards = useMemo(() => {
    return cards.filter((card) => card.levels.includes(levelMode));
  }, [levelMode]);

  const topics = useMemo(() => {
    const unique = new Map();

    levelCards.forEach((card) => {
      unique.set(topicTitle(card), topicTitle(card));
    });

    return ["All topics", ...unique.values()];
  }, [levelCards]);

  const filteredCards = useMemo(() => {
    if (studyMode === "review") {
      return cards.filter(
        (card) => reviewIds.includes(card.id) && card.levels.includes(levelMode)
      );
    }

    if (selectedTopic === "All topics") return levelCards;

    return levelCards.filter((card) => topicTitle(card) === selectedTopic);
  }, [levelCards, selectedTopic, reviewIds, studyMode, levelMode]);

  const card = filteredCards[index] || filteredCards[0];
  const theme = themeFor(card, studyMode);

  const savedForCurrentLevelCount = useMemo(() => {
    return cards.filter(
      (card) => reviewIds.includes(card.id) && card.levels.includes(levelMode)
    ).length;
  }, [reviewIds, levelMode]);

  function chooseNextIndex(length, currentIndex) {
    if (length <= 1) return 0;

    if (!shuffleOn) {
      return (currentIndex + 1) % length;
    }

    let randomIndex = Math.floor(Math.random() * length);
    while (randomIndex === currentIndex) {
      randomIndex = Math.floor(Math.random() * length);
    }
    return randomIndex;
  }

  function resetNavigation() {
    setIndex(0);
    setFlipped(false);
    setSeenHistory([]);
  }

  function nextCard() {
    if (filteredCards.length === 0 || !card) return;

    setSeenHistory((current) => [...current, card.id]);
    setFlipped(false);
    setIndex((current) => chooseNextIndex(filteredCards.length, current));
  }

  function previousCard() {
    if (filteredCards.length === 0) return;

    const newHistory = [...seenHistory];
    let targetIndex = null;

    while (newHistory.length > 0 && targetIndex === null) {
      const previousId = newHistory.pop();
      const foundIndex = filteredCards.findIndex((item) => item.id === previousId);

      if (foundIndex !== -1) {
        targetIndex = foundIndex;
      }
    }

    setSeenHistory(newHistory);
    setFlipped(false);

    if (targetIndex !== null) {
      setIndex(targetIndex);
    } else {
      setIndex((current) => (current - 1 + filteredCards.length) % filteredCards.length);
    }
  }

  function changeLevel(event) {
    setLevelMode(event.target.value);
    setSelectedTopic("All topics");
    setStudyMode("all");
    resetNavigation();
  }

  function changeTopic(event) {
    setSelectedTopic(event.target.value);
    setStudyMode("all");
    resetNavigation();
  }

  function saveToReviewLater() {
    if (!card) return;

    setReviewIds((current) => {
      if (current.includes(card.id)) return current;
      return [...current, card.id];
    });
  }

  function markKnown() {
    if (!card) return;

    setKnownCount((count) => count + 1);

    if (studyMode === "review") {
      const currentCardId = card.id;
      const remainingCards = filteredCards.filter((item) => item.id !== currentCardId);

      setReviewIds((current) => current.filter((id) => id !== currentCardId));
      setSeenHistory((current) => current.filter((id) => id !== currentCardId));

      if (remainingCards.length === 0) {
        setStudyMode("all");
        resetNavigation();
        return;
      }

      setFlipped(false);

      if (shuffleOn) {
        setIndex(Math.floor(Math.random() * remainingCards.length));
      } else {
        setIndex((current) => Math.min(current, remainingCards.length - 1));
      }

      return;
    }

    nextCard();
  }

  function startReviewQuiz() {
    if (savedForCurrentLevelCount === 0) return;

    setStudyMode("review");
    setSelectedTopic("All topics");
    resetNavigation();
  }

  function clearReviewList() {
    setReviewIds([]);
    setStudyMode("all");
    resetNavigation();
  }

  if (!card) {
    return (
      <main
        className="appShell"
        style={{
          "--accent": "#334155",
          "--accent-soft": "#e2e8f0",
          "--page-start": "#f8fafc",
          "--page-end": "#eef2ff",
          "--card-front": "#ffffff",
          "--card-back": "#f8fafc",
          "--glow": "rgba(51, 65, 85, 0.18)",
        }}
      >
        <section className="emptyState">
          <h1>No cards here yet</h1>
          <p>Save some cards to review later, then start the review quiz.</p>
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
              {studyMode === "review" ? "Review quiz — final push" : "Practice mode"}
            </div>
            <h1>IB Physics Flashcards</h1>
            <p>
              {studyMode === "review"
                ? `Reviewing ${filteredCards.length} saved card(s)`
                : `${levelMode} mode • ${filteredCards.length} cards available`}
            </p>
          </div>

          <div className="stats">
            <span>Known: {knownCount}</span>
            <span>Saved: {reviewIds.length}</span>
            <span>{shuffleOn ? "Shuffle: On" : "Shuffle: Off"}</span>
          </div>
        </section>

        <section className="controls">
          <label>
            Level
            <select value={levelMode} onChange={changeLevel}>
              <option value="SL">SL</option>
              <option value="HL">HL</option>
            </select>
          </label>

          <label>
            Topic
            <select value={selectedTopic} onChange={changeTopic}>
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </label>

          <span className="cardCounter">
            Card {index + 1} / {filteredCards.length}
          </span>
        </section>

        <section className="cardArea">
          <div className="flipScene">
            <button
              type="button"
              className={`flashcard ${flipped ? "isFlipped" : ""}`}
              onClick={() => setFlipped(!flipped)}
            >
              <CardFace card={card} side="front" saved={reviewIds.includes(card.id)} />
              <CardFace card={card} side="back" saved={reviewIds.includes(card.id)} />
            </button>
          </div>
        </section>

        <section className="buttons">
          <button onClick={previousCard}>Previous</button>
          <button onClick={() => setFlipped(!flipped)}>Flip</button>
          <button onClick={nextCard}>Next</button>

          <button
            className={shuffleOn ? "toggleOn" : ""}
            onClick={() => setShuffleOn((value) => !value)}
          >
            Shuffle {shuffleOn ? "On" : "Off"}
          </button>
        </section>

        <section className="buttons secondary">
          <button onClick={markKnown}>
            {studyMode === "review" ? "I know this — remove" : "I know this"}
          </button>

          <button onClick={saveToReviewLater}>Save to review later</button>

          <button onClick={startReviewQuiz} disabled={savedForCurrentLevelCount === 0}>
            Start review quiz
          </button>

          <button onClick={clearReviewList} disabled={reviewIds.length === 0}>
            Clear saved cards
          </button>
        </section>
      </section>
    </main>
  );
}
