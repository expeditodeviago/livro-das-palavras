import type { Metadata } from "next";
import "./globals.css";
import FloatingLetters from "@/components/FloatingLetters";
import MagicCursor from "@/components/MagicCursor";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Grimório das Palavras",
  description: "Aprenda as 1000 palavras mais comuns do inglês.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <FloatingLetters />
        <MagicCursor />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
