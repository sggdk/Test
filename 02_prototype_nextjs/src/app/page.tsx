"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  WarningOctagon,
  CheckCircle,
  ArrowRight,
  PaperPlaneRight,
  FirstAid,
  PhoneCall,
  WarningCircle,
  Drop,
  Thermometer,
  Bandaids,
  Coffee,
  Heartbeat,
  MapPin,
  Calendar,
  ArrowLeft,
  Stethoscope,
  X,
  Download,
  Info,
  Pulse,
  SmileyXEyes,
  House,
} from "@phosphor-icons/react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewState =
  | "disclaimer"
  | "demographics"
  | "home"
  | "chat"
  | "red_flag"
  | "recommendation";

interface Message {
  role: "user" | "bot";
  text: string;
}

interface Diagnosis {
  disease_id: string;
  disease_name: string;
  probability: number;
}

interface Recommendation {
  severity: "success" | "warning" | "danger";
  urgency: string;
  recommended_provider: string;
  icon: string;
  title: string;
  description: string;
  actions: string[];
  selfcare_tips: string[];
}

interface RedFlagData {
  id: string;
  label: string;
  message: string;
  call112: boolean;
}

// ─── Icon-Render Helper ────────────────────────────────────────────────────────
function RenderIcon({
  icon,
  className,
  size = 48,
}: {
  icon: string;
  className: string;
  size?: number;
}) {
  const props = { size, className, weight: "fill" as const };
  switch (icon) {
    case "drop": return <Drop {...props} />;
    case "thermometer": return <Thermometer {...props} />;
    case "bandaids": return <Bandaids {...props} />;
    case "coffee": return <Coffee {...props} />;
    case "warning-circle": return <WarningCircle {...props} />;
    case "warning-octagon": return <WarningOctagon {...props} />;
    case "check-circle": return <CheckCircle {...props} />;
    case "activity": return <Pulse {...props} />;
    case "smiley-x-eyes": return <SmileyXEyes {...props} />;
    default: return <Info {...props} />;
  }
}

