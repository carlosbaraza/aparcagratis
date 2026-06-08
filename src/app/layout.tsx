import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

/** Canonical site URL (override per-environment with NEXT_PUBLIC_SITE_URL). */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://carlosbaraza.github.io/aparcagratis";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f3ec",
};

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const TITLE = "aparcagratis · mapa de zonas SER de Madrid";
const DESCRIPTION =
  "Mapa de las zonas de estacionamiento regulado (SER) de Madrid: zona verde, azul y libre. Filtra por color, indica tu etiqueta DGT y horario, y calcula al instante si puedes aparcar y cuánto cuesta.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · aparcagratis",
  },
  description: DESCRIPTION,
  applicationName: "aparcagratis",
  authors: [{ name: "Carlos Baraza", url: "https://baraza.io" }],
  creator: "Carlos Baraza",
  keywords: [
    "SER Madrid",
    "zona azul Madrid",
    "zona verde Madrid",
    "aparcamiento Madrid",
    "estacionamiento regulado",
    "etiqueta DGT",
    "tarifa SER",
    "parquímetro Madrid",
    "aparcar gratis Madrid",
    "ZBE Madrid",
  ],
  category: "travel",
  alternates: { canonical: `${SITE_URL}/` },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: "aparcagratis",
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/`,
    locale: "es_ES",
    images: [
      {
        url: `${SITE_URL}/og.png`,
        width: 1200,
        height: 630,
        alt: "aparcagratis — mapa de zonas SER de Madrid",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og.png`],
  },
};

/** Structured data so search engines and LLMs understand the app. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "aparcagratis",
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: "TravelApplication",
  operatingSystem: "Web",
  inLanguage: "es",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  areaServed: { "@type": "City", name: "Madrid", sameAs: "https://www.wikidata.org/wiki/Q2807" },
  featureList: [
    "Mapa de las zonas SER (verde, azul, alta rotación, libre)",
    "Cálculo de tarifa según etiqueta DGT y horario",
    "Detección de calles no reguladas",
    "Vista satélite (ortofoto PNOA/IGN)",
    "Geolocalización y enlaces a Google Maps / Street View",
  ],
  author: { "@type": "Person", name: "Carlos Baraza", url: "https://baraza.io" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
