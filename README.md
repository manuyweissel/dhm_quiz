# dhm_quiz

Lokale Quiz-Show für den `Start of Season DHM` auf Basis von `Vite + React`.

## Überblick

Das Projekt bündelt mehrere Quizrunden in einer Oberfläche:

- Kindheits-Soundtracks
- Geburtszeit-Heatmap
- Frisbee Chat
- Survey says...
- Entweder oder
- Bonusfrage

Die App lädt die Spielinhalte aus CSV-Dateien und ergänzt einige kuratierte Inhalte wie Chat-Runden und Song-Mappings aus dem `src/data/content`-Bereich.

## Entwicklung starten

```bash
npm install
npm run dev
```

Produktions-Build:

```bash
npm run build
```

## Projektstruktur

```text
src/
  components/rounds/   Rundentypen und Spieloberflächen
  data/
    content/           kuratierte Inhalte wie Chats, Song-Mappings, Paletten
    Einladung zur Party.csv
    bonus_round.csv
    buildGameCategories.js
  lib/                 gemeinsame Helper und Round-State
  App.jsx              App-Shell und globaler Spielstand
  main.jsx             Einstiegspunkt
  styles.css           globales Styling
```

## Datenquellen

- `src/data/Einladung zur Party.csv`
  Teilnehmerantworten für Songs, Geburtszeiten, Survey says und Entweder-oder
- `src/data/bonus_round.csv`
  Prompt und Antwort der Bonusfrage
- `src/data/content/`
  zusätzliche manuell gepflegte Inhalte, die aktuell nicht aus der Einladungs-CSV kommen

## Tech Stack

- React 18
- Vite 5
- Papa Parse
