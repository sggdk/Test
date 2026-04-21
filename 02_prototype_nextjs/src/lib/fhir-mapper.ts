// ─────────────────────────────────────────────────────────────────────────────
// MediGuide – FHIR R4 Mapper
// Mappt Session-Daten auf standardisierte FHIR-Ressourcen für Interoperabilität
// ─────────────────────────────────────────────────────────────────────────────

// Mapping von MediGuide-Symptom-IDs zu SNOMED-CT Codes (Best-Effort)
const SNOMED_MAP: Record<string, { code: string; display: string }> = {
  sym_fever:               { code: "386661006", display: "Fever (finding)" },
  sym_cough:               { code: "49727002",  display: "Cough (finding)" },
  sym_headache:            { code: "25064002",  display: "Headache (finding)" },
  sym_runny_nose:          { code: "267101005", display: "Rhinorrhea (finding)" },
  sym_nausea:              { code: "422587007", display: "Nausea (finding)" },
  sym_light_sensitive:     { code: "90128006",  display: "Photophobia (finding)" },
  sym_sore_throat:         { code: "162397003", display: "Pain in throat (finding)" },
  sym_fatigue:             { code: "84229001",  display: "Fatigue (finding)" },
  sym_body_ache:           { code: "57676002",  display: "Joint pain (finding)" },
  sym_stomach_right_bottom:{ code: "57227009",  display: "Right lower quadrant pain (finding)" },
  sym_stomach_top:         { code: "299377003", display: "Upper abdominal pain (finding)" },
  sym_heartburn:           { code: "16331000",  display: "Heartburn (finding)" },
  sym_back_pain:           { code: "161891005", display: "Back pain (finding)" },
  sym_chest_pain:          { code: "29857009",  display: "Chest pain (finding)" },
  sym_shortness_breath:    { code: "230145002", display: "Difficulty breathing (finding)" },
  sym_burning_urination:   { code: "49650001",  display: "Dysuria (finding)" },
  sym_frequent_urination:  { code: "162116003", display: "Frequency of urination (finding)" },
  sym_dizziness:           { code: "404640003", display: "Dizziness (finding)" },
  sym_sweating:            { code: "415068001", display: "Sweating (finding)" },
};

// Mapping Urgency → FHIR Encounter.priority
const URGENCY_PRIORITY_MAP: Record<string, { code: string; display: string }> = {
  call_112:      { code: "EMER",    display: "Emergency" },
  emergency_room:{ code: "EMER",    display: "Emergency" },
  gp_today:      { code: "URGENT",  display: "Urgent" },
  gp_within_days:{ code: "R",       display: "Routine" },
  selfcare:      { code: "EL",      display: "Elective" },
};

export interface FhirExportInput {
  sessionId: string;
  ageGroup: string;
  gender: string;
  confirmedSymptoms: string[];
  topDiagnoseId: string;
  recommendationTitle: string;
  urgency: string;
  severity: string;
  timestamp: string;
}

export function buildFhirBundle(input: FhirExportInput): object {
  const {
    sessionId,
    ageGroup,
    gender,
    confirmedSymptoms,
    topDiagnoseId,
    recommendationTitle,
    urgency,
    severity,
    timestamp,
  } = input;

  // ── Patient-Ressource (anonymisiert) ──────────────────────────────────────
  const fhirGender =
    gender === "female" ? "female" : gender === "male" ? "male" : "unknown";
  const fhirAgeCode =
    ageGroup === "child" ? "C" : ageGroup === "senior" ? "O" : "A";

  const patient = {
    resourceType: "Patient",
    id: `anon-${sessionId}`,
    meta: { profile: ["http://hl7.org/fhir/StructureDefinition/Patient"] },
    text: {
      status: "generated",
      div: "<div>Anonymisierter Patient (MediGuide Session)</div>",
    },
    identifier: [
      {
        system: "urn:mediguide:session",
        value: sessionId,
      },
    ],
    gender: fhirGender,
    extension: [
      {
        url: "urn:mediguide:ageGroup",
        valueCode: fhirAgeCode,
      },
    ],
  };

  // ── Condition-Ressourcen (eine pro bestätigtem Symptom) ───────────────────
  const conditions = confirmedSymptoms.map((sym, idx) => {
    const snomed = SNOMED_MAP[sym];
    return {
      resourceType: "Condition",
      id: `cond-${sessionId}-${idx}`,
      clinicalStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
            display: "Active",
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: "unconfirmed",
            display: "Unconfirmed",
          },
        ],
      },
      code: snomed
        ? {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: snomed.code,
                display: snomed.display,
              },
            ],
            text: snomed.display,
          }
        : {
            text: sym,
          },
      subject: { reference: `Patient/anon-${sessionId}` },
      recordedDate: timestamp,
    };
  });

  // ── ClinicalImpression (Ersteinschätzungsergebnis) ────────────────────────
  const clinicalImpression = {
    resourceType: "ClinicalImpression",
    id: `ci-${sessionId}`,
    status: "completed",
    description: `MediGuide Ersteinschätzung: ${recommendationTitle}`,
    subject: { reference: `Patient/anon-${sessionId}` },
    date: timestamp,
    summary: `Wahrscheinlichstes Bild: ${topDiagnoseId}. Dringlichkeit: ${urgency}.`,
    finding: conditions.map((c) => ({
      itemReference: { reference: `Condition/${c.id}` },
    })),
  };

  // ── Flag (Dringlichkeitskennzeichnung) ─────────────────────────────────────
  const flagSeverity =
    severity === "danger"
      ? { code: "high", display: "High Priority" }
      : severity === "warning"
      ? { code: "medium", display: "Medium Priority" }
      : { code: "low", display: "Low Priority" };

  const flag = {
    resourceType: "Flag",
    id: `flag-${sessionId}`,
    status: "active",
    code: {
      coding: [
        {
          system: "http://hl7.org/fhir/flag-priority-codes",
          code: flagSeverity.code,
          display: flagSeverity.display,
        },
      ],
      text: `MediGuide Triage: ${flagSeverity.display}`,
    },
    subject: { reference: `Patient/anon-${sessionId}` },
    period: {
      start: timestamp,
    },
  };

  // ── Encounter (Begegnung) ─────────────────────────────────────────────────
  const priority = URGENCY_PRIORITY_MAP[urgency] || { code: "R", display: "Routine" };
  const encounter = {
    resourceType: "Encounter",
    id: `enc-${sessionId}`,
    status: "finished",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "VR",
      display: "virtual",
    },
    priority: {
      coding: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActPriority",
          code: priority.code,
          display: priority.display,
        },
      ],
    },
    subject: { reference: `Patient/anon-${sessionId}` },
    period: { start: timestamp, end: timestamp },
    reasonCode: [
      {
        text: `MediGuide Ersteinschätzung – ${recommendationTitle}`,
      },
    ],
  };

  // ── FHIR Bundle ────────────────────────────────────────────────────────────
  return {
    resourceType: "Bundle",
    id: `bundle-${sessionId}`,
    meta: {
      lastUpdated: timestamp,
      tag: [
        {
          system: "urn:mediguide",
          code: "triage-session",
          display: "MediGuide Triage Session Export",
        },
      ],
    },
    type: "collection",
    timestamp,
    entry: [
      { resource: patient },
      { resource: clinicalImpression },
      { resource: flag },
      { resource: encounter },
      ...conditions.map((c) => ({ resource: c })),
    ],
  };
}
