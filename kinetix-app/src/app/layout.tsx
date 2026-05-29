import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { KinetixProvider } from "./context/KinetixContext"; // Added context injection
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
  title: "Kinetix.ai | Next-Gen AI Orchestration Engine",
  description: "Deploy production-ready applications, data structures, and multi-agent systems via natural language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Wrapped children inside the global Kinetix application state */}
        <KinetixProvider>
          {children}
        </KinetixProvider>
      </body>
    </html>
  );
}