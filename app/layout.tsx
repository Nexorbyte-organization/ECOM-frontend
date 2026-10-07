import type { Metadata } from "next";
import { Outfit, Figtree, Readex_Pro } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";
import ToastProvider from "@/components/ui/ToastProvider";
import { ThemeProvider } from "@/lib/theme";
import { UpdateBanner } from "@/components/shared/UpdateNotice";

// Display: Outfit (geometric, friendly). Text: Figtree. Readex Pro is designed for Arabic and Latin
// together, so it sits behind both stacks and the browser picks it per glyph; RTL needs no font rule.
const display = Outfit({ subsets: ["latin", "latin-ext"], variable: "--font-display-latin", display: "swap" });
const text = Figtree({ subsets: ["latin", "latin-ext"], variable: "--font-text-latin", display: "swap" });
const arabic = Readex_Pro({ subsets: ["arabic"], variable: "--font-arabic", display: "swap" });

export const metadata: Metadata = {
  title: "OO-Ushers | The right people, at the door, on time",
  description: "Connect with verified professional ushers for events of every size. Smart matching, fast booking, and reliable attendance tracking.",
  keywords: ["event ushers", "professional ushers", "book ushers", "event staffing", "usher booking", "event staff", "OO-Ushers"],
  authors: [{ name: "OO-Ushers Team" }],
  openGraph: {
    title: "OO-Ushers | The right people, at the door, on time",
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
    <html className={`${display.variable} ${text.variable} ${arabic.variable}`} suppressHydrationWarning>
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
