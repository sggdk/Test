import { NextResponse } from "next/server";
import { buildFhirBundle } from "@/lib/fhir-mapper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sessionId,
      ageGroup,
      gender,
      confirmedSymptoms,
      topDiagnoseId,
      recommendationTitle,
      urgency,
      severity,
    } = body;

    const timestamp = new Date().toISOString();

    const bundle = buildFhirBundle({
      sessionId: sessionId || `session-${Date.now()}`,
      ageGroup: ageGroup || "adult",
      gender: gender || "unknown",
      confirmedSymptoms: confirmedSymptoms || [],
      topDiagnoseId: topDiagnoseId || "unbekannt",
      recommendationTitle: recommendationTitle || "Ersteinschätzung",
      urgency: urgency || "selfcare",
      severity: severity || "success",
      timestamp,
    });

    return NextResponse.json(bundle, {
      headers: {
        "Content-Type": "application/fhir+json",
      },
    });
  } catch (error) {
    console.error("FHIR Export Error:", error);
    return NextResponse.json({ error: "FHIR export failed" }, { status: 500 });
  }
}
