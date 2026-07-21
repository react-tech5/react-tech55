import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "react.tech — Real Social Engagement Platform",
  description: "Connecting clients with real commenters for authentic engagement on TikTok, Instagram and Twitter/X",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0B1F26",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
