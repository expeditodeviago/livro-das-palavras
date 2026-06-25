"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Book, BarChart2, Flame } from "lucide-react";
import { playClick } from "@/lib/sfx";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Início", icon: Home },
    { href: "/library", label: "Biblioteca", icon: Book },
    { href: "/stats", label: "Estatísticas", icon: BarChart2 },
  ];

  return (
    <nav style={{
      display: "flex",
      justifyContent: "center",
      gap: "1rem",
      padding: "1rem",
      background: "var(--background)",
      borderBottom: "1px solid var(--gold-dark)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      backdropFilter: "blur(5px)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
    }}>
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        
        return (
          <Link key={link.href} href={link.href} onClick={() => playClick()}>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                background: isActive ? "rgba(212, 175, 55, 0.15)" : "transparent",
                color: isActive ? "var(--gold-light)" : "var(--ink-muted)",
                border: isActive ? "1px solid var(--gold)" : "1px solid transparent",
                fontWeight: isActive ? "bold" : "normal",
                transition: "all 0.2s"
              }}
            >
              <Icon size={18} />
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>{link.label}</span>
            </motion.div>
          </Link>
        );
      })}
    </nav>
  );
}
