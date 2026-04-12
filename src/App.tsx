import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import "./App.css";

interface Card {
  id: number;
  image: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface LevelConfig {
  level: number;
  cols: number;
  rows: number;
  pairs: number;
  baseScore: number;
}

const TOTAL_IMAGES = 31;

const LEVELS_DESKTOP: LevelConfig[] = [
  { level: 1, cols: 8, rows: 2, pairs: 8, baseScore: 1000 },
  { level: 2, cols: 9, rows: 4, pairs: 18, baseScore: 2000 },
];

const LEVELS_MOBILE: LevelConfig[] = [
  { level: 1, cols: 4, rows: 4, pairs: 8, baseScore: 1000 },
  { level: 2, cols: 6, rows: 6, pairs: 18, baseScore: 2000 },
];

const DESKTOP_BREAKPOINT = 1024;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= DESKTOP_BREAKPOINT,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

function calculateScore(
  pairs: number,
  moves: number,
  baseScore: number,
): number {
  return Math.round(baseScore * (pairs / moves));
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickRandomImages(count: number): string[] {
  const all = Array.from(
    { length: TOTAL_IMAGES - 1 },
    (_, i) => `/cards/card-${String(i + 2).padStart(2, "0")}.jpg`,
  );
  return shuffleArray(all).slice(0, count);
}

function createCards(pairsCount: number): Card[] {
  const images = pickRandomImages(pairsCount);
  const pairs = images.flatMap((image, index) => [
    { id: index * 2, image, isFlipped: false, isMatched: false },
    { id: index * 2 + 1, image, isFlipped: false, isMatched: false },
  ]);
  return shuffleArray(pairs);
}

function App() {
  const isDesktop = useIsDesktop();
  const levels = isDesktop ? LEVELS_DESKTOP : LEVELS_MOBILE;

  const [level, setLevel] = useState(0);
  const [cards, setCards] = useState<Card[]>(() =>
    createCards(levels[0].pairs),
  );
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [levelScore, setLevelScore] = useState(0);

  const currentLevel = levels[level];

  useEffect(() => {
    if (flippedCards.length === 2) {
      setIsChecking(true);
      const [first, second] = flippedCards;
      const firstCard = cards.find((c) => c.id === first)!;
      const secondCard = cards.find((c) => c.id === second)!;

      if (firstCard.image === secondCard.image) {
        setCards((prev) =>
          prev.map((card) =>
            card.id === first || card.id === second
              ? { ...card, isMatched: true }
              : card,
          ),
        );
        setFlippedCards([]);
        setIsChecking(false);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
          setIsChecking(false);
        }, 800);
      }
      setMoves((prev) => prev + 1);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      const score = calculateScore(
        currentLevel.pairs,
        moves,
        currentLevel.baseScore,
      );
      setLevelScore(score);
      if (level < levels.length - 1) {
        setTotalScore((prev) => prev + score);
        setLevelComplete(true);
      } else {
        setTotalScore((prev) => prev + score);
        setGameWon(true);
      }
    }
  }, [cards, level]);

  const handleCardClick = (id: number) => {
    if (isChecking) return;
    if (flippedCards.length >= 2) return;
    if (flippedCards.includes(id)) return;

    const card = cards.find((c) => c.id === id)!;
    if (card.isMatched) return;

    setFlippedCards((prev) => [...prev, id]);
  };

  const goToNextLevel = () => {
    const nextLevel = level + 1;
    setLevel(nextLevel);
    setCards(createCards(levels[nextLevel].pairs));
    setFlippedCards([]);
    setMoves(0);
    setIsChecking(false);
    setLevelComplete(false);
  };

  const resetGame = () => {
    setLevel(0);
    setCards(createCards(levels[0].pairs));
    setFlippedCards([]);
    setMoves(0);
    setIsChecking(false);
    setLevelComplete(false);
    setGameWon(false);
    setTotalScore(0);
    setLevelScore(0);
  };

  return (
    <div className="game-container">
      <h1 className="game-title">Kartları Eşleştir, Kan Bağışını Öğren</h1>

      <div className="game-info">
        <span className="level-badge">Seviye {currentLevel.level}</span>
        <span className="move-counter">Hamle: {moves}</span>
        <span className="score-display">Puan: {totalScore}</span>
        <Button
          label="Yeni Oyun"
          icon="pi pi-refresh"
          onClick={resetGame}
          severity="info"
          rounded
        />
      </div>

      <div className="card-grid-wrapper">
        <div
          className="card-grid"
          style={{
            gridTemplateColumns: `repeat(${currentLevel.cols}, 1fr)`,
            gridTemplateRows: `repeat(${currentLevel.rows}, 1fr)`,
            aspectRatio: `${currentLevel.cols * 5} / ${currentLevel.rows * 7}`,
            ...(level === 0 ? { width: "100%" } : { height: "100%" }),
          }}
        >
          {cards.map((card) => {
            const isFlipped = flippedCards.includes(card.id) || card.isMatched;
            return (
              <div
                key={card.id}
                className={`card ${isFlipped ? "flipped" : ""} ${card.isMatched ? "matched" : ""}`}
                onClick={() => handleCardClick(card.id)}
              >
                <div className="card-inner">
                  <div className="card-front">
                    <img src="/cards/card-01.jpg" alt="card back" />
                  </div>
                  <div className="card-back">
                    <img src={card.image} alt="card" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {levelComplete && (
        <div className="win-overlay">
          <div className="win-message">
            <h2>Seviye {currentLevel.level} Tamamlandi!</h2>
            <p>{moves} hamlede tamamladiniz!</p>
            <p className="score-text">+{levelScore} puan</p>
            <Button
              label="Sonraki Seviye"
              icon="pi pi-arrow-right"
              onClick={goToNextLevel}
              severity="success"
              rounded
            />
          </div>
        </div>
      )}

      {gameWon && (
        <div className="win-overlay">
          <div className="win-message">
            <h2>Tebrikler! Tum Seviyeleri Tamamladiniz!</h2>
            <p>{moves} hamlede tamamladiniz!</p>
            <p className="score-text">+{levelScore} puan</p>
            <p className="total-score-text">Toplam Puan: {totalScore}</p>
            <Button
              label="Tekrar Oyna"
              icon="pi pi-replay"
              onClick={resetGame}
              severity="success"
              rounded
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
