// ─────────────────────────────────────────────────────────────────────────────
// MediGuide – Triage Engine (Bayessche Wahrscheinlichkeiten + Red-Flag-Logik)
// ─────────────────────────────────────────────────────────────────────────────

export interface DiseasePrior {
  [key: string]: number;
}

export const DISEASE_PRIORS: DiseasePrior = {
  erklaeltung:          0.30,
  grippe:               0.12,
  migraene:             0.10,
  blinddarmentzuendung: 0.04,
  gastritis:            0.08,
  rueckenschmerz:       0.12,
  harnwegsinfekt:       0.07,
  tonsillitis:          0.07,
  herzinfarkt_verdacht: 0.02,
  gesund:               0.08,
};

export const SYMPTOM_PROBABILITIES: Record<string, Record<string, number>> = {
  erklaeltung: {
    sym_fever:        0.30,
    sym_cough:        0.80,
    sym_headache:     0.60,
    sym_runny_nose:   0.90,
    sym_sore_throat:  0.60,
    sym_fatigue:      0.50,
  },
  grippe: {
    sym_fever:        0.92,
    sym_cough:        0.80,
    sym_headache:     0.80,
    sym_runny_nose:   0.50,
    sym_fatigue:      0.90,
    sym_body_ache:    0.85,
    sym_chills:       0.80,
  },
  migraene: {
    sym_headache:          0.95,
    sym_nausea:            0.60,
    sym_light_sensitive:   0.80,
    sym_sound_sensitive:   0.70,
    sym_fever:             0.01,
    sym_cough:             0.01,
    sym_aura:              0.30,
  },
  blinddarmentzuendung: {
    sym_fever:               0.65,
    sym_stomach_right_bottom:0.90,
    sym_nausea:              0.75,
    sym_loss_of_appetite:    0.70,
    sym_rebound_tenderness:  0.80,
  },
  gastritis: {
    sym_stomach_top:   0.85,
    sym_nausea:        0.65,
    sym_heartburn:     0.75,
    sym_belching:      0.60,
    sym_loss_of_appetite: 0.50,
  },
  rueckenschmerz: {
    sym_back_pain:        0.95,
    sym_leg_radiation:    0.50,
    sym_movement_limited: 0.75,
    sym_muscle_tension:   0.70,
    sym_morning_stiffness:0.60,
  },
  harnwegsinfekt: {
    sym_burning_urination: 0.90,
    sym_frequent_urination:0.85,
    sym_lower_abdomen_pain:0.70,
    sym_fever:             0.35,
    sym_cloudy_urine:      0.60,
  },
  tonsillitis: {
    sym_sore_throat:      0.90,
    sym_fever:            0.75,
    sym_swollen_lymph:    0.70,
    sym_difficulty_swallow:0.80,
    sym_white_coating:    0.60,
  },
  herzinfarkt_verdacht: {
    sym_chest_pain:       0.90,
    sym_chest_pressure:   0.85,
    sym_arm_radiation:    0.65,
    sym_shortness_breath: 0.75,
    sym_sweating:         0.65,
    sym_nausea:           0.50,
    sym_dizziness:        0.55,
  },
  gesund: {
    sym_fever:        0.01,
    sym_cough:        0.05,
    sym_headache:     0.10,
    sym_runny_nose:   0.05,
    sym_fatigue:      0.15,
  },
};

// ── Red-Flag-Regeln ──────────────────────────────────────────────────────────
// Wenn ANY dieser Kombos matcht → sofortiger Notfall-Hinweis
export interface RedFlag {
  id: string;
  label: string;
  keywords: string[]; // Keywords im Freitext (lowercase)
  symptoms: string[]; // Engine-Symptom-IDs
  message: string;
  call112: boolean;
}

