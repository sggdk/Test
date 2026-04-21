import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediGuide – Digitale Ersteinschätzung & Patientennavigation",
  description:
    "MediGuide hilft Ihnen, Ihre Symptome einzuschätzen und den richtigen Versorgungsweg zu finden. Kein Ersatz für ärztliche Beratung.",
  keywords: ["Triage", "Symptom-Checker", "Ersteinschätzung", "Arztfinder", "Patientennavigation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
