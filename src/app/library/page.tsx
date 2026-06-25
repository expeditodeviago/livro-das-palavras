"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, Search, Volume2 } from "lucide-react";
import { playClick } from "@/lib/sfx";

export default function LibraryPage() {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/library")
      .then(r => r.json())
      .then(data => { setWords(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const playAudio = (text: string) => {
    playClick();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const filtered = words.filter(w => 
    w.word.toLowerCase().includes(search.toLowerCase()) || 
    w.translation.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="container">
      <motion.div 
        className="grimoire-book"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ minHeight: "80vh" }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <BookMarked size={40} color="var(--gold)" />
          <h1 className="fancy-title" style={{ margin: 0, fontSize: '2.5rem' }}>O Grande Arquivo</h1>
        </div>

        <div style={{ position: "relative", marginBottom: "2rem" }}>
          <Search size={20} color="var(--ink-muted)" style={{ position: "absolute", left: 15, top: 15 }} />
          <input 
            type="text" 
            placeholder="Pesquisar por feitiços (palavras) ou significados..." 
            className="book-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "3rem", width: "100%", fontSize: "1.1rem" }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--ink-muted)" }}>Lendo os pergaminhos antigos...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="book-table">
              <thead>
                <tr>
                  <th>Som</th>
                  <th>Palavra (Inglês)</th>
                  <th>Tradução</th>
                  <th>Proficiência</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => {
                  const progress = w.progress;
                  const totalTries = progress ? progress.correctAttempts + progress.incorrectAttempts : 0;
                  const acc = totalTries > 0 ? Math.round((progress.correctAttempts / totalTries) * 100) : 0;
                  
                  return (
                    <motion.tr key={w.id} whileHover={{ backgroundColor: "rgba(212,175,55,0.05)" }}>
                      <td>
                        <button onClick={() => playAudio(w.word)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--gold)" }}>
                          <Volume2 size={20} />
                        </button>
                      </td>
                      <td style={{ fontWeight: "bold", fontSize: "1.2rem", color: "var(--leather)" }}>{w.word}</td>
                      <td>{w.translation}</td>
                      <td>
                        {!progress ? (
                          <span className="tag tag-new">Desconhecida</span>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span className="tag tag-level" style={{ background: acc > 80 ? "var(--success)" : acc < 50 ? "var(--error)" : "var(--gold)" }}>
                              Nv {progress.box}
                            </span>
                            <span style={{ fontSize: "0.9rem", color: "var(--ink-muted)" }}>{acc}% acerto</span>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p style={{ textAlign: "center", marginTop: "2rem" }}>Nenhum feitiço encontrado nas escrituras.</p>}
          </div>
        )}
      </motion.div>
    </main>
  );
}
