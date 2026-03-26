export function isTextInput(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.tagName === "INPUT" || target.tagName === "TEXTAREA";
}

export function decodeCsvBuffer(arrayBuffer) {
  const candidates = [
    new TextDecoder("utf-8").decode(arrayBuffer),
    new TextDecoder("windows-1252").decode(arrayBuffer),
  ];
  const expectedMarkers = [
    ["Welches Kinderlied"],
    ["Zu welcher Uhrzeit"],
    ["1. Gegenstand"],
    ["1. Wurf"],
    ["1. Person"],
    ["Team süß oder Team salzig?"],
    ["Früher Vogel"],
  ];

  return candidates
    .map((text) => ({
      text,
      score: expectedMarkers.reduce(
        (total, variants) => total + (variants.some((marker) => text.includes(marker)) ? 1 : 0),
        0,
      ),
    }))
    .sort((left, right) => right.score - left.score)[0].text;
}
