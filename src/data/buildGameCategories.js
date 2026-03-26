import { chatRounds } from "./content/chatRounds.js";
import { roundPalettes } from "./content/palette.js";
import { songOverrides } from "./content/songOverrides.js";

const SONG_KEY = "welches kinderlied war der soundtrack deiner kindheit (<10 jahre) ?";
const BIRTH_TIME_KEY = "zu welcher uhrzeit bist du aus dem ei geschlupft?";

const DEFAULT_BONUS_ROUND = {
  id: "folded-note-round",
  title: "Bonusfrage",
  prompt:
    "Ihr habt am Anfang eine Zahl auf eine Karte geschrieben. Wie oft wurden diese Karten im Durchschnitt gefaltet?",
  answer: "4",
};

const BIRTH_SLOTS = [
  {
    id: "night",
    label: "Nachteulen",
    rangeLabel: "00:00-05:59",
    minMinute: 0,
    maxMinute: 5 * 60 + 59,
  },
  {
    id: "breakfast",
    label: "Frühe Vögel",
    rangeLabel: "06:00-11:59",
    minMinute: 6 * 60,
    maxMinute: 11 * 60 + 59,
  },
  {
    id: "midday",
    label: "Mittagskinder",
    rangeLabel: "12:00-17:59",
    minMinute: 12 * 60,
    maxMinute: 17 * 60 + 59,
  },
  {
    id: "prime",
    label: "Abendschwärmer",
    rangeLabel: "18:00-23:59",
    minMinute: 18 * 60,
    maxMinute: 23 * 60 + 59,
  },
];

function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/\ufeff/g, "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeCell(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function canonicalizeRow(row) {
  const next = {};

  Object.entries(row).forEach(([key, value]) => {
    next[normalizeHeader(key)] = normalizeCell(value);
  });

  return next;
}

function buildFrequencyEntries(values) {
  const entriesByKey = new Map();

  values.forEach((value) => {
    const label = normalizeCell(value);
    const key = normalizeHeader(label);

    if (!key) {
      return;
    }

    const existing = entriesByKey.get(key);

    if (existing) {
      existing.count += 1;
      return;
    }

    entriesByKey.set(key, {
      label,
      count: 1,
      order: entriesByKey.size,
    });
  });

  return Array.from(entriesByKey.values())
    .sort((left, right) => right.count - left.count || left.order - right.order)
    .map(({ order, ...entry }) => entry);
}

function compact(values) {
  return values.map(normalizeCell).filter(Boolean);
}

function parseBirthMinutes(value) {
  const normalized = normalizeHeader(value);

  if (!normalized) {
    return null;
  }

  const exactMatch = normalized.match(/\b(\d{1,2})[:.](\d{2})\b/);

  if (exactMatch) {
    const hour = Number(exactMatch[1]);
    const minute = Number(exactMatch[2]);

    if (hour <= 23 && minute <= 59) {
      return hour * 60 + minute;
    }
  }

  const hourOnlyMatch = normalized.match(/\b(\d{1,2})\s*uhr\b/);

  if (hourOnlyMatch) {
    const hour = Number(hourOnlyMatch[1]);

    if (hour <= 23) {
      return hour * 60;
    }
  }

  return null;
}

function getBirthSlot(minutes) {
  return BIRTH_SLOTS.find((slot) => minutes >= slot.minMinute && minutes <= slot.maxMinute) ?? null;
}

function buildSongCategory(rows) {
  const items = compact(rows.map((row) => row[SONG_KEY])).map((raw, index) => {
    const override = songOverrides[raw];

    return {
      id: `song-${index + 1}`,
      prompt: "Welcher Kindheits-Soundtrack wurde genannt?",
      entryLabel: `Songkarte ${index + 1}`,
      rawAnswer: raw,
      reveal: override?.reveal ?? raw,
      original: override?.reveal ? raw : null,
      artist: override?.artist ?? null,
      songTitle: override?.title ?? null,
      lyricSnippet: override?.lyricSnippet ?? null,
      youtubeVideos: override?.youtubeVideos ?? [],
    };
  });

  return {
    id: "songs",
    type: "song",
    title: "Kindheits-Soundtracks",
    subtitle: "",
    helper: "",
    palette: roundPalettes.songs,
    items,
  };
}

function buildBirthHeatmapCategory(rows) {
  const rawValues = compact(rows.map((row) => row[BIRTH_TIME_KEY]));
  const slots = BIRTH_SLOTS.map((slot) => ({
    ...slot,
    count: 0,
    examples: [],
  }));

  let unknownVotes = 0;

  rawValues.forEach((value) => {
    const minutes = parseBirthMinutes(value);

    if (minutes === null) {
      unknownVotes += 1;
      return;
    }

    const slot = getBirthSlot(minutes);

    if (!slot) {
      unknownVotes += 1;
      return;
    }

    const target = slots.find((entry) => entry.id === slot.id);

    if (!target) {
      unknownVotes += 1;
      return;
    }

    target.count += 1;

    if (target.examples.length < 3) {
      target.examples.push(value);
    }
  });

  return {
    id: "birth-heatmap",
    type: "heatmap",
    title: "Geburts-Slots",
    subtitle: "",
    helper: "",
    palette: roundPalettes.heatmap,
    items: [
      {
        id: "birth-heatmap-round",
        title: "Geburtszeit-Heatmap",
        prompt: "Wie verteilen sich unsere Geburtszeiten über den Tag?",
        totalVotes: rawValues.length,
        resolvedVotes: rawValues.length - unknownVotes,
        unknownVotes,
        slots,
      },
    ],
  };
}

function buildListItem({ id, title, prompt, values }) {
  return {
    id,
    title,
    prompt,
    answers: buildFrequencyEntries(values),
  };
}

