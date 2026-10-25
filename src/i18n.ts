/** The plugin's text in English and Portuguese, picked from Steam's own UI language. */

const pt = {
  unlocked: "Conquista desbloqueada",
  rareUnlocked: "Conquista rara desbloqueada",
  enableLabel: "Notificação estilo console",
  enableDesc: "Troca o aviso de conquista da Steam pelo do console que você escolher.",
  skinLabel: "Estilo",
  skinXbox: "Xbox Series X|S",
  skinPlayStation: "PlayStation 5",
  soundSection: "Som",
  soundLabel: "Som da conquista",
  soundChime: "Toque do estilo (original)",
  soundCustom: "Meu arquivo de som",
  soundSteam: "Som da Steam",
  soundNone: "Sem som",
  pickFile: "Escolher arquivo de som",
  noFile: "Nenhum arquivo escolhido",
  fileHint: "MP3, OGG, WAV ou FLAC de até 3 MB.",
  fileError: "Não foi possível ler esse arquivo de som.",
  volume: "Volume",
  positionSection: "Posição",
  positionLabel: "Onde aparece",
  positions: {
    tl: "Em cima, à esquerda",
    tc: "Em cima, no centro",
    tr: "Em cima, à direita (PlayStation)",
    ml: "No meio, à esquerda",
    mc: "No centro da tela",
    mr: "No meio, à direita",
    bl: "Embaixo, à esquerda",
    bc: "Embaixo, no centro (Xbox)",
    br: "Embaixo, à direita",
  },
  edgeGap: "Distância da borda",
  rareSection: "Conquista rara",
  rareLabel: "Rara abaixo de",
  rareDesc: "Conquistas que menos jogadores têm do que isso ganham a versão rara (troféu de ouro no PlayStation).",
  trophyEarned: "Você ganhou um troféu",
  tiers: { bronze: "Bronze", silver: "Prata", gold: "Ouro" },
  showRarity: "Mostrar % de jogadores",
  testSection: "Testar",
  testNormal: "Testar notificação",
  testRare: "Testar conquista rara",
  testNeedsGame: "Jogue um jogo com conquistas para poder testar com ele.",
  supportSection: "Apoie o projeto",
  supportText: "Curtiu o plugin? Pague um café para o autor e ajude a manter as atualizações.",
  reset: "Restaurar padrões",
  players: (pct: string) => `${pct} dos jogadores`,
};

export type Strings = typeof pt;

const en: Strings = {
  unlocked: "Achievement unlocked",
  rareUnlocked: "Rare achievement unlocked",
  enableLabel: "Console-style notification",
  enableDesc: "Swaps Steam's achievement popup for the one from the console you pick.",
  skinLabel: "Style",
  skinXbox: "Xbox Series X|S",
  skinPlayStation: "PlayStation 5",
  soundSection: "Sound",
  soundLabel: "Achievement sound",
  soundChime: "Style's chime (original)",
  soundCustom: "My sound file",
  soundSteam: "Steam's sound",
  soundNone: "No sound",
  pickFile: "Choose a sound file",
  noFile: "No file chosen",
  fileHint: "MP3, OGG, WAV or FLAC up to 3 MB.",
  fileError: "Couldn't read that sound file.",
  volume: "Volume",
  positionSection: "Position",
  positionLabel: "Where it shows",
  positions: {
    tl: "Top left",
    tc: "Top center",
    tr: "Top right (PlayStation)",
    ml: "Middle left",
    mc: "Screen center",
    mr: "Middle right",
    bl: "Bottom left",
    bc: "Bottom center (Xbox)",
    br: "Bottom right",
  },
  edgeGap: "Distance from the edge",
  rareSection: "Rare achievement",
  rareLabel: "Rare below",
  rareDesc: "Achievements fewer players have than this get the rare version (a gold trophy on PlayStation).",
  trophyEarned: "You earned a trophy",
  tiers: { bronze: "Bronze", silver: "Silver", gold: "Gold" },
  showRarity: "Show % of players",
  testSection: "Test",
  testNormal: "Test notification",
  testRare: "Test rare achievement",
  testNeedsGame: "Play a game with achievements to test with it.",
  supportSection: "Support the project",
  supportText: "Enjoying the plugin? Buy the author a coffee and help keep it updated.",
  reset: "Reset to defaults",
  players: (pct: string) => `${pct} of players`,
};

function steamLocale(): string {
  try {
    const locales: string[] | undefined = (window as any).LocalizationManager?.GetPreferredLocales?.();
    if (locales?.[0]) return locales[0].toLowerCase();
  } catch {
    // fall through
  }
  return (navigator.language || "en").toLowerCase();
}

export const t: Strings = steamLocale().startsWith("pt") ? pt : en;
