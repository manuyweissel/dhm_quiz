import { useEffect, useRef } from "react";

export default function ChatStage({
  item,
  roundState,
  progress,
  teams,
  onReveal,
  onUpdateProgress,
  onAwardPoints,
  revealDisabled,
  revealLabel,
}) {
  const chatStreamRef = useRef(null);
  const visibleMessages = item.messages.slice(0, roundState.chatStep);
  const revealVisible = roundState.revealed;
  const leftName = revealVisible ? item.left.name : "Unbekannt";
  const rightName = revealVisible ? item.right.name : "Unbekannt";
  const leftClue = revealVisible ? item.left.clue : "";
  const rightClue = revealVisible ? item.right.clue : "";
  const awardedTeam = progress.chatWinnerTeam ?? null;

  useEffect(() => {
    const chatStream = chatStreamRef.current;

    if (!chatStream) {
      return;
    }

    chatStream.scrollTo({
      top: chatStream.scrollHeight,
      behavior: visibleMessages.length > 1 ? "smooth" : "auto",
    });
  }, [visibleMessages.length, revealVisible, item.id]);

  function awardChat(teamIndex) {
    if (awardedTeam !== null) {
      return;
    }

    onAwardPoints(teamIndex, 2);
    onUpdateProgress((current) => ({
      ...current,
      chatWinnerTeam: teamIndex,
    }));
  }

  return (
    <div className="stage-body chat-stage">
      <div className="chat-layout">
        <aside className={`chat-character-side left${revealVisible ? " is-visible" : ""}`}>
          <div className="chat-character-card team-left">
            <div className="chat-character-portrait">
              {revealVisible ? (
                <PortraitContent imageSrc={item.left.imageSrc} name={item.left.name} />
              ) : (
                "?"
              )}
            </div>
            <div className="chat-character-meta">
              <p className="chat-character-name">{leftName}</p>
              <span className="chat-character-role">Person A</span>
              {leftClue ? <p className="chat-character-clue">{leftClue}</p> : null}
            </div>
          </div>
        </aside>

        <div className="chat-device-frame">
          <div className="chat-device-notch" aria-hidden="true" />

          <div className="chat-phone-header">
            <div className="chat-phone-status">
              <span>9:41</span>
              <span>FrisbeeTalk</span>
              <span>100%</span>
            </div>

            <div className="chat-phone-contact">
              <div>
                <h3>Wer schreibt hier?</h3>
                {item.subtitle ? <p className="chat-phone-subtitle">{item.subtitle}</p> : null}
              </div>
              <div className="chat-progress">
                {Math.min(roundState.chatStep, item.messages.length)}/{item.messages.length}
              </div>
            </div>
          </div>

          <div className="chat-window">
            <div
              ref={chatStreamRef}
              className="chat-stream"
              tabIndex={0}
              role="region"
              aria-label="Chatverlauf"
            >
              <div className={`chat-stream-content${visibleMessages.length ? "" : " is-empty"}`}>
                {visibleMessages.length ? (
                  visibleMessages.map((message, index) => (
                    <article key={`${message.side}-${index}`} className={`chat-bubble ${message.side}`}>
                      <span className="speaker-line">
                        {message.side === "left"
                          ? revealVisible
                            ? item.left.name
                            : "Person A"
                          : revealVisible
                            ? item.right.name
                            : "Person B"}
                      </span>
                      <p>{message.text}</p>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">Noch keine Nachricht gezeigt.</div>
                )}
              </div>
            </div>
          </div>

          {!revealVisible ? (
            <div className="card-actions chat-card-actions">
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
        </div>

        <aside className={`chat-character-side right${revealVisible ? " is-visible" : ""}`}>
          <div className="chat-character-card team-right">
            <div className="chat-character-portrait">
              {revealVisible ? (
                <PortraitContent imageSrc={item.right.imageSrc} name={item.right.name} />
              ) : (
                "?"
              )}
            </div>
            <div className="chat-character-meta">
              <p className="chat-character-name">{rightName}</p>
              <span className="chat-character-role">Person B</span>
              {rightClue ? <p className="chat-character-clue">{rightClue}</p> : null}
            </div>
          </div>
        </aside>
      </div>

      {revealVisible ? (
        <div className="round-award-panel chat-award-panel">
          <p className="round-award-heading">Punkte für Runde 3</p>
          <div className="round-award-grid">
            {teams.map((team, teamIndex) => (
              <div key={team.name} className="round-award-team">
                <p className="round-award-team-name">{team.name}</p>
                <div className="round-award-actions">
                  <button
                    type="button"
                    className="round-inline-button primary"
                    onClick={() => awardChat(teamIndex)}
                    disabled={awardedTeam !== null}
                  >
                    Beide Sprecher richtig +2
                  </button>
                </div>
                <p className="round-award-status">
                  {awardedTeam === teamIndex
                    ? "Die Chat-Runde wurde diesem Team gutgeschrieben."
                    : awardedTeam === null
                      ? "Noch keine Punkte vergeben."
                      : "Diese Runde ging ans andere Team."}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function initials(value) {
  return value
    .split(/[\s-]+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PortraitContent({ imageSrc, name }) {
  if (imageSrc) {
    return <img src={imageSrc} alt={name} className="chat-character-image" />;
  }

  return initials(name);
}