function buildSurveySaysCategory({ itemValues, throwValues, nicknameValues }) {
  return {
    id: "survey-says",
    type: "list",
    title: "Survey says...",
    subtitle: "",
    helper: "",
    palette: roundPalettes.list,
    items: [
      buildListItem({
        id: "survey-packing",
        title: "Mitnehmen",
        prompt: "Was sagt ihr, muss man mit aufs Turnier nehmen?",
        values: itemValues,
      }),
      buildListItem({
        id: "survey-throws",
        title: "Würfe",
        prompt: "Welche Frisbeewürfe sind euch eingefallen?",
        values: throwValues,
      }),
      buildListItem({
        id: "survey-nicknames",
        title: "Spitznamen",
        prompt: "Welche Leute kennt ihr im Verein vor allem unter Spitznamen?",
        values: nicknameValues,
      }),
    ],
  };
}

function buildEitherOrCategory(rows) {
  const promptDefinitions = [
    {
      id: "sweet-salty",
      prompt: "Süß oder salzig?",
      key: "team suss oder team salzig?",
      options: [
        { label: "Süß", matches: ["suess", "suss"] },
        { label: "Salzig", matches: ["salzig"] },
      ],
    },
    {
      id: "summer-winter",
      prompt: "Sommer oder Winter?",
      key: "lieber sommer oder winter?",
      options: [
        { label: "Sommer", matches: ["sommer"] },
        { label: "Winter", matches: ["winter"] },
      ],
    },
    {
      id: "early-late",
      prompt: "FrühaufsteherIn oder LangschläferIn?",
      key: "fruher vogel oder bedachte nachteule?",
      options: [
        { label: "FrühaufsteherIn", matches: ["fruhaufsteherin", "fruehaufsteherin"] },
        { label: "LangschläferIn", matches: ["langschlaferin", "langschlaeferin"] },
      ],
    },
    {
      id: "indoor-outdoor",
      prompt: "Indoor oder Outdoor?",
      key: "unter hallendach oder unter freiem himmel?",
      options: [
        { label: "Indoor", matches: ["indoor"] },
        { label: "Outdoor", matches: ["outdoor"] },
      ],
    },
    {
      id: "strategy-chaos",
      prompt: "Strategie oder Chaos?",
      key: "lieber sauberer spielplan oder kontrolliertes durcheinander?",
      options: [
        { label: "Strategie", matches: ["strategie"] },
        { label: "Chaos", matches: ["chaos"] },
      ],
    },
    {
      id: "warmup-sprint",
      prompt: "Aufwärmen oder direkt losspielen?",
      key: 'bist du team "vernunftig aufwarmen" oder team "der erste sprint regelt das schon"?',
      options: [
        { label: "Aufwärmen", matches: ["aufwarmen", "aufwaermen"] },
        { label: "Direkt losspielen", matches: ["direkt losspielen"] },
      ],
    },
  ];

  const items = promptDefinitions.map((definition) => {
    const values = compact(rows.map((row) => row[definition.key]));
    const options = definition.options.map((option) => ({
      label: option.label,
      count: values.filter((value) => option.matches.includes(normalizeHeader(value))).length,
    }));

    return {
      id: definition.id,
      prompt: definition.prompt,
      totalVotes: values.length,
      options,
    };
  });

  return {
    id: "either-or",
    type: "eitherOr",
    title: "Entweder oder",
    subtitle: "",
    helper: "",
    palette: roundPalettes.eitherOr,
    items,
  };
}

function buildChatCategory() {
  return {
    id: "frisbee-chat",
    type: "chat",
    title: "Frisbee Chat",
    subtitle: "",
    helper: "",
    palette: roundPalettes.chat,
    items: chatRounds.map((round) => ({
      ...round,
      answer: `${round.left.name} und ${round.right.name}`,
    })),
  };
}

function buildNumberCategory(rawBonusRows) {
  const canonicalRows = (rawBonusRows ?? []).map(canonicalizeRow);
  const firstRow = canonicalRows.find((row) => row.prompt || row.answer);
  const prompt = normalizeCell(firstRow?.prompt) || DEFAULT_BONUS_ROUND.prompt;
  const answer = normalizeCell(firstRow?.answer) || DEFAULT_BONUS_ROUND.answer;

  return {
    id: "folded-number",
    type: "number",
    title: "Bonusfrage",
    subtitle: "",
    helper: "",
    palette: roundPalettes.number,
    items: [
      {
        ...DEFAULT_BONUS_ROUND,
        prompt,
        answer,
      },
    ],
  };
}

export function buildGameCategories(rawRows, rawBonusRows = []) {
  const rows = rawRows.map(canonicalizeRow);

  const itemValues = rows.flatMap((row) =>
    compact([
      row["1. gegenstand"],
      row["2. gegenstand"],
      row["3. gegenstand"],
      row["4. gegenstand"],
      row["5. gegenstand"],
    ]),
  );

  const throwValues = rows.flatMap((row) =>
    compact([
      row["1. wurf"],
      row["2. wurf"],
      row["3. wurf"],
      row["4. wurf"],
      row["5. wurf"],
    ]),
  );

  const nicknameValues = rows.flatMap((row) =>
    compact([
      row["1. person"],
      row["2. person"],
      row["3. person"],
      row["4. person"],
      row["5. person"],
    ]),
  );

  return [
    buildSongCategory(rows),
    buildBirthHeatmapCategory(rows),
    buildChatCategory(),
    buildSurveySaysCategory({
      itemValues,
      throwValues,
      nicknameValues,
    }),
    buildEitherOrCategory(rows),
    buildNumberCategory(rawBonusRows),
  ];
}
