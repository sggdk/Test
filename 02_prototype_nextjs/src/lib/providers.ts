// ─────────────────────────────────────────────────────────────────────────────
// MediGuide – Simulierte Versorger-Datenbank (für Demo-Zwecke)
// In einer realen App: KBV-API / Google Places / Doctolib etc.
// ─────────────────────────────────────────────────────────────────────────────

export type ProviderType = "hausarzt" | "facharzt" | "apotheke" | "notaufnahme" | "telemedizin";

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  specialty?: string;
  address: string;
  city: string;
  plz: string;
  phone: string;
  openNow: boolean;
  openHours: string;
  waitTime?: string; // Geschätzte Wartezeit
  rating: number;   // 1-5
  distance: string; // geschätzt
  url?: string;
  bookingUrl?: string;
  tags: string[];
}

const PROVIDERS: Provider[] = [
  // ── Hausärzte ────────────────────────────────────────────────────────────
  {
    id: "ha-01",
    name: "Dr. med. Anna Becker",
    type: "hausarzt",
    address: "Hauptstraße 12",
    city: "München",
    plz: "80331",
    phone: "+49 89 123456",
    openNow: true,
    openHours: "Mo–Fr 08:00–18:00",
    waitTime: "ca. 20 Min.",
    rating: 4.8,
    distance: "0,4 km",
    tags: ["Hausarzt", "Online-Terminbuchung", "Spricht Englisch"],
  },
  {
    id: "ha-02",
    name: "Dr. med. Klaus Meier",
    type: "hausarzt",
    address: "Schillerstraße 7",
    city: "München",
    plz: "80336",
    phone: "+49 89 654321",
    openNow: false,
    openHours: "Mo–Fr 08:00–12:00 und 14:00–17:00",
    waitTime: "Termin nötig",
    rating: 4.5,
    distance: "0,9 km",
    tags: ["Hausarzt", "Geriatrie"],
  },
  {
    id: "ha-03",
    name: "Gemeinschaftspraxis Gesundheitszentrum Nord",
    type: "hausarzt",
    address: "Am Nordpark 3",
    city: "München",
    plz: "80809",
    phone: "+49 89 998877",
    openNow: true,
    openHours: "Mo–Sa 07:30–20:00",
    waitTime: "ca. 45 Min.",
    rating: 4.2,
    distance: "2,1 km",
    tags: ["Hausarzt", "Erweiterte Öffnungszeiten", "Samstags geöffnet"],
  },

  // ── Fachärzte ─────────────────────────────────────────────────────────────
  {
    id: "fa-01",
    name: "Dr. med. Sarah Wolf – Neurologin",
    type: "facharzt",
    specialty: "Neurologie",
    address: "Maximilianstraße 45",
    city: "München",
    plz: "80538",
    phone: "+49 89 111222",
    openNow: true,
    openHours: "Mo–Do 08:00–17:00",
    waitTime: "Termin nötig (ca. 3 Wochen)",
    rating: 4.9,
    distance: "1,3 km",
    tags: ["Neurologie", "Migräne-Spezialisten", "Kopfschmerzsprechstunde"],
  },
  {
    id: "fa-02",
    name: "Gastroenterologie am Isartor",
    type: "facharzt",
    specialty: "Gastroenterologie",
    address: "Isartorplatz 8",
    city: "München",
    plz: "80331",
    phone: "+49 89 333444",
    openNow: true,
    openHours: "Mo–Fr 08:00–18:00",
    waitTime: "Termin nötig (ca. 1 Woche)",
    rating: 4.6,
    distance: "0,7 km",
    tags: ["Gastroenterologie", "Darmspiegelung", "Sodbrennen"],
  },
  {
    id: "fa-03",
    name: "Orthopädie Schwabing",
    type: "facharzt",
    specialty: "Orthopädie",
    address: "Leopoldstraße 120",
    city: "München",
    plz: "80804",
    phone: "+49 89 555666",
    openNow: false,
    openHours: "Mo–Mi, Fr 08:00–17:00",
    waitTime: "Termin nötig",
    rating: 4.4,
    distance: "3,2 km",
    tags: ["Orthopädie", "Rückenschmerz", "Physiotherapie"],
  },

  // ── Apotheken ─────────────────────────────────────────────────────────────
  {
    id: "ap-01",
    name: "Apotheke am Marienplatz",
    type: "apotheke",
    address: "Kaufingerstraße 1",
    city: "München",
    plz: "80331",
    phone: "+49 89 101010",
    openNow: true,
    openHours: "Mo–Sa 08:00–20:00",
    rating: 4.7,
    distance: "0,2 km",
    tags: ["24h-Notdienst", "Blutdruckmessung", "Impfberatung"],
  },
  {
    id: "ap-02",
    name: "Löwen-Apotheke Schwabing",
    type: "apotheke",
    address: "Münchner Freiheit 9",
    city: "München",
    plz: "80804",
    phone: "+49 89 202020",
    openNow: true,
    openHours: "Mo–Fr 08:00–19:00, Sa 09:00–14:00",
    rating: 4.5,
    distance: "2,8 km",
    tags: ["Naturheilkunde", "Homöopathie", "Babyartikel"],
  },

  // ── Notaufnahmen ──────────────────────────────────────────────────────────
  {
    id: "na-01",
    name: "Klinikum der Universität München – Notaufnahme",
    type: "notaufnahme",
    address: "Marchioninistraße 15",
    city: "München",
    plz: "81377",
    phone: "+49 89 4400-0",
    openNow: true,
    openHours: "24/7 geöffnet",
    waitTime: "Je nach Schweregrad",
    rating: 4.3,
    distance: "8,5 km",
    url: "https://www.lmu-klinikum.de",
    tags: ["Großklinikum", "Trauma-Zentrum", "Stroke Unit"],
  },
  {
    id: "na-02",
    name: "Technische Universität München – Klinikum Rechts der Isar",
    type: "notaufnahme",
    address: "Ismaninger Straße 22",
    city: "München",
    plz: "81675",
    phone: "+49 89 4140-0",
    openNow: true,
    openHours: "24/7 geöffnet",
    waitTime: "Je nach Schweregrad",
    rating: 4.5,
    distance: "5,1 km",
    url: "https://www.mri.tum.de",
    tags: ["Universitätsklinikum", "Kardiologie", "Neurologie"],
  },

  // ── Telemedizin ────────────────────────────────────────────────────────────
  {
    id: "tm-01",
    name: "TK-Doc (Techniker Krankenkasse)",
    type: "telemedizin",
    address: "Online",
    city: "Deutschland",
    plz: "00000",
    phone: "Über App erreichbar",
    openNow: true,
    openHours: "24/7 (je nach Arzt-Verfügbarkeit)",
    waitTime: "ca. 5–15 Min.",
    rating: 4.6,
    distance: "Online",
    url: "https://www.tk.de/techniker/service-und-beratung/telemedizin",
    bookingUrl: "https://www.tk.de/techniker/service-und-beratung/telemedizin",
    tags: ["TK-Versicherte", "Videosprechstunde", "Krankschreibung möglich"],
  },
  {
    id: "tm-02",
    name: "Teleclinic",
    type: "telemedizin",
    address: "Online",
    city: "Deutschland",
    plz: "00000",
    phone: "Über App erreichbar",
    openNow: true,
    openHours: "24/7",
    waitTime: "ca. 10 Min.",
    rating: 4.4,
    distance: "Online",
    url: "https://www.teleclinic.com",
    bookingUrl: "https://www.teleclinic.com",
    tags: ["Alle Kassen", "Videosprechstunde", "Rezepte", "AU"],
  },
  {
    id: "tm-03",
    name: "KBV-Arztsuche (Kassenärztliche Bundesvereinigung)",
    type: "telemedizin",
    address: "Online",
    city: "Deutschland",
    plz: "00000",
    phone: "Ärztlicher Bereitschaftsdienst: 116 117",
    openNow: true,
    openHours: "24/7",
    waitTime: "-",
    rating: 4.7,
    distance: "Online",
    url: "https://arztsuche.116117.de",
    bookingUrl: "https://arztsuche.116117.de",
    tags: ["Behörde", "Arztsuche", "Bereitschaftsdienst", "116 117"],
  },
];

export function getProviders(type?: ProviderType): Provider[] {
  if (!type) return PROVIDERS;
  return PROVIDERS.filter((p) => p.type === type);
}

export function getProviderById(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
