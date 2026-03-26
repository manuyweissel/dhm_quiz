import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import CategoryStage from "./components/rounds/CategoryStage.jsx";
import csvAssetUrl from "./data/Einladung zur Party.csv?url";
import bonusRoundAssetUrl from "./data/bonus_round.csv?url";
import { buildGameCategories } from "./data/buildGameCategories.js";
import { decodeCsvBuffer, isTextInput } from "./lib/appHelpers.js";
import {
  createCardProgress,
  createRoundState,
  getRevealLabel,
  isRevealDisabled,
} from "./lib/roundState.js";

const INITIAL_TEAMS = [
  { name: "Deutsche Hochschulmeister", score: 0 },
  { name: "Meister der deutschen Hochschule", score: 0 },
];

export default function App() {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [roundState, setRoundState] = useState(createRoundState());
  const [teams, setTeams] = useState(() => INITIAL_TEAMS.map((team) => ({ ...team })));
  const [cardProgressById, setCardProgressById] = useState({});
  const [stageResetNonce, setStageResetNonce] = useState(0);
  const [shouldScrollToStage, setShouldScrollToStage] = useState(false);
  const stagePanelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCsv() {
      try {
        const [response, bonusResponse] = await Promise.all([
          fetch(csvAssetUrl),
          fetch(bonusRoundAssetUrl),
        ]);

        if (!response.ok) {
          throw new Error(`CSV konnte nicht geladen werden (${response.status}).`);
        }

        if (!bonusResponse.ok) {
          throw new Error(`Bonus-CSV konnte nicht geladen werden (${bonusResponse.status}).`);
        }

        const csvText = decodeCsvBuffer(await response.arrayBuffer());
        const bonusCsvText = decodeCsvBuffer(await bonusResponse.arrayBuffer());
        const parsed = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
        });
        const parsedBonus = Papa.parse(bonusCsvText, {
          header: true,
          skipEmptyLines: true,
        });
        const nextCategories = buildGameCategories(parsed.data, parsedBonus.data);

        if (!nextCategories.length) {
          throw new Error("Aus der CSV konnten keine Spielkategorien gebaut werden.");
        }

        if (!cancelled) {
          setCategories(nextCategories);
          setActiveCategoryId(nextCategories[0].id);
          setStatus("ready");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unbekannter Ladefehler.");
          setStatus("error");
        }
      }
    }

    loadCsv();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? null;
  const activeItem = activeCategory?.items[activeItemIndex] ?? null;
  const activeCardProgress = useMemo(() => {
    if (!activeCategory || !activeItem) {
      return {};
    }

    return (
      cardProgressById[activeItem.id] ??
      createCardProgress(activeCategory.type, teams.length)
    );
  }, [activeCategory, activeItem, cardProgressById, teams.length]);
  const isFirstItem = activeItemIndex === 0;
  const isLastItem =
    activeCategory?.items.length ? activeItemIndex === activeCategory.items.length - 1 : true;
  const palette = activeCategory?.palette ?? ["#67b3ff", "#8fe6ff", "#ffe178"];
  const revealLabel = getRevealLabel(activeCategory, activeItem, roundState);
  const revealDisabled = isRevealDisabled(activeCategory, activeItem, roundState);

  function getFreshCardProgress(categoryType) {
    return createCardProgress(categoryType, teams.length);
  }

  function updateCurrentCardProgress(updater) {
    if (!activeCategory || !activeItem) {
      return;
    }

    setCardProgressById((current) => {
      const baseProgress =
        current[activeItem.id] ?? getFreshCardProgress(activeCategory.type);
      const nextProgress =
        typeof updater === "function" ? updater(baseProgress) : { ...baseProgress, ...updater };

      return {
        ...current,
        [activeItem.id]: nextProgress,
      };
    });
  }

  function resetCurrentCardProgress() {
    if (!activeCategory || !activeItem) {
      return;
    }

    setCardProgressById((current) => ({
      ...current,
      [activeItem.id]: getFreshCardProgress(activeCategory.type),
    }));
  }

  function awardPoints(teamIndex, amount) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    setTeams((current) =>
      current.map((team, index) =>
        index === teamIndex
          ? {
              ...team,
              score: team.score + amount,
            }
          : team,
      ),
    );
  }

  function selectCategory(categoryId) {
    if (categoryId === activeCategoryId) {
      return;
    }

    setActiveCategoryId(categoryId);
    setActiveItemIndex(0);
    setRoundState(createRoundState());
  }

  function handleNextItem() {
    if (!activeCategory || isLastItem) {
      return;
    }

    setActiveItemIndex((currentIndex) => currentIndex + 1);
    setRoundState(createRoundState());
    setShouldScrollToStage(true);
  }

  function handlePreviousItem() {
    if (!activeCategory || isFirstItem) {
      return;
    }

    setActiveItemIndex((currentIndex) => currentIndex - 1);
    setRoundState(createRoundState());
  }

  function handleResetRound() {
    setRoundState(createRoundState());
    resetCurrentCardProgress();
    setStageResetNonce((current) => current + 1);
  }

  function handleReveal(trigger = "button") {
    if (!activeCategory || !activeItem) {
      return;
    }

    if (activeCategory.type === "chat") {
      if (roundState.chatStep < activeItem.messages.length) {
        setRoundState((current) => ({
          ...current,
          chatStep: current.chatStep + 1,
        }));
        return;
      }

      if (!roundState.revealed && trigger !== "keyboard") {
        setRoundState((current) => ({
          ...current,
          revealed: true,
        }));
      }

      return;
    }

    if (!roundState.revealed) {
      setRoundState((current) => ({
        ...current,
        revealed: true,
      }));
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (isTextInput(event.target) || event.repeat) {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.code === "Space") {
        event.preventDefault();
        handleReveal("keyboard");
      } else if (key === "n") {
        event.preventDefault();
        handleNextItem();
      } else if (key === "r") {
        event.preventDefault();
        handleResetRound();
      }
    }

    if (status === "ready") {
      document.addEventListener("keydown", onKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  });

  useEffect(() => {
    if (!shouldScrollToStage || !stagePanelRef.current) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      stagePanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setShouldScrollToStage(false);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [shouldScrollToStage, activeItemIndex]);

  if (status === "loading") {
    return (
      <div className="loading-shell">
        <div className="loading-card">
          <p className="eyebrow">Start of Season DHM</p>
          <h1>Quiz Hub wird geladen</h1>
          <p>CSV wird gelesen, Kategorien werden vorbereitet, Host-Panel wird aufgebaut.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="loading-shell">
        <div className="loading-card">
          <p className="eyebrow">Fehler</p>
          <h1>Die Daten konnten nicht geladen werden</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="app-shell"
      style={{
        "--accent-a": palette[0],
        "--accent-b": palette[1],
        "--accent-c": palette[2],
      }}
    >
      <header className="top-shell glass-panel">
        <div className="top-shell-line" aria-label="Quiz Header">
          <div className="brand-line">
            <p className="eyebrow">Start of Season DHM</p>
            <h1>Quiz Hub</h1>
          </div>

          <div className="marker-row" aria-label="Rundenmarker">
            {categories.map((category, index) => (
              <button
                key={category.id}
                type="button"
                className={`round-marker${category.id === activeCategoryId ? " active" : ""}`}
                onClick={() => selectCategory(category.id)}
                aria-label={`Runde ${index + 1}`}
                title={`Runde ${index + 1}`}
              >
                <span className="round-marker-dot">{index + 1}</span>
              </button>
            ))}
          </div>

          <div className="header-scoreboard" aria-label="Punktestand">
            {teams.map((team, index) => (
              <div key={team.name} className="header-score-pill">
                <span className="header-score-team">{index === 0 ? "A" : "B"}</span>
                <div className="header-score-copy">
                  <span className="header-score-name">{team.name}</span>
                  <strong>{team.score}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="main-column">
        <section
          ref={stagePanelRef}
          className={`stage-panel glass-panel${activeCategory?.type === "number" ? " is-number-stage" : ""}`}
        >
          <header className="stage-header">
            <div className="stage-header-copy">
              <p className="stage-kicker">{activeCategory?.title}</p>
              <h2>{activeItem?.title ?? activeItem?.entryLabel ?? "Aktuelle Runde"}</h2>
              {activeCategory?.subtitle ? (
                <p className="stage-subtitle">{activeCategory.subtitle}</p>
              ) : null}
            </div>
            <div className="stage-progress">
              <span>{activeItemIndex + 1}</span>
              <small>von {activeCategory?.items.length ?? 0}</small>
            </div>
          </header>

          {activeCategory?.helper ? <p className="stage-helper">{activeCategory.helper}</p> : null}

          <CategoryStage
            key={`${activeCategoryId}-${activeItemIndex}-${stageResetNonce}`}
            category={activeCategory}
            item={activeItem}
            roundState={roundState}
            progress={activeCardProgress}
            teams={teams}
            onReveal={handleReveal}
            onPreviousItem={handlePreviousItem}
            onNextItem={handleNextItem}
            onResetRound={handleResetRound}
            onUpdateProgress={updateCurrentCardProgress}
            onAwardPoints={awardPoints}
            isFirstItem={isFirstItem}
            isLastItem={isLastItem}
            revealDisabled={revealDisabled}
            revealLabel={revealLabel}
          />

          <div className="stage-outer-controls" aria-label="Kartensteuerung">
            <div className="stage-outer-controls-left">
              {!isFirstItem ? (
                <button type="button" className="round-inline-button" onClick={handlePreviousItem}>
                  Letzte Karte
                </button>
              ) : null}
            </div>

            <div className="stage-outer-controls-right">
              {!isLastItem ? (
                <button type="button" className="round-inline-button" onClick={handleNextItem}>
                  Nächste Karte
                </button>
              ) : null}
              <button type="button" className="round-inline-button" onClick={handleResetRound}>
                Reset Karte
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
