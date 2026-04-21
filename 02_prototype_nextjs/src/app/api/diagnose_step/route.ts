import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  calculateProbabilities,
  getNextQuestion,
  getRecommendation,
  checkRedFlags,
  SYMPTOM_PROBABILITIES,
} from "@/lib/engine";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = (apiKey && apiKey !== "YOUR_API_KEY_HERE") ? new GoogleGenerativeAI(apiKey) : null;

// ── Keyword-basierter Fallback-Extraktor (kein API-Key nötig) ─────────────────
// Mappt deutsche Begriffe direkt auf Engine-Symptom-IDs.
// Reihenfolge: spezifischere Begriffe zuerst.
const KEYWORD_MAP: [string[], string][] = [
  // Kopf
  [["migräne", "migraene", "pochend", "pulsierend", "halbseitig"], "sym_headache"],
  [["kopfschmerz", "kopfweh", "kopf tut weh", "kopf schmerzt", "kopf"], "sym_headache"],
  [["lichtempfindlich", "licht tut weh", "grelles licht", "blendend"], "sym_light_sensitive"],
  [["geräuschempfindlich", "lärm", "sound sensitive"], "sym_sound_sensitive"],
  [["aura", "sehstörung", "flackern", "blitze vor augen"], "sym_aura"],

  // Erkältung / Grippe
  [["schnupfen", "laufende nase", "verstopfte nase", "nase läuft", "nase zu"], "sym_runny_nose"],
  [["husten", "huste", "hustenreiz", "trockener husten"], "sym_cough"],
  [["fieber", "temperatur hoch", "erhöhte temperatur", "hitze", "fiebert"], "sym_fever"],
  [["schüttelfrost", "friere", "zittern", "frösteln"], "sym_chills"],
  [["gliederschmerz", "körper schmerzt", "alles tut weh", "muskelschmerz"], "sym_body_ache"],
  [["erschöpft", "müde", "schlapp", "kraftlos", "abgeschlagen", "fatigue"], "sym_fatigue"],
  [["halsschmerzen", "hals tut weh", "schlucken schmerzt", "kratzt im hals"], "sym_sore_throat"],

  // Magen / Darm
  [["sodbrennen", "brennen nach essen", "sauer aufstoßen", "magensäure"], "sym_heartburn"],
  [["aufstoßen", "aufstossen", "rülpsen"], "sym_belching"],
  [["übelkeit", "mir ist übel", "schlecht", "brechreiz", "muss würgen"], "sym_nausea"],
  [["rechter unterbauch", "rechts unten", "unterbauch rechts", "blinddarm", "appendix"], "sym_stomach_right_bottom"],
  [["oberbauch", "oberer bauch", "magenschmerz", "magen tut weh", "nach dem essen"], "sym_stomach_top"],
  [["kein appetit", "appetitlos", "will nicht essen", "mag nichts essen"], "sym_loss_of_appetite"],
  [["bauchschmerzen", "bauch", "bauch tut weh"], "sym_stomach_top"],

  // Rücken
  [["rückenschmerz", "rücken tut weh", "rücken schmerzt", "lendenwirbel", "hws"], "sym_back_pain"],
  [["ausstrahlung ins bein", "bein schläft ein", "kribbeln im bein", "ischiasschmerz"], "sym_leg_radiation"],
  [["bewegung eingeschränkt", "kann mich kaum bewegen", "eingeschränkte bewegung"], "sym_movement_limited"],
  [["verspannung", "verspannt", "muskelverhärtung"], "sym_muscle_tension"],

  // Harnwege
  [["brennen beim wasserlassen", "schmerzen beim urinieren", "brennt beim pinkeln"], "sym_burning_urination"],
  [["häufig aufs klo", "häufig wasserlassen", "oft pinkeln", "häufig urinieren"], "sym_frequent_urination"],
  [["trüber urin", "urin riecht", "urin dunkel"], "sym_cloudy_urine"],

  // Mandeln / Hals
  [["mandeln", "mandelentzündung", "beläge auf den mandeln", "weiße flecken hals"], "sym_white_coating"],
  [["lymphknoten", "drüsen geschwollen", "geschwollene lymphknoten"], "sym_swollen_lymph"],
  [["schlucken fällt schwer", "schlucken unmöglich"], "sym_difficulty_swallow"],

  // Herz / Notfall
  [["brustschmerzen", "brust tut weh", "druck auf der brust", "engegefühl brust"], "sym_chest_pain"],
  [["druck auf der brust", "brust drückt"], "sym_chest_pressure"],
  [["in den arm ausstrahlend", "linker arm", "arm tut weh dazu"], "sym_arm_radiation"],
  [["atemnot", "kurzatmig", "kann nicht atmen", "luftnot", "atemprobleme"], "sym_shortness_breath"],
  [["schwitze stark", "kalter schweiß", "schwitze viel"], "sym_sweating"],
  [["schwindel", "schwindelig", "dreh mich", "alles dreht sich", "benommenheit"], "sym_dizziness"],
];

