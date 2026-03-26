import { useEffect } from "react";

export default function EitherOrStage({
  item,
  revealed,
  progress,
  teams,
  onReveal,
  onUpdateProgress,
  onAwardPoints,
  revealDisabled,
}) {
  const placements = progress.eitherPlacements ?? createEitherPlacements(teams);
  const eitherAwardedByTeam = progress.eitherAwardedByTeam ?? teams.map(() => false);
  const markers = buildEitherMarkers(teams);
  const maxVotes = Math.max(...item.options.map((option) => option.count), 0);
  const winningOptionIds = item.options
    .map((option, index) => ({ option, optionId: String(index + 1) }))
    .filter(({ option }) => option.count === maxVotes)
    .map(({ optionId }) => optionId);
  const isTie = winningOptionIds.length > 1;

  useEffect(() => {
    if (!revealed) {
      return;
    }

    const nextAwards = [...eitherAwardedByTeam];
    const pendingAwards = [];

    teams.forEach((team, teamIndex) => {
      if (isTeamCorrect(teamIndex) && !nextAwards[teamIndex]) {
        nextAwards[teamIndex] = true;
        pendingAwards.push(teamIndex);
      }
    });

    if (!pendingAwards.length) {
      return;
    }

    pendingAwards.forEach((teamIndex) => {
      onAwardPoints(teamIndex, 1);
    });

    onUpdateProgress((current) => ({
      ...current,
      eitherAwardedByTeam: nextAwards,
    }));
  }, [
    eitherAwardedByTeam,
    onAwardPoints,
    onUpdateProgress,
    placements,
    revealed,
    teams,
    isTie,
    winningOptionIds,
  ]);

  function updatePlacement(markerId, optionId) {
    onUpdateProgress((current) => ({
      ...current,
      eitherPlacements: {
        ...(current.eitherPlacements ?? createEitherPlacements(teams)),
        [markerId]: optionId,
      },
    }));
  }

  function moveMarker(markerId, optionId) {
    updatePlacement(markerId, optionId);
  }

  function dropMarkerToOption(event, optionId) {
    event.preventDefault();

    if (revealed) {
      return;
    }

    const markerId = event.dataTransfer.getData("text/plain");

    if (markerId) {
      moveMarker(markerId, optionId);
    }
  }

  function isTeamCorrect(teamIndex) {
    if (isTie) {
      return true;
    }

    return winningOptionIds.includes(placements[`either-team-${teamIndex}`]);
  }

  return (
    <div className="stage-body stage-body-centered">
      <div className="either-stage-layout">
        {teams.map((team, teamIndex) =>
          teamIndex === 0 ? (
            <div
              key={team.name}
              className={`heatmap-side-bank either-side-bank team-${teamIndex}`}
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
                    <EitherMarker key={marker.id} marker={marker} canDrag={!revealed} />
                  ))}
              </div>
            </div>
          ) : null,
        )}

        <div className="hero-card either-card either-decision-card">
          <h3>{item.prompt}</h3>
          <div className="either-option-grid">
            {item.options.map((option, index) => {
              const optionId = String(index + 1);
              const placedMarkers = markers.filter((marker) => placements[marker.id] === optionId);
              const share = item.totalVotes ? (option.count / item.totalVotes) * 100 : 0;
              const isLeading = revealed && winningOptionIds.includes(optionId);

              return (
                <article
                  key={option.label}
                  className={`either-option-card${revealed ? " revealed" : ""}${isLeading ? " is-leading" : ""}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropMarkerToOption(event, optionId)}
                >
                  <strong>{option.label}</strong>

                  <div className="either-drop-zone">
                    {placedMarkers.length ? (
                      placedMarkers.map((marker) => (
                        <EitherMarker key={marker.id} marker={marker} compact canDrag={!revealed} />
                      ))
                    ) : (
                      <span className="either-drop-placeholder">Nicht ausgewählt</span>
                    )}
                  </div>

                  {revealed ? (
                    <>
                      <span className="option-count">{option.count} Stimmen</span>
                      <div className="vote-bar">
                        <span
                          className="vote-fill"
                          style={{
                            width: `${share}%`,
                          }}
                        />
                      </div>
                    </>
                  ) : null}
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
              <p className="round-award-heading">Punkte für Runde 5</p>
              <div className="round-award-grid">
                {teams.map((team, teamIndex) => (
                  <div key={team.name} className="round-award-team">
                    <p className="round-award-team-name">{team.name}</p>
                    <p className="round-award-metric">
                      {isTie
                        ? "Gleichstand in der Club-Verteilung."
                        : isTeamCorrect(teamIndex)
                          ? "Marker liegt auf der Mehrheitsseite."
                          : "Marker liegt nicht auf der Mehrheitsseite."}
                    </p>
                    <p className="round-award-status">
                      {eitherAwardedByTeam[teamIndex]
                        ? "Punkt automatisch gutgeschrieben."
                        : isTeamCorrect(teamIndex)
                          ? "Wird automatisch gutgeschrieben."
                          : "Auf dieser Karte kein Punkt."}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {teams.map((team, teamIndex) =>
          teamIndex === 1 ? (
            <div
              key={`${team.name}-right`}
              className={`heatmap-side-bank either-side-bank team-${teamIndex}`}
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
                    <EitherMarker key={marker.id} marker={marker} canDrag={!revealed} />
                  ))}
              </div>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
}

function EitherMarker({ marker, compact = false, canDrag = true }) {
  return (
    <div
      className={`either-marker team-${marker.teamIndex}${compact ? " compact" : ""}`}
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
      <span className="either-marker-label">{compact ? marker.shortLabel : marker.label}</span>
    </div>
  );
}

function buildEitherMarkers(teams) {
  return teams.map((team, teamIndex) => ({
    id: `either-team-${teamIndex}`,
    teamIndex,
    label: `Team ${teamIndex === 0 ? "A" : "B"}`,
    shortLabel: `${teamIndex === 0 ? "A" : "B"}`,
  }));
}

function createEitherPlacements(teams) {
  return Object.fromEntries(buildEitherMarkers(teams).map((marker) => [marker.id, null]));
}
