import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, User } from "lucide-react";
import { playClick } from "@/lib/sfx";

const LEVELS = [
  { id: "APRENDIZ", label: "Aprendiz", desc: "Palavras básicas (1-200), dicas sonoras e tolerância a erros de digitação." },
  { id: "INICIANTE", label: "Iniciante", desc: "Palavras comuns (1-400)." },
  { id: "INTERMEDIARIO", label: "Intermediário", desc: "Vocabulário do dia a dia (1-600)." },
  { id: "AVANCADO", label: "Avançado", desc: "Palavras complexas (1-800), sem áudio lento na escuta." },
  { id: "MESTRE", label: "Mestre", desc: "Dicionário completo (1-1000). Sem botão de áudio lento, sem múltipla escolha e exige digitação perfeita." },
];

export default function SettingsModal({ onClose, currentDifficulty, onUpdate }: { onClose: () => void, currentDifficulty: string, onUpdate: (diff: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(currentDifficulty);

  const saveDifficulty = async (level: string) => {
    if (loading) return;
    playClick();
    setSelected(level);
    setLoading(true);
    try {
      await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficultyLevel: level })
      });
      onUpdate(level);
      onClose();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="grimoire-book"
        style={{ width: '90%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Settings /> Configurações do Mago</h2>
          <button onClick={() => { playClick(); onClose(); }} style={{ background: 'transparent', border: 'none', color: 'var(--ink)', cursor: 'pointer' }}><X size={28} /></button>
        </div>

        <p style={{ color: 'var(--ink-light)', marginBottom: '2rem' }}>
          O Grimório adapta as palavras geradas com base no seu nível. Níveis mais altos removem facilidades dos minigames e exigem maior precisão.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {LEVELS.map(l => (
            <button 
              key={l.id} 
              onClick={() => saveDifficulty(l.id)}
              className={selected === l.id ? "btn-gold" : "btn-outline"}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '1rem', width: '100%', textAlign: 'left', opacity: loading && selected !== l.id ? 0.5 : 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', fontFamily: "'Cormorant Garamond', serif", fontWeight: 'bold' }}>
                <User size={18} /> {l.label}
              </div>
              <div style={{ fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: selected === l.id ? 'var(--leather-dark)' : 'var(--ink-muted)', marginTop: '0.5rem', textTransform: 'none', letterSpacing: 'normal', fontWeight: 'normal' }}>
                {l.desc}
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
