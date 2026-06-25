"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Flame, Scroll, Star, Award, ChevronRight, MessageCircle, RotateCcw, Settings, Sparkles } from "lucide-react";
import OracleChat from "@/components/OracleChat";
import SettingsModal from "@/components/SettingsModal";
import ShareCard from "@/components/ShareCard";
import { playClick } from "@/lib/sfx";
import { saveLocal, getLocal, StorageKeys } from "@/lib/storage";
import { Share2 } from "lucide-react";

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [showOracle, setShowOracle] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [wrongWords, setWrongWords] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      
      const cached = getLocal<any>(StorageKeys.DAILY_SESSION);
      if (cached && cached.date === dateStr) {
        setData(cached);
      }

      try {
        const res = await fetch(`/api/session?date=${dateStr}`);
        const json = await res.json();
        json.date = dateStr;
        setData(json);
        saveLocal(StorageKeys.DAILY_SESSION, json);
      } catch (err) {
        console.error("Erro ao buscar sessão na API", err);
      }
    }
    
    loadData();

    // Se o usuário deixar a aba aberta da noite pro dia, atualiza a interface
    const handleFocus = () => loadData();
    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") loadData();
    });

    // Carregar wrong words do localStorage
    const savedWrong = localStorage.getItem("DAILY_WRONG_WORDS");
    if (savedWrong) {
      try { setWrongWords(JSON.parse(savedWrong)); } catch(e) {}
    }

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  if (!data) {
    return (
      <main className="container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <BookOpen size={64} color="var(--gold)" />
        </motion.div>
      </main>
    );
  }

  const { session, words, streak } = data;
  const masteredWords = 0; // We don't have the db query locally on client, so we mock it or fetch it. Let's just use 0 for now as placeholder for the UI.
  const totalStudied = words.length;

  return (
    <main className="container">
      {/* Magical Floating Orbs */}
      <div className="floating-orb" style={{ top: '10%', left: '10%', width: '150px', height: '150px', background: 'rgba(212, 175, 55, 0.15)' }}></div>
      <div className="floating-orb" style={{ top: '60%', right: '5%', width: '200px', height: '200px', background: 'rgba(138, 43, 226, 0.15)', animationDelay: '-5s' }}></div>
      <div className="floating-orb" style={{ bottom: '10%', left: '20%', width: '100px', height: '100px', background: 'rgba(255, 223, 0, 0.1)', animationDelay: '-10s' }}></div>

      <motion.div 
        className="grimoire-book"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10, display: 'flex', gap: '10px' }}>
          <button onClick={() => { playClick(); setShowShare(true); }} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '5px' }}>
            <Share2 size={16} /> Arte Mágica
          </button>
          <button onClick={() => { playClick(); setShowSettings(true); }} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', gap: '5px' }}>
            <Settings size={16} /> Nível: {data.difficultyLevel || 'Aprendiz'}
          </button>
        </div>

        {/* Title Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <motion.h1 
            className="fancy-title"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Livro das Palavras
          </motion.h1>
          <motion.p 
            style={{ color: 'var(--ink-light)', fontStyle: 'italic', fontSize: '1.2rem', fontFamily: "'Cormorant Garamond', serif", maxWidth: '600px', margin: '0 auto 1rem auto' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            O seu ritual diário de vocabulário. Leia, ouça, traduza e retenha as 1000 palavras essenciais da língua inglesa.
          </motion.p>
          <motion.p
            style={{ color: 'var(--gold-dark)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Sparkles size={16} style={{ display: 'inline', marginBottom: '-2px', marginRight: '5px' }} /> As palavras se atualizam todos os dias com base na sua memória
          </motion.p>
        </div>

        <motion.div 
          style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
        >
          {session.completed ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', border: '1px dashed var(--gold)', borderRadius: '2px', background: 'rgba(212,175,55,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.6rem', fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold-neon)', fontWeight: 'bold' }}>
                <Scroll size={28} /> O capítulo de hoje foi concluído.
              </div>
              <p style={{ color: 'var(--ink-light)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Sua sabedoria aumentou em <span style={{ color: 'var(--gold-light)', fontWeight: 'bold' }}>{session.score} pontos</span>.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setShowOracle(true)} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem' }}>
                  <MessageCircle size={18} /> Consultar Oráculo
                </button>
                <Link href="/challenge?mode=review" className="btn-gold" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem' }}>
                  <RotateCcw size={18} /> Treino Extra
                </Link>
              </div>
            </div>
          ) : (
            <Link href="/challenge" onClick={() => playClick()} className="btn-gold">
              Iniciar Capítulo <ChevronRight />
            </Link>
          )}
        </motion.div>

        {/* Stats Grid */}
        <section className="stats-grid" style={{ padding: '1rem 0' }}>
          <motion.div className="stat-box" whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring" }}>
            <Flame size={48} color="var(--error)" style={{ marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(212,55,55,0.5))' }} />
            <span className="stat-value">{streak.currentStreak}</span>
            <span className="stat-label">Dias de Fogo</span>
          </motion.div>

          <motion.div className="stat-box" whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring" }}>
            <Award size={48} color="var(--gold-neon)" style={{ marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.5))' }} />
            <span className="stat-value">{masteredWords}</span>
            <span className="stat-label">Termos Dominados</span>
          </motion.div>

          <motion.div className="stat-box" whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring" }}>
            <Star size={48} color={session.completed ? "var(--success)" : "var(--ink-muted)"} style={{ marginBottom: '15px', filter: session.completed ? 'drop-shadow(0 0 10px rgba(60,157,95,0.5))' : 'none' }} />
            <span className="stat-value" style={{ color: session.completed ? 'var(--success)' : 'var(--ink)' }}>
              {session.completed ? '100%' : '0%'}
            </span>
            <span className="stat-label">Progresso Atual</span>
          </motion.div>
        </section>

        {/* Words Table */}
        <motion.section 
          style={{ marginTop: '4rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
        >
          <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--leather)' }}>Índice de Hoje</h2>
          <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.3)', padding: '1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
            <table className="book-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Palavra</th>
                  <th>Tradução</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {words.map((w: any) => {
                  const isNew = !w.progress;
                  return (
                    <motion.tr key={w.id} whileHover={{ backgroundColor: "rgba(212,175,55,0.1)" }}>
                      <td style={{ color: 'var(--ink-muted)' }}>#{w.rank}</td>
                      <td style={{ fontWeight: 600, fontSize: '1.1rem' }}>{w.word}</td>
                      <td>{w.translation}</td>
                      <td>
                        {isNew ? (
                          <span className="tag tag-new">Novo Termo</span>
                        ) : (
                          <span className="tag tag-level">Nível {w.progress?.box}</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.section>

      </motion.div>

      {showOracle && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <OracleChat wrongWords={wrongWords} onClose={() => setShowOracle(false)} />
        </div>
      )}

      <AnimatePresence>
        {showSettings && (
          <SettingsModal 
            currentDifficulty={data.difficultyLevel || "APRENDIZ"} 
            onClose={() => setShowSettings(false)} 
            onUpdate={(diff) => setData({ ...data, difficultyLevel: diff })} 
          />
        )}
        {showShare && (
          <ShareCard
            streak={streak.currentStreak}
            masteredWords={masteredWords}
            difficultyLevel={data.difficultyLevel || "APRENDIZ"}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
