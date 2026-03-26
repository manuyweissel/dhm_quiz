import { useEffect } from "react";

export default function NumberStage({
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
  const teamAnswers = progress.teamAnswers ?? teams.map(() => "");
  const bonusAwardApplied = Boolean(progress.bonusAwardApplied);
  const bonusAwardTeam = progress.bonusAwardTeam ?? null;
  const correctAnswer = parseNumericValue(item.answer);
  const parsedAnswers = teamAnswers.map(parseNumericValue);
  const distances = parsedAnswers.map((value) =>
    value === null || correctAnswer === null ? null : Math.abs(value - correctAnswer),
  );
  const computedWinner = getBonusWinner(distances);

  useEffect(() => {
    if (!revealed || bonusAwardApplied) {
      return;
    }

    if (computedWinner === null) {
      onUpdateProgress((current) => ({
        ...current,
        bonusAwardApplied: true,
        bonusAwardTeam: "tie",
      }));
      return;
    }

    onAwardPoints(computedWinner, 2);
    onUpdateProgress((current) => ({
      ...current,
      bonusAwardApplied: true,
      bonusAwardTeam: computedWinner,
    }));
  }, [
    bonusAwardApplied,
    computedWinner,
    onAwardPoints,
    onUpdateProgress,
    revealed,
  ]);

  function updateAnswer(teamIndex, value) {
    onUpdateProgress((current) => ({
      ...current,
      teamAnswers: (current.teamAnswers ?? teams.map(() => "")).map((entry, index) =>
        index === teamIndex ? value : entry,
      ),
    }));
  }

  return (
    <div className="stage-body stage-body-centered">
      <div className="hero-card number-card">
        <h3>{item.prompt}</h3>

        <div className="bonus-answer-grid">
          {teams.map((team, teamIndex) => {
            const parsedValue = parsedAnswers[teamIndex];
            const distance = distances[teamIndex];

            return (
              <div key={team.name} className="bonus-answer-card">
                <p className="round-award-team-name">{team.name}</p>
                <input
                  type="text"
                  className="bonus-answer-input"
                  value={teamAnswers[teamIndex] ?? ""}
                  onChange={(event) => updateAnswer(teamIndex, event.target.value)}
                  placeholder="Antwort eingeben"
                  inputMode="numeric"
                  disabled={revealed}
                  aria-label={`Antwort für Team ${teamIndex === 0 ? "A" : "B"}`}
                />
                {revealed ? (
                  <p className="bonus-answer-distance">
                    {parsedValue === null || distance === null
                      ? "Keine gültige Zahl"
                      : `Abstand: ${distance}`}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className={`number-lockup${revealed ? " is-revealed" : ""}`}>
          <span>{revealed ? item.answer : "?"}</span>
        </div>

        {!revealed ? (
          <div className="card-actions">
            <button
              type="button"
              className="card-reveal-button"
              onClick={onReveal}
              disabled={revealDisabled}
            >
              {revealLabel}
            </button>
          </div>
        ) : null}

        {revealed ? (
          <div className="round-award-panel">
            <p className="round-award-heading">Automatische Punkte für Runde 6</p>
            <p className="bonus-award-summary">
              {computedWinner === null
                ? "Gleicher Abstand oder keine gültige Vergleichsantwort."
                : `Näher dran: Team ${computedWinner === 0 ? "A" : "B"}.`}
            </p>
            <p className="round-award-status">
              {bonusAwardApplied
                ? bonusAwardTeam === "tie"
                  ? "Unentschieden ohne Punkte automatisch verbucht."
                  : `2 Punkte automatisch an Team ${bonusAwardTeam === 0 ? "A" : "B"} vergeben.`
                : "Wertung wird berechnet."}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function parseNumericValue(value) {
  const normalized = String(value ?? "")
    .replace(",", ".")
    .match(/-?\d+(?:\.\d+)?/);

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized[0]);

  return Number.isFinite(parsed) ? parsed : null;
}

function getBonusWinner(distances) {
  const validEntries = distances
    .map((distance, index) => ({ distance, index }))
    .filter((entry) => entry.distance !== null);

  if (!validEntries.length) {
    return null;
  }

  if (validEntries.length === 1) {
    return validEntries[0].index;
  }

  if (validEntries[0].distance === validEntries[1].distance) {
    return null;
  }

  return validEntries[0].distance < validEntries[1].distance
    ? validEntries[0].index
    : validEntries[1].index;
}
