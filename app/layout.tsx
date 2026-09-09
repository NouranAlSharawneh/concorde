import type { Metadata, Viewport } from "next";
import { Archivo, Inter_Tight, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  weight: "variable",
  display: "swap",
});
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], display: "swap" });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500"], display: "swap" });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["italic", "normal"], display: "swap" });

export const metadata: Metadata = {
  title: "Concorde — The only one",
  description:
    "Twenty-seven years at Mach 2. The story of Concorde: how it was built, why it was first, why it stayed the only one, and why it had to come down.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Concorde — The only one",
    description: "Twenty-seven years at Mach 2. An interactive story of the only supersonic airliner that ever truly flew.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#eef6ff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${archivo.variable} ${interTight.variable} ${jetbrains.variable} ${instrument.variable} antialiased`}
    >
      <head>
        <link rel="preload" href="/models/concorde.glb" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className="min-h-dvh grain">{children}</body>
    </html>
  );
}
