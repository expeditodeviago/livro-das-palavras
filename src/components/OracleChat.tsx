"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, X } from "lucide-react";
import { playClick, playSparkle } from "@/lib/sfx";

interface OracleChatProps {
  wrongWords: string[];
  onClose: () => void;
}

export default function OracleChat({ wrongWords, onClose }: OracleChatProps) {
  const [messages, setMessages] = useState<{ role: "user" | "oracle"; text: string }[]>([
    { role: "oracle", text: "Saudações, buscador de conhecimento. Vejo as marcas de suas batalhas com as palavras. O que deseja perguntar ao Oráculo hoje?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    playClick();
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, wrongWords }),
      });
      const data = await res.json();
      
      if (res.ok) {
        playSparkle();
        setMessages(prev => [...prev, { role: "oracle", text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "oracle", text: "Houve uma interferência mágica... " + (data.error || "") }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "oracle", text: "As linhas místicas estão rompidas. Tente novamente mais tarde." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.9 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.9 }}
      className="grimoire-book"
      style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '500px', width: '100%', maxWidth: '600px', position: 'relative' }}
    >
      <button 
        onClick={() => { playClick(); onClose(); }} 
        style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', color: 'var(--ink-muted)', cursor: 'pointer' }}
      >
        <X size={24} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--gold-light)' }}>
        <Sparkles size={24} />
        <h2 style={{ margin: 0, fontSize: '1.8rem' }}>O Oráculo</h2>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '1rem', marginBottom: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            background: msg.role === "user" ? "rgba(212, 175, 55, 0.1)" : "rgba(255,255,255,0.03)",
            border: msg.role === "user" ? "1px solid rgba(212, 175, 55, 0.3)" : "1px solid rgba(255,255,255,0.1)",
            padding: '1rem', 
            borderRadius: '12px', 
            maxWidth: '85%',
            color: msg.role === "oracle" ? "var(--ink)" : "var(--gold-light)",
            fontFamily: msg.role === "oracle" ? "'Cormorant Garamond', serif" : "'Inter', sans-serif",
            fontSize: msg.role === "oracle" ? "1.2rem" : "1rem"
          }}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div style={{ alignSelf: "flex-start", color: "var(--gold-dark)", fontStyle: "italic", fontFamily: "'Cormorant Garamond', serif" }}>
            O Oráculo está consultando as estrelas...
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Pergunte sobre as palavras de hoje..." 
          className="book-input" 
          style={{ fontSize: '1.2rem', padding: '1rem', textAlign: 'left' }}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="btn-gold" style={{ padding: '0 1.5rem' }}>
          <Send size={20} />
        </button>
      </form>
    </motion.div>
  );
}
