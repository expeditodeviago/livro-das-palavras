"use client";

import { useEffect, useRef } from "react";
import { playSparkle } from "@/lib/sfx";

const WORDS = [
  "WISDOM", "FOCUS", "POWER", "TRUTH", "SPELL", "MAGIC", "KNOWLEDGE", "RUNE",
  "ARCANE", "GRIMOIRE", "MYSTIC", "ORACLE", "PROPHECY", "ALCHEMY", "INCANTATION",
  "SORCERY", "ENCHANT", "EPIPHANY", "LINGUIST", "FLUENT", "MASTERY", "ESSENCE",
  "AURA", "VISION", "CHRONICLE", "LEXICON", "SCROLL", "TOME", "ETHEREAL",
  "ILLUSION", "WIZARDRY", "MYSTERY", "ECHO", "WONDER", "REVELATION", "PHANTOM",
  "SPIRIT", "OMEN", "SYNTAX", "GRAMMAR", "VOICE", "SOUL", "MIND", "ASTRAL"
];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  letter: string; size: number; color: string;
  baseX?: number; baseY?: number; // Target for forming words
  spin: number; spinSpeed: number; // For spinning letters
}

export default function FloatingLetters() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    let particles: Particle[] = [];
    const particleCount = window.innerWidth < 768 ? 80 : 200;

    const mouse = { x: -1000, y: -1000, vx: 0, vy: 0, radius: 250 };
    const lastMouse = { x: -1000, y: -1000 };
    let isFormingWord = false;
    let currentWord = "";
    let currentElement = { name: 'gold', color: '#ffdf00', glow: '#ffdf00' };
    let formationTimeout: NodeJS.Timeout;

    const colors = ["#d4af37", "#f1d570", "#aa8620", "#e2e8f0", "#a0aec0", "#b58900"];

    function init() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          letter: LETTERS[Math.floor(Math.random() * LETTERS.length)],
          size: Math.random() * 25 + 10,
          color: colors[Math.floor(Math.random() * colors.length)],
          spin: Math.random() * Math.PI * 2,
          spinSpeed: (Math.random() - 0.5) * 0.1
        });
      }
    }

    function formWord(clickX: number, clickY: number) {
      if (isFormingWord) return;
      isFormingWord = true;
      currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];

      const elements = [
        { name: 'fire', color: '#ff7300', glow: '#ff0000' }, // Laranja/Vermelho
        { name: 'ice', color: '#00ffff', glow: '#0088ff' },  // Ciano/Azul
        { name: 'lightning', color: '#ffff00', glow: '#eedd00' }, // Amarelo chocado
        { name: 'nature', color: '#32cd32', glow: '#006400' }, // Verde planta
        { name: 'arcane', color: '#d100ff', glow: '#4b0082' }, // Roxo Magia
        { name: 'laser', color: '#00ff00', glow: '#00ff00' } // Verde neon laser
      ];
      currentElement = elements[Math.floor(Math.random() * elements.length)];

      ctx!.font = "bold 80px 'Cormorant Garamond', serif";
      const totalWidth = ctx!.measureText(currentWord).width;
      const startX = clickX - totalWidth / 2;
      const startY = clickY;

      let currentX = startX;

      // Assign the first N particles to form the word
      for (let i = 0; i < currentWord.length; i++) {
        if (particles[i]) {
          particles[i].letter = currentWord[i];
          particles[i].baseX = currentX + ctx!.measureText(currentWord[i]).width / 2;
          particles[i].baseY = startY;
          particles[i].size = window.innerWidth < 768 ? 40 : 80;
          particles[i].color = currentElement.color; 
          particles[i].spin = 0;
          particles[i].spinSpeed = 0; // stop spinning
          currentX += ctx!.measureText(currentWord[i]).width;
        }
      }
      playSparkle();

      for (let i = currentWord.length; i < particles.length; i++) {
        particles[i].baseX = undefined;
        particles[i].baseY = undefined;
      }

      clearTimeout(formationTimeout);
      formationTimeout = setTimeout(() => {
        isFormingWord = false;
        particles.forEach(p => {
          p.baseX = undefined; p.baseY = undefined;
          p.size = Math.random() * 25 + 10;
          p.spinSpeed = (Math.random() - 0.5) * 0.1;
        });
      }, 2500);
    }

    function animate() {
      requestAnimationFrame(animate);
      ctx!.clearRect(0, 0, w, h);

      // Mouse speed tracking
      const mouseSpeed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (isFormingWord && p.baseX !== undefined && p.baseY !== undefined) {
          // Lerp to target
          p.x += (p.baseX - p.x) * 0.08;
          p.y += (p.baseY - p.y) * 0.08;
        } else {
          // Normal floating
          p.x += p.vx;
          p.y += p.vy;
          p.spin += p.spinSpeed;

          // Bounce off edges
          if (p.x < -50) p.x = w + 50;
          if (p.x > w + 50) p.x = -50;
          if (p.y < -50) p.y = h + 50;
          if (p.y > h + 50) p.y = -50;

          // Mouse interaction (vigorous magnetic repel & spin)
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius && !isFormingWord) {
            const force = (mouse.radius - distance) / mouse.radius;
            // Push away vigorously
            p.x -= (dx / distance) * force * (mouseSpeed * 0.5 + 2);
            p.y -= (dy / distance) * force * (mouseSpeed * 0.5 + 2);
            // Spin wildly
            p.spin += force * 0.2 * (mouse.vx > 0 ? 1 : -1);
            p.color = "#ffea75"; // Brighten when touched by aura
          } else if (!isFormingWord) {
            p.color = colors[i % colors.length]; // Return to normal
          }
        }

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.spin);
        
        ctx!.font = `bold ${p.size}px 'Cormorant Garamond', serif`;
        ctx!.fillStyle = p.color;
        
        if (isFormingWord && p.baseX !== undefined) {
          ctx!.globalAlpha = 1;
          ctx!.shadowBlur = 40;
          ctx!.shadowColor = currentElement.glow;
          
          // Desenhar efeitos extras dependendo do elemento
          if (currentElement.name === 'lightning' && Math.random() > 0.8) {
            ctx!.beginPath();
            ctx!.moveTo(0, -p.size);
            ctx!.lineTo(Math.random() * 20 - 10, -p.size - 20);
            ctx!.lineTo(Math.random() * 20 - 10, -p.size - 40);
            ctx!.strokeStyle = '#ffff00';
            ctx!.lineWidth = 2;
            ctx!.stroke();
          } else if (currentElement.name === 'fire' && Math.random() > 0.6) {
            ctx!.beginPath();
            ctx!.arc(Math.random() * 20 - 10, -p.size - Math.random() * 20, Math.random() * 5, 0, Math.PI * 2);
            ctx!.fillStyle = '#ff4500';
            ctx!.fill();
          } else if (currentElement.name === 'nature' && Math.random() > 0.7) {
            ctx!.beginPath();
            // Draw a small leaf shape
            ctx!.ellipse(Math.random() * 20 - 10, -p.size - Math.random() * 20, 3, 6, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx!.fillStyle = '#32cd32';
            ctx!.fill();
          } else if (currentElement.name === 'arcane' && Math.random() > 0.8) {
            ctx!.beginPath();
            ctx!.arc(0, 0, p.size + Math.random() * 15, 0, Math.PI * 2);
            ctx!.strokeStyle = 'rgba(209, 0, 255, 0.4)';
            ctx!.lineWidth = 1;
            ctx!.stroke();
          } else if (currentElement.name === 'laser' && Math.random() > 0.8) {
            ctx!.beginPath();
            ctx!.moveTo(-p.size, -p.size);
            ctx!.lineTo(p.size, p.size);
            ctx!.strokeStyle = '#00ff00';
            ctx!.lineWidth = 2;
            ctx!.stroke();
          }
        } else {
          // Calculate closeness to mouse for glow but optimize math
          const distSq = (mouse.x - p.x)*(mouse.x - p.x) + (mouse.y - p.y)*(mouse.y - p.y);
          if (distSq < 40000) { // 200 * 200
            ctx!.globalAlpha = 0.9;
            ctx!.shadowBlur = 10;
            ctx!.shadowColor = "#ffea75";
          } else {
            // Simplify pulsing alpha
            ctx!.globalAlpha = 0.3 + (Math.sin(Date.now() / 2000 + i) * 0.1); 
            ctx!.shadowBlur = 0;
          }
        }

        ctx!.textAlign = "center";
        ctx!.textBaseline = "middle";
        ctx!.fillText(p.letter, 0, 0);
        
        ctx!.restore();
      }

      // Decay mouse velocity
      mouse.vx *= 0.8;
      mouse.vy *= 0.8;
    }

    init();
    animate();

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      if (!isFormingWord) init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.vx = mouse.x - lastMouse.x;
      mouse.vy = mouse.y - lastMouse.y;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Ignore clicks on UI elements
      if (target.closest('.container') || 
          target.closest('button') || 
          target.closest('a') || 
          target.closest('input') ||
          target.closest('.btn-outline') ||
          target.closest('.btn-gold')) return; 
      formWord(e.clientX, e.clientY);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleClick);
      clearTimeout(formationTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: -1, background: "transparent"
      }}
    />
  );
}