export const RED_FLAGS: RedFlag[] = [
  {
    id: "rf_herzinfarkt",
    label: "Möglicher Herzinfarkt",
    keywords: ["brustschmerz", "herzschmerz", "druck auf der brust", "arm schmerzt", "linksseitig", "herzinfarkt"],
    symptoms: ["sym_chest_pain", "sym_chest_pressure"],
    message:
      "Deine Symptome können auf einen **Herzinfarkt** hindeuten. Das ist ein medizinischer Notfall. Rufe sofort **112** an oder lasse jemanden die 112 rufen!",
    call112: true,
  },
  {
    id: "rf_schlaganfall",
    label: "Möglicher Schlaganfall",
    keywords: ["schlaganfall", "lähmung", "gesicht hängt", "sprache", "sehstörung", "plötzliche schwäche", "taubheit"],
    symptoms: [],
    message:
      "Plötzliche Lähmung, Sprach- oder Sehstörung können auf einen **Schlaganfall** hindeuten. Jede Minute zählt – rufe sofort **112** an!",
    call112: true,
  },
  {
    id: "rf_anaphylaxie",
    label: "Allergischer Schock",
    keywords: ["allergischer schock", "anaphylaxie", "gesicht schwillt", "zunge schwillt", "kann nicht atmen", "epipen"],
    symptoms: [],
    message:
      "Schwellungen im Gesicht oder in der Kehle zusammen mit Atemnot können ein **anaphylaktischer Schock** sein. Rufe sofort **112** an!",
    call112: true,
  },
  {
    id: "rf_appendix",
    label: "Blinddarm-Verdacht",
    keywords: ["rechter unterbauch", "vom nabel gewandert", "blinddarm"],
    symptoms: ["sym_stomach_right_bottom", "sym_fever", "sym_nausea"],
    message:
      "Schmerzen im rechten Unterbauch mit Fieber und Übelkeit können auf eine **Blinddarmentzündung** hinweisen. Bitte suche umgehend eine Notaufnahme auf!",
    call112: false,
  },
  {
    id: "rf_atemnot",
    label: "Starke Atemnot",
    keywords: ["atemnot", "kann nicht atmen", "luftnot", "ersticken", "kurzatmig"],
    symptoms: ["sym_shortness_breath"],
    message:
      "Starke Atemnot ist ein Warnsignal. Rufe sofort **112** an oder lasse dich von jemandem in die nächste Notaufnahme bringen!",
    call112: true,
  },
];

// ── Fragen-Map ────────────────────────────────────────────────────────────────
export const QUESTIONS_MAP: Record<string, string> = {
  sym_fever:              "Hast du auch Fieber (über 38°C) oder fühlst dich ungewöhnlich heiß?",
  sym_cough:              "Musst du regelmäßig husten?",
  sym_headache:           "Hast du begleitend auch Kopfschmerzen?",
  sym_nausea:             "Ist dir auch übel oder musstest du dich vielleicht sogar übergeben?",
  sym_light_sensitive:    "Bist du aktuell lichtempfindlich (tun helle Lampen weh)?",
  sym_sound_sensitive:    "Stören dich aktuell Geräusche mehr als sonst?",
  sym_runny_nose:         "Hast du Schnupfen oder eine verstopfte Nase?",
  sym_sore_throat:        "Hast du auch Halsschmerzen?",
  sym_fatigue:            "Fühlst du dich ungewöhnlich erschöpft oder schlapp?",
  sym_body_ache:          "Hast du starke Gliederschmerzen?",
  sym_chills:             "Hast du Schüttelfrost oder frierst du ungewöhnlich stark?",
  sym_aura:               "Hattest du vor dem Kopfschmerz Sehphänomene (Flackern, Blitze) oder Taubheitsgefühle?",
  sym_stomach_right_bottom:"Tut es besonders auf der rechten, unteren Seite deines Bauches weh?",
  sym_stomach_top:        "Tut es eher oben, evtl. brennend nach dem Essen weh?",
  sym_heartburn:          "Hast du Sodbrennen oder saures Aufstoßen?",
  sym_belching:           "Musst du häufig aufstoßen?",
  sym_loss_of_appetite:   "Hast du keinen Appetit mehr?",
  sym_rebound_tenderness: "Wenn du auf den Bauch drückst und die Hand schnell wegnimmst – schmerzt das dann besonders stark?",
  sym_back_pain:          "Wo genau ist der Rückenschmerz? (Hals, Mitte, Lendenwirbel?)",
  sym_leg_radiation:      "Strahlt der Schmerz ins Bein oder in den Fuß aus?",
  sym_movement_limited:   "Ist deine Bewegungsfreiheit durch den Schmerz eingeschränkt?",
  sym_burning_urination:  "Spürst du ein Brennen beim Wasserlassen?",
  sym_frequent_urination: "Muss du deutlich häufiger als sonst auf die Toilette?",
  sym_lower_abdomen_pain: "Hast du auch Schmerzen im Unterbauch oder Rücken?",
  sym_swollen_lymph:      "Sind deine Lymphknoten am Hals geschwollen oder druckempfindlich?",
  sym_difficulty_swallow: "Fällt es dir schmerzhaft schwer zu schlucken?",
  sym_white_coating:      "Siehst du weiße Beläge oder Punkte auf deinen Mandeln?",
  sym_chest_pain:         "Hast du Schmerzen oder Druck in der Brust?",
  sym_chest_pressure:     "Fühlst du einen Druck oder ein Engegefühl in der Brust?",
  sym_arm_radiation:      "Strahlt der Schmerz in den linken Arm, Kiefer oder Rücken aus?",
  sym_shortness_breath:   "Hast du Atemnot oder das Gefühl, nicht genug Luft zu bekommen?",
  sym_sweating:           "Schwitzt du ungewöhnlich stark oder kalt?",
  sym_dizziness:          "Bist du schwindelig oder hast du das Gefühl, gleich ohnmächtig zu werden?",
  sym_cloudy_urine:       "Ist dein Urin trüb, dunkler als sonst oder riecht ungewöhnlich?",
  sym_muscle_tension:     "Spürst du eine starke Muskelverspannung im Rücken?",
  sym_morning_stiffness:  "Bist du morgens besonders steif im Rücken?",
};