// ─── Severity helper ───────────────────────────────────────────────────────────
const severityColors = {
  success: {
    border: "severity-success",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    label: "Keine Dringlichkeit",
  },
  warning: {
    border: "severity-warning",
    bg: "bg-amber-50",
    text: "text-amber-500",
    badge: "bg-amber-100 text-amber-700",
    label: "Arzt aufsuchen",
  },
  danger: {
    border: "severity-danger",
    bg: "bg-red-50",
    text: "text-red-500",
    badge: "bg-red-100 text-red-700",
    label: "Dringend / Notfall",
  },
} as const;

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const [currentView, setCurrentView] = useState<ViewState>("disclaimer");
  const [ageGroup, setAgeGroup] = useState<string>("adult");
  const [gender, setGender] = useState<string>("female");
  const [isPregnant, setIsPregnant] = useState(false);
  const [textInput, setTextInput] = useState("");

  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [confirmedSymptoms, setConfirmedSymptoms] = useState<string[]>([]);
  const [rejectedSymptoms, setRejectedSymptoms] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [askedSymptom, setAskedSymptom] = useState<string | null>(null);

  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [redFlagData, setRedFlagData] = useState<RedFlagData | null>(null);
  const [sessionId] = useState<string>(
    () => `mg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  const [fhirExporting, setFhirExporting] = useState(false);
  const [showSelfcare, setShowSelfcare] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, options, isLoading]);

  const resetState = useCallback(() => {
    setChatHistory([]);
    setOptions([]);
    setConfirmedSymptoms([]);
    setRejectedSymptoms([]);
    setQuestionCount(0);
    setAskedSymptom(null);
    setDiagnoses([]);
    setRecommendation(null);
    setRedFlagData(null);
    setTextInput("");
    setShowSelfcare(false);
  }, []);

  // ── API Call ──────────────────────────────────────────────────────────────
  const sendApiRequest = useCallback(
    async (
      text: string,
      currentHistory: Message[],
      currentConfirmed: string[],
      currentRejected: string[],
      currentQCount: number,
      currentAsked: string | null
    ) => {
      const newHistory: Message[] = [
        ...currentHistory,
        { role: "user", text },
      ];
      setChatHistory(newHistory);
      setOptions([]);
      setIsLoading(true);

      try {
        const res = await fetch("/api/diagnose_step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ageGroup,
            gender,
            text,
            chat_history: newHistory,
            confirmed_symptoms: currentConfirmed,
            rejected_symptoms: currentRejected,
            question_count: currentQCount,
            asked_symptom: currentAsked,
          }),
        });

        const data = await res.json();
        setIsLoading(false);

        if (data.status === "red_flag") {
          setRedFlagData(data.red_flag);
          setCurrentView("red_flag");
          return;
        }

        if (data.status === "question") {
          setConfirmedSymptoms(data.confirmed_symptoms || currentConfirmed);
          setRejectedSymptoms(data.rejected_symptoms || currentRejected);
          setQuestionCount(data.question_count);
          setAskedSymptom(data.asked_symptom);
          setChatHistory([
            ...newHistory,
            { role: "bot", text: data.question_text },
          ]);
          setOptions(data.options || ["Ja", "Nein", "Nicht sicher"]);
        } else if (data.status === "final") {
          setConfirmedSymptoms(data.confirmed_symptoms || currentConfirmed);
          setDiagnoses(data.diagnoses);
          setRecommendation(data.recommendation);
          setChatHistory([
            ...newHistory,
            {
              role: "bot",
              text: "Danke für deine Angaben. Die Ersteinschätzung ist abgeschlossen.",
            },
          ]);
          setTimeout(() => setCurrentView("recommendation"), 1200);
        } else if (data.status === "error") {
          setChatHistory([
            ...newHistory,
            { role: "bot", text: data.message },
          ]);
        }
      } catch {
        setIsLoading(false);
        setChatHistory([
          ...newHistory,
          {
            role: "bot",
            text: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
          },
        ]);
      }
    },
    [ageGroup, gender]
  );

  const handleStartAnalysis = (initialText: string) => {
    if (!initialText.trim()) return;
    resetState();
    setCurrentView("chat");
    const initConfirmed: string[] = [];
    const initRejected: string[] = [];
    sendApiRequest(initialText, [], initConfirmed, initRejected, 0, null);
  };

  const handleOptionClick = (optText: string) => {
    // "Nein" → symptom abgelehnt
    const newRejected =
      optText.toLowerCase().startsWith("nein") && askedSymptom
        ? [...rejectedSymptoms, askedSymptom]
        : rejectedSymptoms;
    const newConfirmed =
      optText.toLowerCase().startsWith("ja") && askedSymptom
        ? [...confirmedSymptoms, askedSymptom]
        : confirmedSymptoms;

    if (optText.toLowerCase().startsWith("nein") && askedSymptom) {
      setRejectedSymptoms(newRejected);
    }
    if (optText.toLowerCase().startsWith("ja") && askedSymptom) {
      setConfirmedSymptoms(newConfirmed);
    }

    sendApiRequest(
      optText,
      chatHistory,
      newConfirmed,
      newRejected,
      questionCount,
      askedSymptom
    );
  };

  const handleFhirExport = async () => {
    if (!recommendation) return;
    setFhirExporting(true);
    try {
      const res = await fetch("/api/fhir-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          ageGroup,
          gender,
          confirmedSymptoms,
          topDiagnoseId: diagnoses[0]?.disease_id || "unbekannt",
          recommendationTitle: recommendation.title,
          urgency: recommendation.urgency,
          severity: recommendation.severity,
        }),
      });
      const bundle = await res.json();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/fhir+json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mediguide-fhir-${sessionId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("FHIR Export failed", e);
    }
    setFhirExporting(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8">
      {/* App Shell */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col relative overflow-hidden border border-slate-100/80"
        style={{ minHeight: "90vh", maxHeight: "900px" }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-indigo-600">
            <img src="/logo.svg" alt="MediGuide Logo" className="w-8 h-8 object-contain" />
            <span>MediGuide</span>
          </div>
          {currentView !== "disclaimer" && currentView !== "demographics" && (
            <button
              onClick={() => {
                resetState();
                setCurrentView("home");
              }}
              className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors font-medium"
            >
              <House size={14} weight="fill" />
              Start
            </button>
          )}
        </header>

        {/* ── Content ──────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto relative">

          {/* ═══════════════════════════════════════════════════════════
              DISCLAIMER
          ═══════════════════════════════════════════════════════════ */}
          {currentView === "disclaimer" && (
            <div className="min-h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <WarningOctagon size={36} className="text-red-500" weight="duotone" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-3">
                Wichtiger Hinweis
              </h1>
              <p className="text-slate-500 mb-5 leading-relaxed text-sm max-w-xs">
                Diese Anwendung ist ein <strong className="text-slate-700">digitaler Prototyp</strong> zur
                Orientierung und Ersteinschätzung von Symptomen. Sie ersetzt{" "}
                <strong className="text-slate-700">keinen Arztbesuch</strong> und stellt{" "}
                <strong className="text-slate-700">keine medizinische Diagnose</strong>.
              </p>
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-sm max-w-xs">
                <strong>⚠️ Bei lebensbedrohlichen Notfällen:</strong>
                <br />
                Sofort <strong>112</strong> anrufen!
              </div>
              <p className="text-xs text-slate-400 mb-8 max-w-xs">
                Eingegebene Daten werden nur temporär für die Berechnung verarbeitet
                und nicht dauerhaft gespeichert (DSGVO-konform).
              </p>
              <button
                id="btn-accept-disclaimer"
                onClick={() => setCurrentView("demographics")}
                className="w-full max-w-xs py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
              >
                <CheckCircle size={20} weight="bold" />
                Verstanden &amp; Fortfahren
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              DEMOGRAPHICS
          ═══════════════════════════════════════════════════════════ */}
          {currentView === "demographics" && (
            <div className="p-6 animate-fade-slide-up">
              <div className="mb-7 text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-1">
                  Dein Profil
                </h1>
                <p className="text-sm text-slate-400">
                  Diese Angaben helfen, die Einschätzung auf dich anzupassen.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 mb-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Altersgruppe
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { val: "child", label: "Kind", sub: "0–13 Jahre" },
                    { val: "adult", label: "Jugendliche/r · Erwachsene/r", sub: "14–65 Jahre" },
                    { val: "senior", label: "Ältere Person", sub: "65+ Jahre" },
                  ].map(({ val, label, sub }) => (
                    <button
                      key={val}
                      id={`age-${val}`}
                      onClick={() => setAgeGroup(val)}
                      className={`p-3 border-2 rounded-xl text-left transition-all ${ageGroup === val
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300"
                        }`}
                    >
                      <div className="font-semibold text-sm">{label}</div>
                      <div className={`text-xs ${ageGroup === val ? "text-indigo-200" : "text-slate-400"}`}>
                        {sub}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 mb-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Biologisches Geschlecht
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "female", label: "Weiblich" },
                    { val: "male", label: "Männlich" },
                    { val: "other", label: "Divers" },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      id={`gender-${val}`}
                      onClick={() => {
                        setGender(val);
                        if (val !== "female") setIsPregnant(false);
                      }}
                      className={`p-3 border-2 rounded-xl text-center text-sm font-medium transition-all ${gender === val
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {gender === "female" && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl animate-fade-in">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        id="cb-pregnant"
                        checked={isPregnant}
                        onChange={(e) => setIsPregnant(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600"
                      />
                      <span className="text-sm text-purple-800 font-medium">
                        Ich bin schwanger oder stille
                      </span>
                    </label>
                    {isPregnant && (
                      <p className="mt-2 text-xs text-purple-600">
                        Hinweis: Bei jeglichem Unwohlsein in der Schwangerschaft
                        empfehlen wir die direkte Rücksprache mit einer Hebamme oder
                        Ihrem Frauenarzt/Ihrer Frauenärztin.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                id="btn-demographics-next"
                onClick={() => setCurrentView("home")}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
              >
                <ArrowRight size={20} weight="bold" />
                Weiter
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              HOME
          ═══════════════════════════════════════════════════════════ */}
          {currentView === "home" && (
            <div className="p-6 animate-fade-slide-up">
              {/* Profile Pill */}
              <div className="flex justify-between items-center mb-7">
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Hallo 👋
                  </h1>
                  <p className="text-sm text-slate-400">
                    {ageGroup === "child"
                      ? "Kind"
                      : ageGroup === "adult"
                        ? "Erwachsen"
                        : "Senior"}{" "}
                    ·{" "}
                    {gender === "female"
                      ? "Weiblich"
                      : gender === "male"
                        ? "Männlich"
                        : "Divers"}
                    {isPregnant ? " · Schwanger / Stillend" : ""}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentView("demographics")}
                  className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-colors"
                >
                  Ändern
                </button>
              </div>

              {/* Hauptoptionen */}
              <div className="space-y-3 mb-6">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Was kann ich für dich tun?
                </h2>

                {/* Symptom-Einschätzung */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/25">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <Stethoscope size={22} weight="fill" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-0.5">Symptom-Einschätzung</h3>
                      <p className="text-xs text-indigo-200">
                        Beschreibe deine Beschwerden und erhalte eine Handlungsempfehlung.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="input-symptoms"
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleStartAnalysis(textInput)
                      }
                      placeholder="z.B. Kopfschmerzen seit gestern…"
                      className="flex-1 px-4 py-2.5 bg-white/15 border border-white/30 rounded-xl text-white placeholder-indigo-300 text-sm outline-none focus:bg-white/25 transition-colors"
                    />
                    <button
                      id="btn-start-triage"
                      onClick={() => handleStartAnalysis(textInput)}
                      className="bg-white text-indigo-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-indigo-50 transition-colors active:scale-95 shrink-0"
                    >
                      <PaperPlaneRight size={18} weight="fill" />
                    </button>
                  </div>

                  {/* Schnell-Auswahl */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[
                      "Kopfschmerzen",
                      "Bauchschmerzen",
                      "Halsschmerzen",
                      "Rückenschmerzen",
                      "Erkältung",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStartAnalysis(s)}
                        className="text-xs bg-white/15 hover:bg-white/25 text-white px-3 py-1 rounded-full transition-colors border border-white/20"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Versorgungs-Navigator */}
                <Link
                  href="/navigator"
                  id="link-navigator"
                  className="flex items-center gap-4 bg-teal-50 border border-teal-200 rounded-2xl p-4 hover:bg-teal-100 transition-colors group block"
                >
                  <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin size={22} weight="fill" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      Versorgungs-Navigator
                    </p>
                    <p className="text-xs text-slate-500">
                      Arzt finden · Termin buchen · Telemedizin
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-teal-500 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Termin / Rezept */}
                <Link
                  href="/navigator?tab=rezept"
                  id="link-rezept"
                  className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:bg-slate-100 transition-colors group block"
                >
                  <div className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                    <Calendar size={22} weight="fill" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">
                      Termin buchen / Rezept verlängern
                    </p>
                    <p className="text-xs text-slate-500">
                      Online-Buchung bei Ihrem Arzt
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Notfall-Hinweis */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                <PhoneCall size={20} className="text-red-500 shrink-0" weight="fill" />
                <p className="text-xs text-red-700">
                  <strong>Notfall?</strong> Sofort <strong>112</strong> anrufen
                  oder den SOS-Button nutzen.
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              CHAT
          ═══════════════════════════════════════════════════════════ */}
          {currentView === "chat" && (
            <div className="flex flex-col h-full bg-white animate-fade-in">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {msg.role === "bot" && (
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center mr-2 shrink-0 mt-1 border border-indigo-100">
                        <img src="/logo.svg" alt="Bot" className="w-5 h-5 object-contain" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed animate-bubble-in shadow-sm ${msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-slate-100 text-slate-800 rounded-bl-none"
                        }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center mr-2 shrink-0 border border-indigo-100">
                      <img src="/logo.svg" alt="Bot" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center">
                      <div className="w-2 h-2 bg-slate-400 rounded-full dot-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full dot-bounce" />
                      <div className="w-2 h-2 bg-slate-400 rounded-full dot-bounce" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Option Buttons */}
              {options.length > 0 && !isLoading && (
                <div className="p-4 border-t border-slate-100 bg-white/90 backdrop-blur-sm sticky bottom-0">
                  <div className="flex flex-col gap-2">
                    {options.map((opt, i) => (
                      <button
                        key={i}
                        id={`option-btn-${i}`}
                        onClick={() => handleOptionClick(opt)}
                        className="w-full text-left px-4 py-3 bg-white border-2 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 rounded-xl text-sm font-medium text-slate-700 transition-all active:scale-98 shadow-sm"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              RED FLAG
          ═══════════════════════════════════════════════════════════ */}
          {currentView === "red_flag" && redFlagData && (
            <div className="min-h-full flex flex-col items-center justify-center p-7 text-center animate-fade-slide-up">
              <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mb-6 animate-sos-pulse">
                <WarningOctagon size={48} className="text-red-500" weight="duotone" />
              </div>
              <div className="inline-block bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
                🚨 Notfall-Warnung
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-3">
                {redFlagData.label}
              </h1>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 text-left">
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {redFlagData.message.replace(/\*\*/g, "")}
                </p>
              </div>

              {redFlagData.call112 && (
                <a
                  href="tel:112"
                  id="btn-call-112"
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 mb-3 shadow-xl shadow-red-500/40 animate-sos-pulse transition-all"
                >
                  <PhoneCall size={26} weight="fill" />
                  Jetzt 112 anrufen
                </a>
              )}

              <button
                id="btn-red-flag-back"
                onClick={() => {
                  resetState();
                  setCurrentView("home");
                }}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-2xl font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Zurück zur Übersicht
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              RECOMMENDATION
          ═══════════════════════════════════════════════════════════ */}
          {currentView === "recommendation" && recommendation && (
            <div className="p-5 bg-slate-50 animate-fade-slide-up overflow-y-auto">
              {/* Report Header */}
              <div className="text-center mb-5 pt-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  MediGuide Report
                </p>
                <h1 className="text-2xl font-bold text-slate-800">
                  Deine Ersteinschätzung
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Session: <code className="font-mono">{sessionId.slice(-8)}</code>
                </p>
              </div>

              {/* Main Card */}
              <div
                className={`bg-white rounded-2xl p-6 shadow-sm mb-4 ${severityColors[recommendation.severity].border
                  }`}
              >
                <div className="flex flex-col items-center text-center mb-4">
                  <RenderIcon
                    icon={recommendation.icon}
                    className={`${severityColors[recommendation.severity].text} mb-3`}
                    size={44}
                  />
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full mb-2 ${severityColors[recommendation.severity].badge
                      }`}
                  >
                    {severityColors[recommendation.severity].label}
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 mb-1">
                    {recommendation.title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {recommendation.description}
                  </p>
                </div>

                {/* Handlungsempfehlungen */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Handlungsempfehlungen
                  </h3>
                  <ul className="space-y-2.5">
                    {recommendation.actions.map((act, i) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-700 items-start">
                        <CheckCircle
                          size={18}
                          className="text-indigo-500 shrink-0 mt-0.5"
                          weight="fill"
                        />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Selbsthilfe-Tips */}
                {recommendation.selfcare_tips &&
                  recommendation.selfcare_tips.length > 0 && (
                    <div className="mt-3">
                      <button
                        id="btn-toggle-selfcare"
                        onClick={() => setShowSelfcare((v) => !v)}
                        className="text-xs text-indigo-500 flex items-center gap-1 hover:text-indigo-700 transition-colors mx-auto"
                      >
                        <Info size={14} />
                        {showSelfcare
                          ? "Selbsthilfe-Tipps ausblenden"
                          : "Selbsthilfe-Tipps anzeigen"}
                      </button>
                      {showSelfcare && (
                        <div className="mt-2 bg-indigo-50 rounded-xl p-3 animate-fade-in">
                          <ul className="space-y-1.5">
                            {recommendation.selfcare_tips.map((tip, i) => (
                              <li
                                key={i}
                                className="flex gap-2 text-xs text-slate-600 items-start"
                              >
                                <span className="text-indigo-400 mt-0.5">💡</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Differenzialdiagnosen */}
              {diagnoses.length > 1 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Wahrscheinlichkeitsverteilung
                  </h3>
                  <div className="space-y-2">
                    {diagnoses.slice(0, 4).map((d) => (
                      <div key={d.disease_id}>
                        <div className="flex justify-between text-xs text-slate-600 mb-0.5">
                          <span className="font-medium">{d.disease_name}</span>
                          <span className="font-mono text-slate-400">
                            {d.probability.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                            style={{ width: `${d.probability}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA-Buttons */}
              <div className="space-y-2.5">
                {recommendation.recommended_provider !== "none" && (
                  <Link
                    href={`/navigator?type=${recommendation.recommended_provider}`}
                    id="btn-find-provider"
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-500/25 active:scale-95 block text-center"
                  >
                    <MapPin size={18} weight="fill" />
                    {recommendation.recommended_provider === "hausarzt"
                      ? "Hausarzt finden"
                      : recommendation.recommended_provider === "notaufnahme"
                        ? "Notaufnahme finden"
                        : recommendation.recommended_provider === "apotheke"
                          ? "Apotheke finden"
                          : recommendation.recommended_provider === "telemedizin"
                            ? "Telemedizin nutzen"
                            : "Versorger finden"}
                  </Link>
                )}

                {recommendation.severity === "danger" && (
                  <a
                    href="tel:112"
                    id="btn-call-112-recommendation"
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md shadow-red-500/25 transition-all active:scale-95 block text-center"
                  >
                    <PhoneCall size={18} weight="fill" />
                    Jetzt 112 anrufen
                  </a>
                )}

                <button
                  id="btn-fhir-export"
                  onClick={handleFhirExport}
                  disabled={fhirExporting}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-2xl font-medium flex items-center justify-center gap-2 transition-colors active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download size={16} weight="fill" />
                  {fhirExporting ? "Wird exportiert…" : "FHIR R4 exportieren"}
                </button>

                <button
                  id="btn-new-triage"
                  onClick={() => {
                    resetState();
                    setCurrentView("home");
                  }}
                  className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 active:scale-95"
                >
                  <X size={16} />
                  Neue Einschätzung starten
                </button>
              </div>

              <p className="text-center text-xs text-slate-300 mt-5 pb-2">
                MediGuide ersetzt keine ärztliche Diagnose
              </p>
            </div>
          )}
        </main>

        {/* ── SOS-Button (global, außer Disclaimer) ────────────────────────── */}
        {currentView !== "disclaimer" && currentView !== "red_flag" && (
          <div className="absolute bottom-6 right-5 z-50">
            <button
              id="btn-sos"
              onClick={() =>
                alert(
                  "🚨 NOTRUF 112\n\nBitte bleiben Sie ruhig und teilen Sie mit:\n• WO: Adresse / Ort\n• WAS: Was ist passiert\n• WIE VIELE: Personen betroffen\n• WELCHE: Art der Verletzungen\n\nWarten Sie auf Rückfragen der Leitstelle!\n\n(Prototyp – ruft nicht wirklich an)"
                )
              }
              className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 hover:scale-110 active:scale-95 transition-all duration-200 relative animate-sos-pulse group shadow-lg shadow-red-500/50"
            >
              <FirstAid size={26} weight="fill" />
              <span className="absolute right-16 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                Notruf 112
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
