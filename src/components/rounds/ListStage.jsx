import { useEffect, useMemo, useRef, useState } from "react";

export default function ListStage({
  item,
  revealed,
  progress,
  teams,
  onReveal,
  onUpdateProgress,
  onAwardPoints,
  revealDisabled,
  revealLabel,
}) {
  const [guessValue, setGuessValue] = useState("");
  const [strikeVisible, setStrikeVisible] = useState(false);
  const strikeTimeoutRef = useRef(null);
  const displayAnswers = useMemo(
    () =>
      item.answers.slice(0, 10).map((answer, index) => ({
        ...answer,
        rank: index + 1,
      })),
    [item.answers],
  );
  const boardAnswers = useMemo(() => arrangeBoardAnswers(displayAnswers), [displayAnswers]);
  const maxCount = Math.max(...displayAnswers.map((answer) => answer.count), 1);
  const activeGuessTeam = progress.activeGuessTeam ?? 0;
  const wrongGuessCounts = progress.wrongGuessCounts ?? teams.map(() => 0);
  const matchedByKey = progress.matchedByKey ?? {};
  const surveyAwardedByTeam =
    progress.surveyAwardedByTeam ?? teams.map(() => false);
  const shownKeys = useMemo(() => {
    if (revealed) {
      return new Set(displayAnswers.map((answer) => getAnswerKey(answer.label)));
    }

    return new Set(Object.keys(matchedByKey));
  }, [displayAnswers, matchedByKey, revealed]);
  const allAnswersShown =
    displayAnswers.length > 0 && shownKeys.size === displayAnswers.length;
  const evaluationReady = revealed || allAnswersShown;
  const revealButtonLabel = Object.keys(matchedByKey).length
    ? "Rest anzeigen"
    : revealLabel;
  const allTeamsLocked = wrongGuessCounts.every((count) => count >= 3);
  const hitsByTeam = teams.map((_, teamIndex) =>
    Object.values(matchedByKey).filter((value) => value === teamIndex).length,
  );
  const surveyPoints = getSurveyPoints(hitsByTeam[0] ?? 0, hitsByTeam[1] ?? 0);

  useEffect(() => {
    setGuessValue("");
    setStrikeVisible(false);

    if (strikeTimeoutRef.current) {
      clearTimeout(strikeTimeoutRef.current);
      strikeTimeoutRef.current = null;
    }
  }, [item.id]);

  useEffect(
    () => () => {
      if (strikeTimeoutRef.current) {
        clearTimeout(strikeTimeoutRef.current);
      }
    },
    [],
  );

  function handleGuessSubmit(event) {
    event.preventDefault();

    if (evaluationReady) {
      return;
    }

    const trimmedGuess = guessValue.trim();

    if (!trimmedGuess) {
      return;
    }

    setGuessValue("");

    const existingMatch = displayAnswers.find((answer) =>
      answersMatch(answer.label, trimmedGuess),
    );

    if (!existingMatch) {
      registerMiss();
      return;
    }

    const answerKey = getAnswerKey(existingMatch.label);

    if (Object.prototype.hasOwnProperty.call(matchedByKey, answerKey)) {
      registerMiss();
      return;
    }

    const nextTeam = getNextGuessTeam(activeGuessTeam, wrongGuessCounts);

    onUpdateProgress((current) => ({
      ...current,
      activeGuessTeam: nextTeam,
      matchedByKey: {
        ...(current.matchedByKey ?? {}),
        [answerKey]: activeGuessTeam,
      },
    }));
  }

  function showStrike() {
    if (strikeTimeoutRef.current) {
      clearTimeout(strikeTimeoutRef.current);
    }

    setStrikeVisible(true);
    strikeTimeoutRef.current = setTimeout(() => {
      setStrikeVisible(false);
      strikeTimeoutRef.current = null;
    }, 950);
  }

  function registerMiss() {
    const nextWrongGuessCounts = wrongGuessCounts.map((count, teamIndex) =>
      teamIndex === activeGuessTeam ? Math.min(count + 1, 3) : count,
    );
    const nextTeam = getNextGuessTeam(activeGuessTeam, nextWrongGuessCounts);

    onUpdateProgress((current) => ({
      ...current,
      activeGuessTeam: nextTeam,
      wrongGuessCounts: nextWrongGuessCounts,
    }));
    showStrike();
  }

  function awardSurveyTeam(teamIndex) {
    const points = surveyPoints[teamIndex] ?? 0;

    if (points <= 0 || surveyAwardedByTeam[teamIndex]) {
      return;
    }

    onAwardPoints(teamIndex, points);
    onUpdateProgress((current) => ({
      ...current,
      surveyAwardedByTeam: (current.surveyAwardedByTeam ?? teams.map(() => false)).map(
        (value, index) => (index === teamIndex ? true : value),
      ),
    }));
  }

  return (
    <div className="stage-body stage-body-centered">
      <div className="hero-card list-card">
        <h3>{item.prompt}</h3>

        {!evaluationReady ? (
          <div className="survey-guess-panel">
            <div className="survey-turn-indicator" aria-label="Aktives Rateteam">
              <span className="round-award-team-label">
                Aktuell dran
              </span>
              <p className="survey-turn-copy">
                {teams[activeGuessTeam]?.name}
              </p>
            </div>

            <form className="survey-guess-form" onSubmit={handleGuessSubmit}>
              <input
                type="text"
                className="survey-guess-input"
                value={guessValue}
                onChange={(event) => setGuessValue(event.target.value)}
                placeholder={allTeamsLocked ? "Maximale Fehlversuche erreicht" : "Antwort eingeben"}
                autoComplete="off"
                spellCheck="false"
                aria-label="Antwort eingeben"
                disabled={allTeamsLocked}
              />
              <button
                type="submit"
                className="round-inline-button primary"
                disabled={!guessValue.trim() || allTeamsLocked}
              >
                Prüfen
              </button>
            </form>
          </div>
        ) : null}

        <div className={`survey-showcase${strikeVisible ? " is-strike" : ""}`}>
          <div className="survey-grid" aria-label="Antworttafel">
            {boardAnswers.map((answer) => {
              const answerKey = getAnswerKey(answer.label);
              const isShown = shownKeys.has(answerKey);

              return (
                <article
                  key={answer.label}
                  className={`survey-answer-card${isShown ? " is-revealed" : ""}`}
                  style={{
                    "--survey-ratio": getSurveyRatio(answer.count, maxCount),
                  }}
                >
                  <div className="survey-answer-card-inner">
                    <div className="survey-answer-face survey-answer-front">
                      <span className="survey-answer-rank">{answer.rank}</span>
                      <span className="survey-answer-state">Noch verdeckt</span>
                    </div>

                    <div className="survey-answer-face survey-answer-back">
                      <span className="survey-answer-rank">{answer.rank}</span>
                      <span className="survey-answer-label">{answer.label}</span>
                      <span className="survey-answer-count">{answer.count}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div
            className={`survey-strike-overlay${strikeVisible ? " is-visible" : ""}`}
            aria-hidden="true"
          >
            <div className="survey-strike-box">
              <span className="survey-strike-cross" />
            </div>
          </div>
        </div>

        <div className="survey-metrics-row" aria-label="Bisherige Treffer und Fehlversuche">
            <div className="survey-hit-summary">
              {teams.map((team, teamIndex) => (
                <div key={`${team.name}-hits`} className="survey-hit-pill">
                  <span>{team.name}</span>
                  <strong>{hitsByTeam[teamIndex]} Treffer</strong>
                  <small>{wrongGuessCounts[teamIndex]}/3 Fehlversuche</small>
                </div>
            ))}
          </div>
        </div>

        {!evaluationReady ? (
          <div className="card-actions survey-card-actions">
            <button
              type="button"
              className="card-reveal-button"
              onClick={onReveal}
              disabled={revealDisabled}
            >
              {revealButtonLabel}
            </button>
          </div>
        ) : null}

        {evaluationReady ? (
          <div className="round-award-panel">
            <p className="round-award-heading">Punkte für Runde 4</p>
            <div className="round-award-grid">
              {teams.map((team, teamIndex) => {
                const hits = hitsByTeam[teamIndex];
                const points = surveyPoints[teamIndex];

                return (
                  <div key={team.name} className="round-award-team">
                    <p className="round-award-team-name">{team.name}</p>
                    <p className="round-award-metric">
                      {hits} Treffer, {points} Punkte
                    </p>
                    <div className="round-award-actions">
                      <button
                        type="button"
                        className="round-inline-button primary"
                        onClick={() => awardSurveyTeam(teamIndex)}
                        disabled={points <= 0 || surveyAwardedByTeam[teamIndex]}
                      >
                        +{points} Punkte vergeben
                      </button>
                    </div>
                    <p className="round-award-status">
                      {surveyAwardedByTeam[teamIndex]
                        ? "Punkte vergeben."
                        : points > 0
                          ? "Vergabe bereit."
                          : "Keine Punkte auf dieser Karte."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function arrangeBoardAnswers(answers) {
  const midpoint = Math.ceil(answers.length / 2);
  const leftColumn = answers.slice(0, midpoint);
  const rightColumn = answers.slice(midpoint);
  const arranged = [];
  const rowCount = Math.max(leftColumn.length, rightColumn.length);

  for (let index = 0; index < rowCount; index += 1) {
    if (leftColumn[index]) {
      arranged.push(leftColumn[index]);
    }

    if (rightColumn[index]) {
      arranged.push(rightColumn[index]);
    }
  }

  return arranged;
}

function getSurveyRatio(count, maxCount) {
  if (!maxCount) {
    return 1;
  }

  return Math.max(0.22, count / maxCount).toFixed(3);
}

function getSurveyPoints(hitsA, hitsB) {
  if (hitsA === 0 && hitsB === 0) {
    return [0, 0];
  }

  if (hitsA === hitsB) {
    return [1, 1];
  }

  if (hitsA > hitsB) {
    return [2, hitsB > 0 ? 1 : 0];
  }

  return [hitsA > 0 ? 1 : 0, 2];
}

function getNextGuessTeam(currentTeam, wrongGuessCounts) {
  const otherTeam = currentTeam === 0 ? 1 : 0;

  if ((wrongGuessCounts[otherTeam] ?? 0) < 3) {
    return otherTeam;
  }

  if ((wrongGuessCounts[currentTeam] ?? 0) < 3) {
    return currentTeam;
  }

  return otherTeam;
}

function getAnswerKey(value) {
  return normalizeGuess(value);
}

function answersMatch(answerLabel, guessValue) {
  const normalizedAnswer = normalizeGuess(answerLabel);
  const normalizedGuess = normalizeGuess(guessValue);

  if (!normalizedAnswer || !normalizedGuess) {
    return false;
  }

  if (normalizedAnswer === normalizedGuess) {
    return true;
  }

  if (
    normalizedGuess.length >= 5 &&
    (normalizedAnswer.includes(normalizedGuess) || normalizedGuess.includes(normalizedAnswer))
  ) {
    return true;
  }

  const answerTokens = normalizedAnswer.split(" ");
  const guessTokens = normalizedGuess.split(" ");

  return guessTokens.length > 1 && guessTokens.every((token) => answerTokens.includes(token));
}

function normalizeGuess(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d\u201e]/g, '"')
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " und ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
