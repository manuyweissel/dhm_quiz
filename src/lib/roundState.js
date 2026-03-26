export function createRoundState() {
  return {
    revealed: false,
    chatStep: 0,
  };
}

export function createCardProgress(categoryType, teamCount = 2) {
  switch (categoryType) {
    case "song":
      return {
        songAwardedTeam: null,
        personBonusAwarded: false,
      };
    case "heatmap":
      return {
        heatmapPlacements: createHeatmapPlacements(teamCount),
        mostAwardedByTeam: createBooleanArray(teamCount),
        leastAwardedByTeam: createBooleanArray(teamCount),
      };
    case "chat":
      return {
        chatWinnerTeam: null,
      };
    case "list":
      return {
        activeGuessTeam: 0,
        wrongGuessCounts: createNumberArray(teamCount),
        matchedByKey: {},
        surveyAwardedByTeam: createBooleanArray(teamCount),
      };
    case "eitherOr":
      return {
        eitherPlacements: createEitherPlacements(teamCount),
        eitherAwardedByTeam: createBooleanArray(teamCount),
      };
    case "number":
      return {
        teamAnswers: createStringArray(teamCount),
        bonusAwardApplied: false,
        bonusAwardTeam: null,
      };
    default:
      return {};
  }
}

export function getRevealLabel(category, item, roundState) {
  if (!category || !item) {
    return "Reveal";
  }

  if (category.type === "chat") {
    if (roundState.chatStep < item.messages.length) {
      return "Nächste Nachricht";
    }

    if (!roundState.revealed) {
      return "Auflösung zeigen";
    }

    return "Alles gezeigt";
  }

  return roundState.revealed ? "Antwort gezeigt" : "Antwort zeigen";
}

export function isRevealDisabled(category, item, roundState) {
  if (!category || !item) {
    return true;
  }

  if (category.type === "chat") {
    return roundState.revealed && roundState.chatStep >= item.messages.length;
  }

  return roundState.revealed;
}

function createBooleanArray(length) {
  return Array.from({ length }, () => false);
}

function createStringArray(length) {
  return Array.from({ length }, () => "");
}

function createNumberArray(length) {
  return Array.from({ length }, () => 0);
}

function createHeatmapPlacements(teamCount) {
  const entries = [];

  for (let index = 0; index < teamCount; index += 1) {
    entries.push([`team-${index}-most`, null], [`team-${index}-least`, null]);
  }

  return Object.fromEntries(entries);
}

function createEitherPlacements(teamCount) {
  const entries = [];

  for (let index = 0; index < teamCount; index += 1) {
    entries.push([`either-team-${index}`, null]);
  }

  return Object.fromEntries(entries);
}
