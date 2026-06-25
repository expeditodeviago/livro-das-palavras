"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, Flame, Award, BookOpen, Share2, Activity } from "lucide-react";
import ShareCard from "@/components/ShareCard";
import { AnimatePresence } from "framer-motion";

export default function StatsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <BarChart2 size={64} color="var(--gold)" />
        </motion.div>
      </main>
    );
  }

  if (!stats) return null;

  return (
    <main className="container">
      <motion.div 
        className="grimoire-book"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="fancy-title" style={{ fontSize: '3.5rem' }}>Grimório Completo</h1>
          <p style={{ color: 'var(--ink-light)', fontStyle: 'italic', fontSize: '1.2rem', fontFamily: "'Cormorant Garamond', serif" }}>
            A compilação de todo o seu conhecimento e poder acumulado.
          </p>
        </div>

        {stats && (
          <>
            <div className="stats-grid" style={{ marginBottom: '3rem', gap: '1.5rem' }}>
              <motion.div className="stat-box" whileHover={{ y: -5, scale: 1.02 }}>
                <Flame size={48} color="var(--error)" style={{ marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(212,55,55,0.5))' }} />
                <span className="stat-value">{stats.currentStreak}</span>
                <span className="stat-label">Ofensiva Atual</span>
              </motion.div>
              <motion.div className="stat-box" whileHover={{ y: -5, scale: 1.02 }}>
                <Flame size={48} color="var(--gold-dark)" style={{ marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.3))' }} />
                <span className="stat-value">{stats.longestStreak}</span>
                <span className="stat-label">Maior Ofensiva</span>
              </motion.div>
              <motion.div className="stat-box" whileHover={{ y: -5, scale: 1.02 }}>
                <Activity size={48} color="var(--success)" style={{ marginBottom: '15px', filter: 'drop-shadow(0 0 10px rgba(60,157,95,0.5))' }} />
                <span className="stat-value">{stats.accuracy}%</span>
                <span className="stat-label">Precisão Global</span>
              </motion.div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                <BookOpen size={36} color="var(--ink-muted)" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '3rem', fontFamily: "'Cormorant Garamond', serif", color: 'var(--ink)' }}>{stats.studiedWords}</div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-muted)' }}>Termos Descobertos</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.02))', padding: '2rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(212,175,55,0.3)', boxShadow: '0 0 30px rgba(212,175,55,0.1), inset 0 0 20px rgba(212,175,55,0.05)' }}>
                <Award size={36} color="var(--gold-neon)" style={{ margin: '0 auto 10px', filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.5))' }} />
                <div style={{ fontSize: '3rem', fontFamily: "'Cormorant Garamond', serif", color: 'var(--gold-light)' }}>{stats.masteredWords}</div>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)' }}>Termos Dominados</div>
              </div>
            </div>
          </>
        )}

        <div className="progress-container" style={{ marginTop: '2rem', height: '20px', borderRadius: '10px' }}>
          <motion.div 
            className="progress-bar" 
            initial={{ width: 0 }} 
            animate={{ width: `${(stats.studiedWords / stats.totalWords) * 100}%` }} 
          />
        </div>

        {stats.boxDistribution && (
          <div style={{ marginTop: '4rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--gold-light)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(212,175,55,0.3)', paddingBottom: '0.5rem', fontFamily: "'Cormorant Garamond', serif" }}>Proficiência (Leitner)</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '15px', marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 5px 15px rgba(0,0,0,0.5)' }}>
              {stats.boxDistribution.map((count: number, index: number) => {
                const maxVal = Math.max(...stats.boxDistribution, 1);
                const heightPct = (count / maxVal) * 100;
                return (
                  <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--ink-light)', marginBottom: '8px', fontWeight: 'bold' }}>{count}</span>
                    <motion.div 
                      initial={{ height: 0 }} 
                      animate={{ height: `${heightPct}%` }} 
                      style={{ 
                        width: '100%', 
                        background: index === 4 ? 'linear-gradient(180deg, var(--gold-neon), var(--gold-dark))' : 'linear-gradient(180deg, var(--ink-light), var(--ink-muted))', 
                        borderRadius: '6px 6px 0 0', 
                        minHeight: '8px',
                        boxShadow: index === 4 ? '0 0 15px rgba(212,175,55,0.5)' : 'none'
                      }} 
                    />
                    <span style={{ fontSize: '0.8rem', color: index === 4 ? 'var(--gold)' : 'var(--ink-muted)', marginTop: '8px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nv {index + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ marginTop: '4rem', textAlign: 'center' }}>
          <button onClick={() => setShowShare(true)} className="btn-gold" style={{ padding: '1.2rem 2.5rem', fontSize: '1.2rem', gap: '10px' }}>
            <Share2 size={20} /> Compartilhar Grimório Completo
          </button>
        </div>

      </motion.div>
      <AnimatePresence>
        {showShare && (
          <ShareCard
            streak={stats.currentStreak}
            masteredWords={stats.masteredWords}
            difficultyLevel="MESTRE" // Arbitrary for complete profile
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
