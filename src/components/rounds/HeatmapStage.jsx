import { useEffect } from "react";

export default function HeatmapStage({
  item,
  revealed,
  progress,
  teams,
  onReveal,
  onUpdateProgress,
  onAwardPoints,
  revealDisabled,
}) {
  const placements = progress.heatmapPlacements ?? createHeatmapPlacements(teams);
  const mostAwardedByTeam = progress.mostAwardedByTeam ?? teams.map(() => false);
  const leastAwardedByTeam = progress.leastAwardedByTeam ?? teams.map(() => false);
  const maxCount = Math.max(...item.slots.map((slot) => slot.count), 1);
  const minCount = Math.min(...item.slots.map((slot) => slot.count));
  const markers = buildHeatmapMarkers(teams);

  function isMostCorrect(teamIndex) {
    const slotId = placements[`team-${teamIndex}-most`];
    const slot = item.slots.find((entry) => entry.id === slotId);

    return Boolean(slot && slot.count === maxCount);
  }

  function isLeastCorrect(teamIndex) {
    const slotId = placements[`team-${teamIndex}-least`];
    const slot = item.slots.find((entry) => entry.id === slotId);

    return Boolean(slot && slot.count === minCount);
  }

  useEffect(() => {
    if (!revealed) {
      return;
    }

    const nextMost = [...mostAwardedByTeam];
    const nextLeast = [...leastAwardedByTeam];
    const pendingAwards = [];

    teams.forEach((team, teamIndex) => {
      if (isMostCorrect(teamIndex) && !nextMost[teamIndex]) {
        nextMost[teamIndex] = true;
        pendingAwards.push([teamIndex, 1]);
      }

      if (isLeastCorrect(teamIndex) && !nextLeast[teamIndex]) {
        nextLeast[teamIndex] = true;
        pendingAwards.push([teamIndex, 1]);
      }
    });

    if (!pendingAwards.length) {
      return;
    }

    pendingAwards.forEach(([teamIndex, amount]) => {
      onAwardPoints(teamIndex, amount);
    });

    onUpdateProgress((current) => ({
      ...current,
      mostAwardedByTeam: nextMost,
      leastAwardedByTeam: nextLeast,
    }));
  }, [
    leastAwardedByTeam,
    mostAwardedByTeam,
    onAwardPoints,
    onUpdateProgress,
    placements,
    revealed,
    teams,
    item.slots,
  ]);

  function updatePlacement(markerId, slotId) {
    onUpdateProgress((current) => ({
      ...current,
      heatmapPlacements: {
        ...(current.heatmapPlacements ?? createHeatmapPlacements(teams)),
        [markerId]: slotId,
      },
    }));
  }

  function moveMarker(markerId, slotId) {
    updatePlacement(markerId, slotId);
  }

  function dropMarkerToSlot(event, slotId) {
    event.preventDefault();

    if (revealed) {
      return;
    }

    const markerId = event.dataTransfer.getData("text/plain");

    if (markerId) {
      moveMarker(markerId, slotId);
    }
  }

  return (
    <div className="stage-body stage-body-centered">
      <div className="heatmap-stage-layout">
        {teams.map((team, teamIndex) =>
          teamIndex === 0 ? (
            <div
              key={team.name}
              className={`heatmap-side-bank heatmap-side-panel team-${teamIndex}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                if (revealed) {
                  return;
                }

                event.preventDefault();
                const markerId = event.dataTransfer.getData("text/plain");

                if (markerId) {
                  moveMarker(markerId, null);
                }
              }}
            >
              <span className="heatmap-side-label">Team A</span>
              <p className="heatmap-side-name">{team.name}</p>
              <div className="heatmap-token-column">
                {markers
                  .filter((marker) => marker.teamIndex === teamIndex && placements[marker.id] === null)
                  .map((marker) => (
                    <HeatmapMarker key={marker.id} marker={marker} canDrag={!revealed} />
                  ))}
              </div>
            </div>
          ) : null,
        )}

        <div className="hero-card heatmap-card">
          <h3>In welchem Slot wurden die meisten von uns geboren?</h3>

          <div className="heatmap-grid">
            {item.slots.map((slot) => {
              const intensity = revealed ? Math.max(slot.count / maxCount, 0.18) : 0.12;
              const isMost = revealed && slot.count === maxCount;
              const isLeast = revealed && slot.count === minCount;

              return (
                <article
                  key={slot.id}
                  className={`heatmap-slot${revealed ? " revealed" : ""}${isMost ? " is-most" : ""}${isLeast ? " is-least" : ""}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropMarkerToSlot(event, slot.id)}
                  style={{
                    background: `linear-gradient(135deg,
                      color-mix(in srgb, var(--accent-a) ${Math.round(18 + intensity * 52)}%, rgba(45, 36, 52, 0.08)),
                      color-mix(in srgb, var(--accent-c) ${Math.round(14 + intensity * 46)}%, rgba(45, 36, 52, 0.08)))`,
                  }}
                >
                  <div
                    className="heatmap-drop-rail left"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => dropMarkerToSlot(event, slot.id)}
                  >
                    {markers
                      .filter((marker) => marker.kind === "most" && placements[marker.id] === slot.id)
                      .map((marker) => (
                        <HeatmapMarker key={marker.id} marker={marker} compact canDrag={!revealed} />
                      ))}
                  </div>

                  <div className="heatmap-slot-core">
                    <span className="heatmap-range">{slot.rangeLabel}</span>
                    <strong>{slot.label}</strong>
                    {revealed ? <span className="heatmap-count">{slot.count} Stimmen</span> : null}
                    {revealed ? (
                      <div className="heatmap-answer-tags">
                        {isMost ? <span className="heat-answer-tag most">Meiste</span> : null}
                        {isLeast ? <span className="heat-answer-tag least">Wenigste</span> : null}
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="heatmap-drop-rail right"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => dropMarkerToSlot(event, slot.id)}
                  >
                    {markers
                      .filter((marker) => marker.kind === "least" && placements[marker.id] === slot.id)
                      .map((marker) => (
                        <HeatmapMarker key={marker.id} marker={marker} compact canDrag={!revealed} />
                      ))}
                  </div>
                </article>
              );
            })}
          </div>

          {!revealed ? (
            <div className="heatmap-actions">
              <button
                type="button"
                className="heatmap-reveal-button"
                onClick={onReveal}
                disabled={revealDisabled}
              >
                Lösung anzeigen
              </button>
            </div>
          ) : null}

          {revealed ? (
            <div className="round-award-panel">
              <p className="round-award-heading">Automatische Punkte für Runde 2</p>
              <div className="round-award-grid">
                {teams.map((team, teamIndex) => {
                  const automaticPoints =
                    Number(isMostCorrect(teamIndex)) + Number(isLeastCorrect(teamIndex));

                    return (
                      <div key={team.name} className="round-award-team">
                        <p className="round-award-team-name">{team.name}</p>
                        <p className="round-award-status">
                          {automaticPoints > 0
                            ? `${automaticPoints} Punkt${automaticPoints > 1 ? "e" : ""} automatisch vergeben.`
                          : "Für dieses Team wurden auf dieser Karte keine Punkte vergeben."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {revealed ? (
            <p className="heatmap-footnote">
              2 Fälle noch in geburtshilflicher Nachermittlung
            </p>
          ) : null}
        </div>

        {teams.map((team, teamIndex) =>
          teamIndex === 1 ? (
            <div
              key={`${team.name}-right`}
              className={`heatmap-side-bank heatmap-side-panel team-${teamIndex}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                if (revealed) {
                  return;
                }

                event.preventDefault();
                const markerId = event.dataTransfer.getData("text/plain");

                if (markerId) {
                  moveMarker(markerId, null);
                }
              }}
            >
              <span className="heatmap-side-label">Team B</span>
              <p className="heatmap-side-name">{team.name}</p>
              <div className="heatmap-token-column">
                {markers
                  .filter((marker) => marker.teamIndex === teamIndex && placements[marker.id] === null)
                  .map((marker) => (
                    <HeatmapMarker key={marker.id} marker={marker} canDrag={!revealed} />
                  ))}
              </div>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

function HeatmapMarker({ marker, compact = false, canDrag = true }) {
  return (
    <div
      className={`heatmap-marker team-${marker.teamIndex}${compact ? " compact" : ""}`}
      draggable={canDrag}
      onDragStart={(event) => {
        if (!canDrag) {
          event.preventDefault();
          return;
        }

        event.dataTransfer.setData("text/plain", marker.id);
        event.dataTransfer.effectAllowed = "move";
      }}
    >
      <span className="heatmap-marker-type">{marker.kind === "most" ? "Meiste" : "Wenigste"}</span>
      <strong>{compact ? marker.shortLabel : marker.label}</strong>
    </div>
  );
}

function buildHeatmapMarkers(teams) {
  return teams.flatMap((team, teamIndex) => [
    {
      id: `team-${teamIndex}-most`,
      teamIndex,
      kind: "most",
      label: `Team ${teamIndex === 0 ? "A" : "B"}`,
      shortLabel: `${teamIndex === 0 ? "A" : "B"}`,
    },
    {
      id: `team-${teamIndex}-least`,
      teamIndex,
      kind: "least",
      label: `Team ${teamIndex === 0 ? "A" : "B"}`,
      shortLabel: `${teamIndex === 0 ? "A" : "B"}`,
    },
  ]);
}

function createHeatmapPlacements(teams) {
  return Object.fromEntries(buildHeatmapMarkers(teams).map((marker) => [marker.id, null]));
}