// ── Empfehlungen ──────────────────────────────────────────────────────────────
export interface Recommendation {
  severity: "success" | "warning" | "danger";
  urgency: "selfcare" | "gp_within_days" | "gp_today" | "emergency_room" | "call_112";
  recommended_provider: "none" | "hausarzt" | "facharzt" | "apotheke" | "notaufnahme" | "telemedizin";
  icon: string;
  title: string;
  description: string;
  actions: string[];
  selfcare_tips: string[];
}

export const RECOMMENDATIONS: Record<string, Recommendation> = {
  erklaeltung: {
    severity: "success",
    urgency: "selfcare",
    recommended_provider: "apotheke",
    icon: "drop",
    title: "Erkältung (grippaler Infekt)",
    description: "Deine Symptome deuten auf eine klassische, in der Regel harmlose Erkältung hin.",
    actions: [
      "Viel Wasser oder ungesüßten Tee trinken (mind. 2 Liter täglich).",
      "Körperliche Schonung – kein Sport für mindestens 3 Tage.",
      "Falls nötig: Ibuprofen oder Paracetamol gegen Fieber und Schmerzen.",
    ],
    selfcare_tips: [
      "Nasenspülungen mit Salzwasser helfen bei Verstopfung.",
      "Feuchte Luft (Luftbefeuchter) lindert Husten.",
      "Vitamin C und Zink können die Dauer verkürzen.",
    ],
  },
  grippe: {
    severity: "warning",
    urgency: "gp_within_days",
    recommended_provider: "hausarzt",
    icon: "thermometer",
    title: "Verdacht auf Influenza (echte Grippe)",
    description: "Hohes Fieber + starke Gliederschmerzen deuten auf eine echte Grippe hin – schwerer als eine Erkältung.",
    actions: [
      "Strikte Bettruhe für mindestens 5–7 Tage.",
      "Arzt konsultieren, wenn Fieber über 40°C oder über 3 Tage anhält.",
      "Kontakt zu Risikopatienten (Ältere, Immunschwache) unbedingt meiden.",
    ],
    selfcare_tips: [
      "Viel trinken – mind. 2–3 Liter täglich.",
      "Wadenwickel bei sehr hohem Fieber.",
      "Antiviralia (Tamiflu) wirken am besten in den ersten 48h – Arzt fragen.",
    ],
  },
  migraene: {
    severity: "warning",
    urgency: "gp_within_days",
    recommended_provider: "hausarzt",
    icon: "bandaids",
    title: "Verdacht auf Migräne",
    description: "Pochende Kopfschmerzen mit Licht-/Lärmempfindlichkeit und Übelkeit sind typisch für Migräne.",
    actions: [
      "Ziehe dich in einen abgedunkelten, ruhigen Raum zurück.",
      "Kühle Kompressen auf Stirn oder Nacken.",
      "Bei bekannter Migräne: Triptane oder andere Migränemittel nehmen.",
    ],
    selfcare_tips: [
      "Schlafentzug und unregelmäßige Mahlzeiten können Migräne auslösen.",
      "Migräne-Tagebuch führen, um Auslöser zu identifizieren.",
      "EIn Facharzt (Neurologe) kann Prophylaxe-Therapie verschreiben.",
    ],
  },
  blinddarmentzuendung: {
    severity: "danger",
    urgency: "emergency_room",
    recommended_provider: "notaufnahme",
    icon: "warning-circle",
    title: "⚠️ Notfall-Verdacht: Appendizitis",
    description:
      "Schmerzen im rechten Unterbauch + Übelkeit + Fieber sind dringende Warnzeichen. Bitte sofort ärztlich abklären lassen!",
    actions: [
      "Begib dich sofort in eine Notaufnahme oder rufe 112.",
      "Nimm KEINE Schmerzmittel vor der Diagnose – sie verschleiern die Symptome!",
      "Nicht essen oder trinken bis zur Untersuchung.",
    ],
    selfcare_tips: [],
  },
  gastritis: {
    severity: "warning",
    urgency: "gp_within_days",
    recommended_provider: "hausarzt",
    icon: "coffee",
    title: "Vermutung: Gastritis / Magenprobleme",
    description: "Brennende Oberbauchschmerzen, Sodbrennen und Übelkeit deuten auf eine gereizte Magenschleimhaut hin.",
    actions: [
      "Verzichte auf Kaffee, Alkohol, scharfe und fettige Speisen.",
      "Iss mehrere, kleine und leichte Mahlzeiten täglich.",
      "In der Apotheke nach Protonenpumpenhemmern (PPI) oder Antazida fragen.",
    ],
    selfcare_tips: [
      "Stressabbau kann Gastritis verbessern.",
      "Nicht auf nüchternen Magen Ibuprofen nehmen.",
      "Schleimhaut-schonende Ernährung: Haferflocken, Bananen, Kartoffeln.",
    ],
  },
  rueckenschmerz: {
    severity: "warning",
    urgency: "gp_within_days",
    recommended_provider: "hausarzt",
    icon: "activity",
    title: "Rückenschmerzen",
    description: "Verspannungen, Fehlhaltungen oder HWS-Probleme sind häufige Ursachen. Nur selten liegt etwas Ernstes vor.",
    actions: [
      "Aktiv bleiben – Bettruhe verschlimmert Rückenschmerzen oft.",
      "Wärme (Wärmflasche, Wärme-Patch) hilft entspannen.",
      "Hausarzt konsultieren, wenn Schmerzen nach 1–2 Wochen nicht besser werden.",
    ],
    selfcare_tips: [
      "Sanfte Übungen (Yoga, Physiotherapie) helfen langfristig.",
      "Ergonomischer Arbeitsplatz prüfen.",
      "Bei Ausstrahlung ins Bein: Nervenwurzel-Reizung möglich – Arzt aufsuchen.",
    ],
  },
  harnwegsinfekt: {
    severity: "warning",
    urgency: "gp_today",
    recommended_provider: "hausarzt",
    icon: "drop",
    title: "Verdacht auf Harnwegsinfekt",
    description: "Brennen beim Wasserlassen und häufiger Harndrang deuten auf eine Blasenentzündung hin.",
    actions: [
      "Viel Wasser trinken (mind. 3 Liter täglich) um Bakterien auszuspülen.",
      "Wärme an Bauch und Rücken hilft gegen Krämpfe.",
      "Arzt aufsuchen für Antibiotika – HWI heilt selten ohne Behandlung.",
    ],
    selfcare_tips: [
      "Cranberry-Produkte können vorbeugend helfen.",
      "Nicht zu lange den Harndrang unterdrücken.",
      "Bei Fieber > 38,5°C: Nierenbeckenentzündung möglich – sofort zum Arzt!",
    ],
  },
  tonsillitis: {
    severity: "warning",
    urgency: "gp_today",
    recommended_provider: "hausarzt",
    icon: "smiley-x-eyes",
    title: "Verdacht auf Mandelentzündung",
    description: "Starke Halsschmerzen, Schluckbeschwerden und geschwollene Lymphknoten deuten auf Tonsillitis hin.",
    actions: [
      "Hausarzt aufsuchen – bei bakterieller Tonsillitis sind Antibiotika nötig.",
      "Kühle Getränke und Eis lindern die Schmerzen.",
      "Ibuprofen oder Paracetamol gegen Schmerzen und Fieber.",
    ],
    selfcare_tips: [
      "Keine Ansteckung anderer solange du krank bist.",
      "Schmerzen beim Schlucken: Ernährung auf Flüssiges umstellen.",
      "Bei sehr starker Schwellung (Atemnot beim Liegen): Sofort Arzt aufsuchen!",
    ],
  },
  herzinfarkt_verdacht: {
    severity: "danger",
    urgency: "call_112",
    recommended_provider: "notaufnahme",
    icon: "warning-octagon",
    title: "🚨 NOTFALL: Möglicher Herzinfarkt",
    description:
      "Deine Symptome können auf einen Herzinfarkt hindeuten. Jede Minute zählt. Rufe JETZT 112 an!",
    actions: [
      "Sofort 112 anrufen!",
      "Setze dich ruhig hin oder lege dich hin.",
      "Enge Kleidung öffnen.",
      "Wenn vorhanden und nicht kontraindiziert: 1 Aspirin kauen (nicht schlucken).",
    ],
    selfcare_tips: [],
  },
  gesund: {
    severity: "success",
    urgency: "selfcare",
    recommended_provider: "none",
    icon: "check-circle",
    title: "Kein akutes Krankheitsbild erkannt",
    description: "Aktuell können wir kein klares Profil erkennen. Beobachte deine Symptome.",
    actions: [
      "Beobachte deine Symptome aufmerksam.",
      "Trinke ausreichend und ruh dich aus.",
      "Sollte es schlimmer werden, starte eine neue Bewertung oder besuche einen Arzt.",
    ],
    selfcare_tips: [
      "Ausgewogene Ernährung, ausreichend Schlaf und Bewegung stärken das Immunsystem.",
    ],
  },
};

