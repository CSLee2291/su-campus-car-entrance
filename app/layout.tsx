import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "戶外字幕機｜設計安全實驗室",
  description: "東吳大學城中校區戶外字幕機：互動危害模擬、工程設計、法規與費用檢核",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}
