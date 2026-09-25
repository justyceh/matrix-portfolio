import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { BinaryCursor } from "./_components/cursor/binary-cursor";
import { ClickBurst } from "./_components/cursor/click-burst";
import { site } from "./_lib/site";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${site.name} — ${site.role}`,
  description: site.tagline,
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} antialiased`}>
      <body className="min-h-svh">
        {children}
        <ClickBurst />
        <BinaryCursor />
      </body>
    </html>
  );
}