// ── Demografische Anpassungsfaktoren ──────────────────────────────────────────
const GENDER_PROBABILITIES: Record<string, Record<string, number>> = {
  migraene:    { female: 0.72, male: 0.28, other: 0.50 },
  harnwegsinfekt: { female: 0.80, male: 0.20, other: 0.50 },
};

const AGE_PROBABILITIES: Record<string, Record<string, number>> = {
  blinddarmentzuendung: { child: 0.50, adult: 0.80, senior: 0.10 },
  gastritis:            { child: 0.10, adult: 0.40, senior: 0.80 },
  erklaeltung:          { child: 0.90, adult: 0.60, senior: 0.40 },
  grippe:               { child: 0.70, adult: 0.70, senior: 0.70 },
  migraene:             { child: 0.20, adult: 0.80, senior: 0.40 },
  harnwegsinfekt:       { child: 0.20, adult: 0.65, senior: 0.60 },
  tonsillitis:          { child: 0.80, adult: 0.50, senior: 0.20 },
  herzinfarkt_verdacht: { child: 0.01, adult: 0.30, senior: 0.80 },
  rueckenschmerz:       { child: 0.10, adult: 0.70, senior: 0.80 },
  gesund:               { child: 0.50, adult: 0.50, senior: 0.50 },
};

