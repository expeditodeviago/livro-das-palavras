"use client";

import { useEffect, useRef } from "react";

export default function MagicCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: { x: number, y: number, life: number, size: number, speedX: number, speedY: number }[] = [];
    const mouse = { x: -100, y: -100 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle or reduce interpolation points for better performance
      const dx = e.clientX - mouse.x;
      const dy = e.clientY - mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Interpolate only if distance is somewhat large, but fewer steps
      if (mouse.x !== -100 && distance > 10 && distance < 150) {
        const steps = Math.min(Math.floor(distance / 15), 5); // Max 5 steps
        for(let i=0; i<steps; i++) {
          particles.push({
            x: mouse.x + (dx * i) / steps + (Math.random() - 0.5) * 5,
            y: mouse.y + (dy * i) / steps + (Math.random() - 0.5) * 5,
            life: 1,
            size: Math.random() * 3 + 1.5,
            speedX: (Math.random() - 0.5) * 1,
            speedY: (Math.random() - 0.5) * 1 - 0.5
          });
        }
      }
      
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      
      // Burst of particles at current position (reduced count)
      particles.push({
        x: mouse.x + (Math.random() - 0.5) * 5,
        y: mouse.y + (Math.random() - 0.5) * 5,
        life: 1,
        size: Math.random() * 3 + 1.5,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2 - 0.5
      });
    };
    window.addEventListener("mousemove", handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 0.03; // Faster decay
        p.size *= 0.95; // Shrink slightly faster

        if (p.life <= 0 || p.size <= 0.1) {
          particles.splice(i, 1);
          i--;
          continue;
        }

        // Draw glowing core (simplified)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // Dynamic color based on life
        const r = 212 + (1 - p.life) * 40;
        const g = 175 - (1 - p.life) * 100;
        const b = 55;
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.life})`;
        // Disable shadowBlur on particles as it causes massive lag
        // ctx.shadowBlur = p.size * 3;
        // ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${p.life})`;
        ctx.fill();
        
        // Draw magical star/cross shape occasionally (simplified)
        if (Math.random() > 0.9) {
          ctx.beginPath();
          ctx.moveTo(p.x - p.size, p.y);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.strokeStyle = `rgba(255, 255, 255, ${p.life * 0.4})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999
      }} 
    />
  );
}