function extractKeywordSymptoms(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const [keywords, symptomId] of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.add(symptomId);
    }
  }
  return Array.from(found);
}

// ── Kontext-sensitive Rückfrage (ohne API-Key) ─────────────────────────────────
// Gibt eine passende Nachfrage + Buttons zurück basierend auf was schon erkannt wurde.
function buildFallbackQuestion(
  detectedSymptoms: string[],
  questionCount: number
): { question: string; options: string[] } {
  // Spezifische Folgefragen je nach erkannten Symptomen
  if (detectedSymptoms.includes("sym_headache")) {
    if (!detectedSymptoms.includes("sym_nausea")) {
      return {
        question: "Ist dir dazu auch gleichzeitig übel oder hast du dich übergeben müssen?",
        options: ["Ja, mir ist übel", "Ich musste mich übergeben", "Nein, kein Übelkeit"],
      };
    }
    if (!detectedSymptoms.includes("sym_light_sensitive")) {
      return {
        question: "Stört dich aktuell helles Licht besonders stark?",
        options: ["Ja, Licht tut weh", "Nein, nicht wirklich", "Ein bisschen"],
      };
    }
  }
  if (detectedSymptoms.includes("sym_cough")) {
    if (!detectedSymptoms.includes("sym_fever")) {
      return {
        question: "Hast du dabei auch Fieber oder fühlst dich ungewöhnlich heiß?",
        options: ["Ja, ich habe Fieber", "Kein Fieber, aber ich fühle mich heiß", "Nein, kein Fieber"],
      };
    }
  }
  if (detectedSymptoms.includes("sym_stomach_top") || detectedSymptoms.includes("sym_stomach_right_bottom")) {
    if (!detectedSymptoms.includes("sym_nausea")) {
      return {
        question: "Ist dir dabei auch übel oder hast du Appetitlosigkeit?",
        options: ["Ja, mir ist sehr übel", "Leichte Übelkeit", "Nein"],
      };
    }
  }
  if (detectedSymptoms.includes("sym_sore_throat")) {
    if (!detectedSymptoms.includes("sym_fever")) {
      return {
        question: "Hast du dabei auch Fieber oder geschwollene Lymphknoten am Hals?",
        options: ["Ja, Fieber über 38°C", "Hals ist geschwollen", "Nein, nur Halsschmerzen"],
      };
    }
  }
  if (detectedSymptoms.includes("sym_back_pain")) {
    if (!detectedSymptoms.includes("sym_leg_radiation")) {
      return {
        question: "Strahlt der Schmerz in ein Bein oder in den Fuß aus?",
        options: ["Ja, ins linke Bein", "Ja, ins rechte Bein", "Nein, nur im Rücken"],
      };
    }
  }

  // Generische Rückfrage wenn keine erkannt wurden
  if (questionCount === 0) {
    return {
      question:
        "Bitte beschreibe, welcher Körperbereich betroffen ist und wie sich das Symptom anfühlt.",
      options: [
        "Kopfbereich (Schmerzen, Schwindel)",
        "Bauch / Magen (Schmerzen, Übelkeit)",
        "Brust / Hals (Husten, Halsschmerzen)",
        "Rücken / Glieder (Schmerzen)",
      ],
    };
  }

  return {
    question: "Gibt es noch weitere Begleitsymptome, die du mir mitteilen möchtest?",
    options: ["Fieber", "Übelkeit", "Erschöpfung", "Nein, das war alles"],
  };
}