// ── Kernfunktionen ────────────────────────────────────────────────────────────

const DEFAULT_SYMPTOM_PROB = 0.01;

export function checkRedFlags(text: string): RedFlag | null {
  const lower = text.toLowerCase();
  for (const flag of RED_FLAGS) {
    if (flag.keywords.some((kw) => lower.includes(kw))) {
      return flag;
    }
  }
  return null;
}

export function calculateProbabilities(
  user_symptoms: string[],
  ageGroup: string | null,
  gender: string
): Array<{ disease_id: string; disease_name: string; probability: number }> {
  const posteriors: Record<string, number> = {};

  for (const [disease, prior] of Object.entries(DISEASE_PRIORS)) {
    let prob = prior;

    const pGender = GENDER_PROBABILITIES[disease]?.[gender] ?? 0.5;
    prob *= pGender;

    if (ageGroup !== null) {
      const pAge = AGE_PROBABILITIES[disease]?.[ageGroup] ?? 0.5;
      prob *= pAge;
    }

    for (const symptom of user_symptoms) {
      const diseaseSyms = SYMPTOM_PROBABILITIES[disease] || {};
      const p = diseaseSyms[symptom] !== undefined ? diseaseSyms[symptom] : DEFAULT_SYMPTOM_PROB;
      prob *= p;
    }
    posteriors[disease] = prob;
  }

  const total = Object.values(posteriors).reduce((a, b) => a + b, 0);
  const results = [];

  if (total > 0) {
    for (const [disease, p] of Object.entries(posteriors)) {
      results.push({
        disease_id: disease,
        disease_name: disease.charAt(0).toUpperCase() + disease.slice(1).replace(/_/g, " "),
        probability: parseFloat(((p / total) * 100).toFixed(2)),
      });
    }
  }

  results.sort((a, b) => b.probability - a.probability);
  return results;
}

export function getNextQuestion(
  current_symptoms: string[],
  rejected_symptoms: string[],
  top_disease: string
): { symptom_id: string; text: string } | null {
  const disease_symptoms = SYMPTOM_PROBABILITIES[top_disease] || {};

  const sorted = Object.entries(disease_symptoms).sort((a, b) => b[1] - a[1]);

  for (const [sym_id, prob] of sorted) {
    if (
      !current_symptoms.includes(sym_id) &&
      !rejected_symptoms.includes(sym_id) &&
      prob > 0.3
    ) {
      const question_text = QUESTIONS_MAP[sym_id];
      if (question_text) return { symptom_id: sym_id, text: question_text };
    }
  }
  return null;
}

export function getRecommendation(disease_id: string): Recommendation {
  return RECOMMENDATIONS[disease_id] || RECOMMENDATIONS["gesund"];
}
