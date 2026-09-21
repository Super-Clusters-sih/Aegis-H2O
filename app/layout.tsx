import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aegis H2O | Intelligent Water Monitoring",
  description:
    "Real-time water quality monitoring powered by IoT and machine learning.",
};

/**
 * Inline script injected before React hydration to prevent
 * theme flash. Reads localStorage and applies data-theme
 * to <html> before any CSS loads.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem("aegis-theme");
    var theme = stored;
    if (!theme || theme === "system") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <head>
          {/* Theme script must run before page renders */}
          <script
            dangerouslySetInnerHTML={{ __html: themeScript }}
          />
        </head>
        <body className="min-h-full flex flex-col" style={{ background: "var(--surface-page)", color: "var(--text-primary)" }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}