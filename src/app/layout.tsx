import "@/styles/globals.css";

import { type Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "@/trpc/react";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Momentum — one calm home for your work",
  description:
    "Gmail, Calendar, Slack and GitHub in one priority inbox, with an AI that does the busywork. Powered by Corsair.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={jetbrainsMono.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
