const chatCharacterAssets = import.meta.glob("../assets/*.{png,jpg,jpeg,PNG,JPG,JPEG}", {
  eager: true,
  import: "default",
});

function getChatCharacterImage(fileName) {
  const entry = Object.entries(chatCharacterAssets).find(([assetPath]) =>
    assetPath.endsWith(`/${fileName}`),
  );

  return entry?.[1] ?? "";
}

export const chatRounds = [
  {
    id: "chat-clearing-line",
    title: "Chat 1",
    label: "Wurf-Session",
    subtitle: "",
    left: {
      name: "Arne",
      clue: "",
      imageSrc: getChatCharacterImage("Arne.jpeg"),
    },
    right: {
      name: "Vanessa",
      clue: "",
      imageSrc: getChatCharacterImage("Vanessa.jpeg"),
    },
    messages: [
      {
        side: "left",
        text: "Jojo, hättest du Donnerstag so gegen 11 Lust, ein bisschen zu werfen? Bin gerade echt nicht so zufrieden mit meinen Würfen",
      },
      { side: "right", text: "Ich muss da leider arbeiten. 😅" },
      { side: "right", text: "Geht Sonntag auch?" },
      {
        side: "left",
        text: "Sonntag kann ich leider nicht, da ist Hessenmeisterschaft und meine Partnerin kommt extra aus München",
      },
      {
        side: "right",
        text: "Vielleicht kann ich Home Office machen, aber ich hab echt viele Meetings und könnte dann nicht so lang.",
      },
      { side: "right", text: "Vorher noch einen Kaffee bei mir aus der neuen Maschine?" },
      { side: "left", text: "Ajoo, da sag ich nicht nein zu" },
      { side: "left", text: "Würde danach noch in die Bib gehen" },
      { side: "right", text: "Supi, vielleicht kommt David auch noch dazu." },
    ],
  },
  {
    id: "chat-sideline",
    title: "Chat 2",
    label: "Sideline-Vibes",
    subtitle: "",
    left: {
      name: "Pauli",
      clue: "",
      imageSrc: getChatCharacterImage("Pauli.jpeg"),
    },
    right: {
      name: "Jan",
      clue: "",
      imageSrc: getChatCharacterImage("Jan.jpeg"),
    },
    messages: [
      { side: "left", text: "Hey, wir müssen uns echt mal wegen der Saison-Planung zusammensetzen." },
      { side: "right", text: "Ja safe haha" },
      { side: "right", text: "Ich hab mies Bock, noch mal so eine letzte Saison mit dem Team zu spielen" },
      {
        side: "left",
        text: "Problem ist nur, dass wir grad noch gar nicht wissen, ob das überhaupt stattfindet 😅",
      },
      { side: "right", text: "Wichtig hahaha" },
      {
        side: "right",
        text: "Ich hoffe nur, dass die DHM nicht wieder genau auf ein Schalke-Spiel fällt 😂",
      },
      { side: "left", text: "Da nimmst du dir dann halt frei haha" },
      {
        side: "left",
        text: "Ich muss eher schauen, weil ich im Sommer ein paar Mal nach Jena muss",
      },
      { side: "left", text: "Aber wenn's drauf ankommt, schieb ich das auch" },
      {
        side: "right",
        text: "Meinst du, wir dürften nächstes Jahr theoretisch auch noch spielen, wenn's dieses Jahr nicht stattfindet?",
      },
      {
        side: "right",
        text: "Wir studieren ja jetzt eigentlich beide schon nicht mehr ahaha",
      },
      { side: "left", text: "Ja bestimmt" },
      {
        side: "left",
        text: "Aber ich glaub schon, dass das dieses Jahr stattfindet",
      },
    ],
  },
  {
    id: "chat-training-plan",
    title: "Chat 3",
    label: "Trainingsplanung",
    subtitle: "",
    left: {
      name: "Jonas",
      clue: "",
      imageSrc: getChatCharacterImage("Jonas.jpeg"),
    },
    right: {
      name: "Ebba",
      clue: "",
      imageSrc: getChatCharacterImage("Ebba.jpeg"),
    },
    messages: [
      {
        side: "left",
        text: "Hallo, ich überlege, ob wir in der nächsten Einheit bereits Overheads einführen wollen.",
      },
      {
        side: "right",
        text: "Ich halte das ehrlich gesagt noch für zu früh.",
      },
      {
        side: "right",
        text: "Overheads sind schon deutlich schwieriger als das, woran wir bisher gearbeitet haben.",
      },
      {
        side: "left",
        text: "Ja, das ist aber auch der einzige Wurf, den ich den Studies aktuell wirklich voraus habe.",
      },
      {
        side: "left",
        text: "Kannst du dafür Hütchen mitbringen? Ich komme direkt aus dem Büro in Bockenheim und habe dort leider keine.",
      },
      {
        side: "right",
        text: "Ich muss erst mit meinem Verlobten abklären, ob ich vorher überhaupt zu Hause bin.",
      },
      {
        side: "right",
        text: "Sonst schreib bitte Markus, damit er welche mitbringt.",
      },
      {
        side: "left",
        text: "Gut, dann mache ich das so.",
      },
      {
        side: "left",
        text: "Ich muss vorher noch vernünftige Longsleeves fürs Training kaufen, es ist inzwischen einfach zu kalt.",
      },
      {
        side: "right",
        text: "Findest du?",
      },
      {
        side: "right",
        text: "Ich werde trotzdem weiter in kurzen Sachen kommen.",
      },
    ],
  },
];
