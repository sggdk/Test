"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  Phone,
  Clock,
  Star,
  ArrowLeft,
  ArrowRight,
  Heartbeat,
  House,
  Hospital,
  Pill,
  Laptop,
  Warning,
  CheckCircle,
  Calendar,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { getProviders, Provider, ProviderType } from "@/lib/providers";

// ─── Types & Helpers ──────────────────────────────────────────────────────────
const TAB_CONFIG: {
  id: ProviderType | "alle";
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: "alle",
    label: "Alle",
    icon: <MapPin size={16} weight="fill" />,
    color: "bg-slate-600",
  },
  {
    id: "hausarzt",
    label: "Hausarzt",
    icon: <House size={16} weight="fill" />,
    color: "bg-indigo-600",
  },
  {
    id: "facharzt",
    label: "Facharzt",
    icon: <Heartbeat size={16} weight="fill" />,
    color: "bg-purple-600",
  },
  {
    id: "apotheke",
    label: "Apotheke",
    icon: <Pill size={16} weight="fill" />,
    color: "bg-emerald-600",
  },
  {
    id: "notaufnahme",
    label: "Notaufnahme",
    icon: <Hospital size={16} weight="fill" />,
    color: "bg-red-600",
  },
  {
    id: "telemedizin",
    label: "Telemedizin",
    icon: <Laptop size={16} weight="fill" />,
    color: "bg-teal-600",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          weight={s <= Math.round(rating) ? "fill" : "regular"}
          className={s <= Math.round(rating) ? "text-amber-400" : "text-slate-300"}
        />
      ))}
      <span className="text-xs text-slate-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ─── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({
  provider,
  onClose,
}: {
  provider: Provider;
  onClose: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmCode] = useState(
    () =>
      "MG-" +
      Math.random().toString(36).toUpperCase().slice(2, 8)
  );

  const handleBook = () => {
    if (!date || !time) return;
    setConfirmed(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-white rounded-3xl p-6 animate-fade-slide-up shadow-2xl">
        {!confirmed ? (
          <>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Termin buchen</h2>
                <p className="text-sm text-slate-400">{provider.name}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Wunsch-Datum
                </label>
                <input
                  type="date"
                  id="booking-date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Wunsch-Uhrzeit
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTime(t)}
                      className={`py-2 text-sm rounded-xl border-2 font-medium transition-all ${
                        time === t
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-200 text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Anliegen (optional)
                </label>
                <input
                  type="text"
                  id="booking-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="z.B. Erkältung, Routinecheck…"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              id="btn-confirm-booking"
              onClick={handleBook}
              disabled={!date || !time}
              className="mt-5 w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Calendar size={18} weight="fill" />
              Termin anfragen
            </button>
            <p className="text-center text-xs text-slate-300 mt-2">
              Demo – keine echte Buchung
            </p>
          </>
        ) : (
          <div className="text-center py-4 animate-fade-slide-up">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-emerald-600" weight="fill" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Terminanfrage gesendet!
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Ihr Termin-Code:
            </p>
            <div className="bg-slate-100 rounded-xl p-3 font-mono text-lg font-bold text-indigo-600 mb-4">
              {confirmCode}
            </div>
            <p className="text-xs text-slate-400 mb-2">
              {provider.name} · {date} · {time} Uhr
            </p>
            {reason && (
              <p className="text-xs text-slate-400 mb-5">Anliegen: {reason}</p>
            )}
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 mb-4">
              ⚠️ Dies ist ein Demo-Prototyp. In einer echten App würde hier eine
              Bestätigungs-E-Mail gesendet werden.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Schließen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Provider Card ─────────────────────────────────────────────────────────────
function ProviderCard({
  provider,
  onBook,
}: {
  provider: Provider;
  onBook: (p: Provider) => void;
}) {
  const typeColors: Record<string, string> = {
    hausarzt:   "bg-indigo-100 text-indigo-700",
    facharzt:   "bg-purple-100 text-purple-700",
    apotheke:   "bg-emerald-100 text-emerald-700",
    notaufnahme:"bg-red-100 text-red-700",
    telemedizin:"bg-teal-100 text-teal-700",
  };

  const typeLabels: Record<string, string> = {
    hausarzt:   "Hausarzt",
    facharzt:   `Facharzt · ${provider.specialty || ""}`,
    apotheke:   "Apotheke",
    notaufnahme:"Notaufnahme",
    telemedizin:"Telemedizin",
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-fade-slide-up">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColors[provider.type] || "bg-slate-100 text-slate-600"}`}>
              {typeLabels[provider.type]}
            </span>
            {provider.openNow ? (
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Jetzt geöffnet
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                Geschlossen
              </span>
            )}
          </div>
          <h3 className="font-bold text-slate-800 text-sm leading-snug">
            {provider.name}
          </h3>
          <StarRating rating={provider.rating} />
        </div>
        {provider.type !== "telemedizin" && (
          <div className="text-xs text-slate-400 font-medium shrink-0">
            {provider.distance}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1.5 mb-3">
        {provider.type !== "telemedizin" && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={13} className="text-slate-400 shrink-0" />
            <span>{provider.address}, {provider.city}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={13} className="text-slate-400 shrink-0" />
          <span>{provider.openHours}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Phone size={13} className="text-slate-400 shrink-0" />
          <span>{provider.phone}</span>
        </div>
        {provider.waitTime && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
            <Clock size={13} className="text-indigo-400 shrink-0" />
            <span>Wartezeit: {provider.waitTime}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {provider.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex gap-2">
        <a
          href={`tel:${provider.phone.replace(/\s/g, "")}`}
          className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Phone size={14} weight="fill" />
          Anrufen
        </a>

        {provider.type === "telemedizin" && provider.bookingUrl ? (
          <a
            href={provider.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <ArrowRight size={14} weight="bold" />
            Zur Website
          </a>
        ) : (
          <button
            id={`btn-book-${provider.id}`}
            onClick={() => onBook(provider)}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <Calendar size={14} weight="fill" />
            Termin
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Navigator Component (inner) ─────────────────────────────────────────
function NavigatorContent() {
  const searchParams = useSearchParams();

  const initialType = (searchParams.get("type") as ProviderType) || "hausarzt";
  const initialTab = (searchParams.get("tab") as string) || initialType;

  const [activeTab, setActiveTab] = useState<ProviderType | "alle">(
    initialTab === "rezept" ? "hausarzt" : (initialTab as ProviderType | "alle")
  );
  const [plz, setPlz] = useState("80331");
  const [bookingProvider, setBookingProvider] = useState<Provider | null>(null);
  const [showRezept, setShowRezept] = useState(initialTab === "rezept");

  const providers =
    activeTab === "alle"
      ? getProviders()
      : getProviders(activeTab as ProviderType);

  useEffect(() => {
    if (initialTab === "rezept") setShowRezept(true);
  }, [initialTab]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col border border-slate-100/80"
        style={{ minHeight: "90vh", maxHeight: "900px" }}
      >
        {/* Header */}
        <header className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm z-10 shrink-0">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ArrowLeft size={18} weight="bold" />
          </Link>
          <div>
            <h1 className="font-bold text-slate-800 text-base">Versorgungs-Navigator</h1>
            <p className="text-xs text-slate-400">Finde Ärzte, Apotheken & Telemedizin</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {/* PLZ + Suche */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex gap-2 items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
              <MapPin size={16} className="text-slate-400 shrink-0" />
              <input
                id="input-plz"
                type="text"
                value={plz}
                onChange={(e) => setPlz(e.target.value)}
                placeholder="PLZ eingeben…"
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder-slate-400"
              />
              <span className="text-xs text-slate-400">Region: München (Demo)</span>
            </div>
          </div>

          {/* Rezept-Verlängerung Banner */}
          {showRezept && (
            <div className="mx-5 mt-3 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 animate-fade-in">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-indigo-800 text-sm">
                  📋 Rezept verlängern
                </h3>
                <button onClick={() => setShowRezept(false)} className="text-indigo-400">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-indigo-600 mb-3">
                Für die Verlängerung eines bestehenden Rezepts wenden Sie sich
                direkt an Ihren Hausarzt oder nutzen Sie einen Telemedizin-Dienst.
              </p>
              <div className="space-y-2">
                <a
                  href="https://www.teleclinic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl text-center hover:bg-indigo-700 transition-colors"
                >
                  Teleclinic – Online-Rezept →
                </a>
                <a
                  href="https://arztsuche.116117.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2.5 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-xl text-center hover:bg-indigo-50 transition-colors"
                >
                  116117 Arztsuche →
                </a>
              </div>
            </div>
          )}

          {/* Notfall-Hinweis bei Notaufnahme */}
          {activeTab === "notaufnahme" && (
            <div className="mx-5 mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 flex gap-3 items-start animate-fade-in">
              <Warning size={18} className="text-red-500 shrink-0 mt-0.5" weight="fill" />
              <p className="text-xs text-red-700">
                Bei lebensbedrohlichen Notfällen direkt <strong>112</strong> anrufen!
                Fahren Sie nicht selbst in die Notaufnahme bei Lebensgefahr.
              </p>
            </div>
          )}

          {/* Tab-Navigation */}
          <div className="px-5 mt-3 overflow-x-auto">
            <div className="flex gap-2 pb-1">
              {TAB_CONFIG.map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as ProviderType | "alle")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? `${tab.color} text-white shadow-md`
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider List */}
          <div className="px-5 pt-3 pb-6 space-y-3">
            <p className="text-xs text-slate-400">
              {providers.length} Einträge · Standort: {plz} (simuliert)
            </p>
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} onBook={setBookingProvider} />
            ))}
          </div>
        </main>

        {/* Booking Modal */}
        {bookingProvider && (
          <BookingModal
            provider={bookingProvider}
            onClose={() => setBookingProvider(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Page Export with Suspense ─────────────────────────────────────────────────
export default function NavigatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-sm">Lädt…</div>
      </div>
    }>
      <NavigatorContent />
    </Suspense>
  );
}
