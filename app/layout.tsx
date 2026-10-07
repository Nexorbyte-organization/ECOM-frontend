import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";
import ToastProvider from "@/components/ui/ToastProvider";
import { ThemeProvider } from "@/lib/theme";
import { UpdateBanner } from "@/components/shared/UpdateNotice";

export const metadata: Metadata = {
  title: "OO-Ushers — Book Professional Ushers for Your Event",
  description: "Connect with verified professional ushers for events of every size. Smart matching, fast booking, and reliable attendance tracking.",
  keywords: ["event ushers", "professional ushers", "book ushers", "event staffing", "usher booking", "event staff", "OO-Ushers"],
  authors: [{ name: "OO-Ushers Team" }],
  openGraph: {
    title: "OO-Ushers — Book Professional Ushers for Your Event",
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
    <html>
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