// ── Schnell-Symptom-Map für Button-Antworten ──────────────────────────────────
// Wenn Nutzer auf einen Button klickt, muss das ebenfalls als Symptom extrahiert werden.
const BUTTON_SYMPTOM_MAP: Record<string, string[]> = {
  "ja, mir ist übel":          ["sym_nausea"],
  "ich musste mich übergeben": ["sym_nausea"],
  "ja, licht tut weh":         ["sym_light_sensitive"],
  "ja, ich habe fieber":       ["sym_fever"],
  "kein fieber, aber ich fühle mich heiß": ["sym_fever"],
  "ja, fieber über 38°c":      ["sym_fever"],
  "hals ist geschwollen":      ["sym_swollen_lymph"],
  "ja, ins linke bein":        ["sym_leg_radiation"],
  "ja, ins rechte bein":       ["sym_leg_radiation"],
  "ja, mir ist sehr übel":     ["sym_nausea"],
  "leichte übelkeit":          ["sym_nausea"],
  "fieber":                    ["sym_fever"],
  "übelkeit":                  ["sym_nausea"],
  "erschöpfung":               ["sym_fatigue"],
  "kopfbereich (schmerzen, schwindel)":    ["sym_headache"],
  "bauch / magen (schmerzen, übelkeit)":  ["sym_stomach_top"],
  "brust / hals (husten, halsschmerzen)": ["sym_cough", "sym_sore_throat"],
  "rücken / glieder (schmerzen)":         ["sym_back_pain"],
};

function extractButtonSymptoms(text: string): string[] {
  const lower = text.toLowerCase().trim();
  return BUTTON_SYMPTOM_MAP[lower] || [];
}

// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      ageGroup,
      gender,
      text,
      chat_history = [],
      confirmed_symptoms = [],
      rejected_symptoms = [],
      question_count = 0,
      asked_symptom = null,
    } = body;

    // ── 1. Red-Flag-Check ─────────────────────────────────────────────────────
    const fullText = [
      text,
      ...chat_history.map((m: { text: string }) => m.text),
    ].join(" ");
    const redFlag = checkRedFlags(fullText);
    if (redFlag) {
      return NextResponse.json({ status: "red_flag", red_flag: redFlag });
    }

    // ── 2. Symptom-Extraktion ─────────────────────────────────────────────────
    let llm_resp: {
      action: string;
      question?: string;
      options?: string[];
      symptoms?: string[];
    } = { action: "extract", symptoms: [] };

    if (genAI) {
      // ── Pfad A: Gemini API verfügbar ──────────────────────────────────────
      const known_symptoms = Array.from(
        new Set(
          Object.values(SYMPTOM_PROBABILITIES).flatMap((syms) => Object.keys(syms))
        )
      );
      const history_text = chat_history
        .map((msg: { role: string; text: string }) => `${msg.role.toUpperCase()}: ${msg.text}`)
        .join("\n");

      const prompt = `Du bist ein medizinischer Triage-Assistent für eine probabilistische Engine.
Profil des Patienten: Altersgruppe: ${ageGroup || "-"}, Geschlecht: ${gender || "-"}.

Erlaubte Symptom-IDs unserer Engine: [${known_symptoms.join(", ")}]

CHAT HISTORIE:
${history_text}

DEINE AUFGABE:
Lies den Chatverlauf. Ist die Beschreibung noch sehr vage und fehlen Infos (Wo genau? Wie stark? Begleiterscheinungen)?
Falls ja: formuliere EINE spezifische Nachfrage + 2–4 kurze Button-Optionen als direkte Antworten auf die Frage.
Antworte in diesem JSON-Format:
{"action": "ask", "question": "Deine Frage?", "options": ["Ja, und zwar...", "Nein", "Manchmal"]}

Wenn die Beschwerden ausreichend klar sind ODER du schon 2 Rückfragen gestellt hast, extrahiere die Symptom-IDs.
{"action": "extract", "symptoms": ["sym_id_1", ...]}

Wenn das Problem nicht in die Symptomliste passt:
{"action": "extract", "symptoms": ["OUT_OF_DOMAIN"]}

Gib NUR JSON zurück.`;

      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash-latest",
          generationConfig: { responseMimeType: "application/json" },
        });
        const result = await model.generateContent(prompt);
        const raw = result.response.text().replace(/```json|```/g, "").trim();
        llm_resp = JSON.parse(raw);
      } catch (err) {
        console.error("LLM Error:", err);
        // Fallback auf Keyword-Extraktion wenn LLM fehlschlägt
        llm_resp = { action: "extract", symptoms: extractKeywordSymptoms(fullText) };
      }
    } else {
      // ── Pfad B: Kein API-Key → Keyword-basierter Fallback ─────────────────
      console.warn("No Gemini API key – using keyword fallback.");

      // Symptome aus dem aktuellen Text und Button-Antworten extrahieren
      const fromKeywords = extractKeywordSymptoms(text);
      const fromButton   = extractButtonSymptoms(text);
      const allNewSymptoms = Array.from(new Set([...fromKeywords, ...fromButton]));

      const allSoFar = Array.from(new Set([...confirmed_symptoms, ...allNewSymptoms]));

      if (allNewSymptoms.length > 0 || allSoFar.length > 0) {
        // Symptome erkannt → Engine berechnen und ggf. Folgefrage stellen
        const results = calculateProbabilities(allSoFar, ageGroup, gender);
        const topDiag = results[0];

        const isConfident = topDiag?.probability >= 75.0;
        const maxQ = question_count >= 3;

        if (!isConfident && !maxQ) {
          // Engine-Folgefrage stellen
          const next_q = getNextQuestion(allSoFar, rejected_symptoms, topDiag?.disease_id || "gesund");
          if (next_q) {
            return NextResponse.json({
              status: "question",
              question_text: next_q.text,
              options: ["Ja", "Nein", "Nicht sicher"],
              confirmed_symptoms: allSoFar,
              rejected_symptoms,
              question_count: question_count + 1,
              asked_symptom: next_q.symptom_id,
            });
          }
        }

        // Sicher genug oder max. Fragen → Ergebnis
        const rec = getRecommendation(topDiag?.disease_id || "gesund");
        return NextResponse.json({
          status: "final",
          confirmed_symptoms: allSoFar,
          diagnoses: results,
          recommendation: rec,
        });
      } else {
        // Nichts erkannt → gezielte Rückfrage
        const fallbackQ = buildFallbackQuestion(confirmed_symptoms, question_count);
        return NextResponse.json({
          status: "question",
          question_text: fallbackQ.question,
          options: fallbackQ.options,
          confirmed_symptoms,
          rejected_symptoms,
          question_count: question_count + 1,
          asked_symptom: null,
        });
      }
    }

    // ── 3. LLM möchte nachfragen ──────────────────────────────────────────────
    if (llm_resp.action === "ask") {
      return NextResponse.json({
        status: "question",
        question_text: llm_resp.question || "Könntest du das genauer beschreiben?",
        options: llm_resp.options || ["Ja", "Nein", "Nicht sicher"],
        confirmed_symptoms,
        rejected_symptoms,
        question_count: question_count + 1,
        asked_symptom: null,
      });
    }

    // ── 4. Out-of-Domain ──────────────────────────────────────────────────────
    const symptoms_from_text = llm_resp.symptoms || [];
    if (symptoms_from_text.includes("OUT_OF_DOMAIN")) {
      return NextResponse.json({
        status: "error",
        message:
          "Für dieses gesundheitliche Problem besitze ich leider kein ausreichendes Wissen. Bitte wende dich an einen Arzt oder die 116 117 (ärztlicher Bereitschaftsdienst).",
      });
    }

    // ── 5. Wahrscheinlichkeitsberechnung ──────────────────────────────────────
    const combined_confirmed = Array.from(
      new Set([...confirmed_symptoms, ...symptoms_from_text])
    );
    const results = calculateProbabilities(combined_confirmed, ageGroup, gender);
    const top_diagnosis = results.length > 0 ? results[0] : null;

    if (!top_diagnosis) {
      return NextResponse.json({
        status: "question",
        question_text: "Bitte beschreibe deine Beschwerden etwas genauer.",
        confirmed_symptoms: combined_confirmed,
        rejected_symptoms,
        question_count,
        asked_symptom: null,
      });
    }

    const is_confident = top_diagnosis.probability >= 75.0;
    const max_questions_reached = question_count >= 3;

    // Keine Symptome erkannt → Engine-basierte Folgefrage
    if (combined_confirmed.length === 0 && !max_questions_reached) {
      const fallbackQ = buildFallbackQuestion([], question_count);
      return NextResponse.json({
        status: "question",
        question_text: fallbackQ.question,
        options: fallbackQ.options,
        confirmed_symptoms: [],
        rejected_symptoms,
        question_count: question_count + 1,
        asked_symptom: null,
      });
    }

    // Nicht sicher genug + Fragen übrig → Engine-Folgefrage
    if (!is_confident && !max_questions_reached) {
      const next_q = getNextQuestion(
        combined_confirmed,
        rejected_symptoms,
        top_diagnosis.disease_id
      );
      if (next_q) {
        return NextResponse.json({
          status: "question",
          question_text: next_q.text,
          options: ["Ja", "Nein", "Nicht sicher"],
          confirmed_symptoms: combined_confirmed,
          rejected_symptoms,
          question_count: question_count + 1,
          asked_symptom: next_q.symptom_id,
        });
      }
    }

    // ── 6. Ergebnis ───────────────────────────────────────────────────────────
    const rec = getRecommendation(top_diagnosis.disease_id);
    return NextResponse.json({
      status: "final",
      confirmed_symptoms: combined_confirmed,
      diagnoses: results,
      recommendation: rec,
    });
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
