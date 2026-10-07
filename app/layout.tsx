import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";
import ToastProvider from "@/components/ui/ToastProvider";
import { ThemeProvider } from "@/lib/theme";
import { UpdateBanner } from "@/components/shared/UpdateNotice";

// Display: narrow, heavy signage grotesque. Text: Plex. Each has an Arabic counterpart in the same
// stack, so the browser picks the right face per glyph and RTL needs no separate font rule.
const display = Archivo({ subsets: ["latin", "latin-ext"], axes: ["wdth"], variable: "--font-display-latin", display: "swap" });
const displayArabic = Noto_Kufi_Arabic({ subsets: ["arabic"], variable: "--font-display-arabic", display: "swap" });
const text = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"], variable: "--font-text-latin", display: "swap" });
const textArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-text-arabic", display: "swap" });

export const metadata: Metadata = {
  title: "OO-Ushers — The right people, at the door, on time",
  description: "Connect with verified professional ushers for events of every size. Smart matching, fast booking, and reliable attendance tracking.",
  keywords: ["event ushers", "professional ushers", "book ushers", "event staffing", "usher booking", "event staff", "OO-Ushers"],
  authors: [{ name: "OO-Ushers Team" }],
  openGraph: {
    title: "OO-Ushers — The right people, at the door, on time",
    description: "Book professional ushers for your event in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${display.variable} ${displayArabic.variable} ${text.variable} ${textArabic.variable}`} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
            <UpdateBanner />
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
