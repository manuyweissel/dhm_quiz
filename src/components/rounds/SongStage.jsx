import { useEffect, useRef, useState } from "react";

export default function SongStage({
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
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [playbackNonce, setPlaybackNonce] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const iframeRef = useRef(null);
  const videos = item.youtubeVideos ?? [];
  const activeVideo = videos[activeVideoIndex] ?? null;
  const hasStartedPlayback = playbackNonce > 0;
  const songDisplay = getSongDisplay(item);
  const songAwardedTeam = progress.songAwardedTeam ?? null;
  const personBonusAwarded = Boolean(progress.personBonusAwarded);

  useEffect(() => {
    setActiveVideoIndex(0);
    setPlaybackNonce(0);
    setIsPaused(false);
  }, [item.id]);

  function startSongPlayback() {
    setPlaybackNonce((current) => current + 1);
    setIsPaused(false);
  }

  function toggleSongPlayback() {
    if (!hasStartedPlayback) {
      return;
    }

    if (isPaused) {
      controlPlayer("playVideo");
      setIsPaused(false);
      return;
    }

    controlPlayer("pauseVideo");
    setIsPaused(true);
  }

  function controlPlayer(command) {
    const playerWindow = iframeRef.current?.contentWindow;

    if (!playerWindow) {
      return;
    }

    playerWindow.postMessage(
      JSON.stringify({
        event: "command",
        func: command,
        args: [],
      }),
      "*",
    );
  }

  function awardSong(teamIndex) {
    if (songAwardedTeam !== null) {
      return;
    }

    onAwardPoints(teamIndex, 1);
    onUpdateProgress((current) => ({
      ...current,
      songAwardedTeam: teamIndex,
    }));
  }

  function awardPersonBonus(teamIndex) {
    if (songAwardedTeam !== teamIndex || personBonusAwarded) {
      return;
    }

    onAwardPoints(teamIndex, 1);
    onUpdateProgress((current) => ({
      ...current,
      personBonusAwarded: true,
    }));
  }

  return (
    <div className="stage-body stage-body-centered">
      <div className="hero-card reveal-card">
        <h3>{item.prompt}</h3>
        {!revealed ? (
          <div className="answer-slab">
            <span className="answer-cover">Song noch verdeckt</span>
          </div>
        ) : null}

        {activeVideo ? (
          <>
            {hasStartedPlayback ? (
              <div className={`song-video-shell${revealed ? " is-visible" : " is-hidden"}`}>
                <div className="song-video-frame-wrap">
                  <iframe
                    key={`${item.id}-${activeVideo.videoId}-${playbackNonce}`}
                    ref={iframeRef}
                    className="song-video-frame"
                    src={buildYouTubeEmbedUrl(activeVideo.videoId)}
                    title={activeVideo.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>

                {revealed ? (
                  <div className="song-video-section">
                    <div className="song-result-card">
                      <strong>{songDisplay.title}</strong>
                      {songDisplay.artist ? <span>by {songDisplay.artist}</span> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="song-audio-controls">
              <button type="button" className="song-play-button" onClick={startSongPlayback}>
                {hasStartedPlayback ? "Song neu starten" : "Song starten"}
              </button>
              <button
                type="button"
                className="song-secondary-button"
                onClick={toggleSongPlayback}
                disabled={!hasStartedPlayback}
              >
                {isPaused ? "Weiter" : "Song pausieren"}
              </button>
              {!revealed ? (
                <button
                  type="button"
                  className="song-reveal-button"
                  onClick={onReveal}
                  disabled={revealDisabled}
                >
                  {revealLabel}
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            {revealed ? (
              <div className="song-video-section">
                <div className="song-result-card">
                  <strong>{songDisplay.title}</strong>
                  {songDisplay.artist ? <span>by {songDisplay.artist}</span> : null}
                </div>
                <div className="concealed-panel">
                  Für diesen Song ist noch kein YouTube-Video hinterlegt.
                </div>
              </div>
            ) : null}
            <div className="song-audio-controls">
              {!revealed ? (
                <button
                  type="button"
                  className="song-reveal-button"
                  onClick={onReveal}
                  disabled={revealDisabled}
                >
                  {revealLabel}
                </button>
              ) : null}
              <p className="song-audio-hint">
                {revealed
                  ? "Für diesen Song ist noch kein YouTube-Video hinterlegt."
                  : "Du kannst die Auflösung auch ohne Video direkt hier zeigen."}
              </p>
            </div>
          </>
        )}

        {revealed ? (
          <div className="round-award-panel">
            <p className="round-award-heading">Punkte für Runde 1</p>
            <div className="round-award-grid">
              {teams.map((team, teamIndex) => {
                const isSongWinner = songAwardedTeam === teamIndex;

                return (
                  <div key={team.name} className="round-award-team">
                    <p className="round-award-team-name">{team.name}</p>
                    <div className="round-award-actions">
                      <button
                        type="button"
                        className="round-inline-button primary"
                        onClick={() => awardSong(teamIndex)}
                        disabled={songAwardedTeam !== null}
                      >
                        Song komplett +1
                      </button>
                      <button
                        type="button"
                        className="round-inline-button"
                        onClick={() => awardPersonBonus(teamIndex)}
                        disabled={!isSongWinner || personBonusAwarded}
                      >
                        Zugehörige Person auch richtig erkannt +1
                      </button>
                    </div>
                    <p className="round-award-status">
                      {isSongWinner
                        ? personBonusAwarded
                          ? "Song und Personen-Bonus vergeben."
                          : "Songpunkt vergeben."
                        : songAwardedTeam === null
                          ? "Noch kein Songpunkt vergeben."
                          : "Diese Karte ging ans andere Team."}
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

function buildYouTubeEmbedUrl(videoId) {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
    loop: "1",
    enablejsapi: "1",
    playlist: videoId,
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

function getSongDisplay(item) {
  if (item.songTitle || item.artist) {
    return {
      title: item.songTitle ?? item.reveal,
      artist: item.artist ? item.artist.split("/")[0].trim() : "",
    };
  }

  const parts = String(item.reveal ?? "")
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      title: parts[0],
      artist: parts.slice(1).join(" - "),
    };
  }

  return {
    title: item.reveal,
    artist: "",
  };
}
