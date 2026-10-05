import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Basket TV · Agenda basket en France",
  description: "Calendriers Betclic Élite, Élite 2, EuroLeague, NBA et WNBA en heure de Paris.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {capable:true,title:"Basket TV",statusBarStyle:"default"},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};
export const viewport: Viewport = {themeColor:"#0c1220",width:"device-width",initialScale:1};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
