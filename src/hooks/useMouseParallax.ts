import { useEffect, useRef } from 'react';

interface Particle {
  el: HTMLDivElement;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  depth: number;
}

const SYMBOLS = ['♪', '♫', '✦', '✧', '★', '◆', '◇', '✿', '❋', '◉'];
const COLORS = ['text-orange-400/30', 'text-pink-400/25', 'text-amber-400/20', 'text-rose-400/20'];

export function useMouseParallax(containerRef: React.RefObject<HTMLElement>) {
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particleContainer = container.querySelector<HTMLElement>('[data-particle-layer]');
    if (!particleContainer) return;

    // Create particles
    const count = window.innerWidth < 640 ? 12 : 22;
    particlesRef.current = [];

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.textContent = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      el.className = `float-particle pointer-events-none absolute select-none ${COLORS[i % COLORS.length]}`;
      el.style.fontSize = `${12 + Math.random() * 24}px`;
      el.style.setProperty('--float-duration', `${6 + Math.random() * 8}s`);
      el.style.animationDelay = `${Math.random() * 5}s`;

      const baseX = Math.random() * 100;
      const baseY = Math.random() * 100;
      el.style.left = `${baseX}%`;
      el.style.top = `${baseY}%`;

      particleContainer.appendChild(el);

      particlesRef.current.push({
        el,
        x: 0,
        y: 0,
        baseX,
        baseY,
        depth: 0.3 + Math.random() * 0.7,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      mouseRef.current.y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    };

    const animate = () => {
      for (const p of particlesRef.current) {
        const targetX = mouseRef.current.x * 40 * p.depth;
        const targetY = mouseRef.current.y * 40 * p.depth;
        p.x += (targetX - p.x) * 0.05;
        p.y += (targetY - p.y) * 0.05;
        p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    container.addEventListener('mousemove', handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
      particleContainer.innerHTML = '';
    };
  }, [containerRef]);
}
