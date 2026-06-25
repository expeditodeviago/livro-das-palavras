"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { Download, X, Sparkles, Flame, Award, Shield } from "lucide-react";
import { playClick, playSuccess } from "@/lib/sfx";

interface ShareCardProps {
  streak: number;
  masteredWords: number;
  difficultyLevel: string;
  onClose: () => void;
}

export default function ShareCard({ streak, masteredWords, difficultyLevel, onClose }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mageName, setMageName] = useState("Mago Desconhecido");
  const [isGenerating, setIsGenerating] = useState(false);

  const getTitle = () => {
    switch (difficultyLevel) {
      case "APRENDIZ": return "Aprendiz das Letras";
      case "INICIANTE": return "Adepto das Runas";
      case "INTERMEDIARIO": return "Feiticeiro Fluente";
      case "AVANCADO": return "Arque-mago do Vocabulário";
      case "MESTRE": return "Senhor da Sintaxe";
      default: return "Conjurador das Palavras";
    }
  };

  const getMessage = () => {
    switch (difficultyLevel) {
      case "APRENDIZ": return "Os primeiros feitiços foram lançados. O caminho da fluência começou.";
      case "INICIANTE": return "As runas começam a fazer sentido. O poder cresce.";
      case "INTERMEDIARIO": return "Dominando a língua inglesa com magias mais complexas.";
      case "AVANCADO": return "Velocidade e precisão. Nenhuma palavra escapa.";
      case "MESTRE": return "O topo da hierarquia mágica. O grimório foi dominado.";
      default: return "Sua magia é forte.";
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    playClick();
    setIsGenerating(true);
    
    try {
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          borderRadius: '16px'
        }
      });
      const link = document.createElement('a');
      link.download = `grimorio-de-${mageName.toLowerCase().replace(/\s/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      playSuccess();
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--gold)', borderRadius: '16px', padding: '2rem', maxWidth: '500px', width: '100%', position: 'relative' }}>
        <button onClick={() => { playClick(); onClose(); }} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', color: 'var(--ink)' }}>
          <X />
        </button>
        
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Sua Arte Mágica</h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Grave seu nome no Grimório:</label>
          <input 
            type="text" 
            value={mageName} 
            onChange={(e) => setMageName(e.target.value)} 
            className="book-input" 
            style={{ fontSize: '1.2rem', padding: '1rem' }}
            maxLength={25}
          />
        </div>

        {/* The Card to be captured */}
        <div style={{ padding: '10px', background: 'var(--bg-deep)', borderRadius: '16px' }}>
          <div 
            ref={cardRef} 
            style={{ 
              background: 'linear-gradient(135deg, #1a1025, #09070b)',
              border: '2px solid var(--gold)', 
              borderRadius: '16px', 
              padding: '2.5rem', 
              color: 'var(--ink)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(212, 175, 55, 0.2) inset'
            }}
          >
            {/* Background elements */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', color: 'rgba(212, 175, 55, 0.05)' }}>
              <Shield size={200} />
            </div>

            <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <Sparkles size={40} color="var(--gold)" />
              </div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '2.5rem', color: 'var(--gold-light)', margin: 0, textShadow: '0 0 10px rgba(212,175,55,0.5)' }}>
                {mageName}
              </h1>
              <p style={{ color: 'var(--gold-dark)', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.8rem', fontWeight: 'bold', margin: '0.5rem 0 2rem 0' }}>
                {getTitle()}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-around', margin: '2rem 0', padding: '1.5rem 0', borderTop: '1px solid rgba(212, 175, 55, 0.2)', borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                <div>
                  <Flame size={32} color="var(--error)" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontSize: '2rem', fontFamily: "'Cormorant Garamond', serif", color: 'white', fontWeight: 'bold' }}>{streak}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Dias de Fogo</div>
                </div>
                <div>
                  <Award size={32} color="var(--gold-neon)" style={{ margin: '0 auto 10px auto' }} />
                  <div style={{ fontSize: '2rem', fontFamily: "'Cormorant Garamond', serif", color: 'white', fontWeight: 'bold' }}>{masteredWords}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-muted)', textTransform: 'uppercase' }}>Palavras Dominadas</div>
                </div>
              </div>

              <p style={{ fontStyle: 'italic', color: 'var(--ink-light)', fontSize: '1.1rem', fontFamily: "'Cormorant Garamond', serif" }}>
                "{getMessage()}"
              </p>
              
              <div style={{ marginTop: '2rem', fontSize: '0.7rem', color: 'var(--ink-muted)', letterSpacing: '0.1em' }}>
                MESTRE DAS LINGUAGENS • {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleDownload} disabled={isGenerating} className="btn-gold" style={{ width: '100%', marginTop: '1.5rem' }}>
          <Download size={20} /> {isGenerating ? "Forjando Imagem..." : "Baixar Arte"}
        </button>
      </div>
    </motion.div>
  );
}
