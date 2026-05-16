"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationV: number;
  rotationX: number;
  rotationXV: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
};

const COLORS = [
  "#8b5cf6", // accent purple
  "#a78bfa",
  "#c4b5fd",
  "#fbbf24", // gold
  "#f59e0b",
  "#34d399", // emerald
  "#6ee7b7",
  "#60a5fa", // blue
  "#f9a8d4", // pink
  "#e5e7eb", // silver
  "#ffffff",
];

function makePiece(originX: number, originY: number): Piece {
  const angle = (Math.random() * 160 - 80) * (Math.PI / 180); // spread upward
  const speed = 6 + Math.random() * 10;
  return {
    x: originX + (Math.random() - 0.5) * 60,
    y: originY,
    vx: Math.sin(angle) * speed,
    vy: -Math.abs(Math.cos(angle)) * speed,
    rotation: Math.random() * 360,
    rotationV: (Math.random() - 0.5) * 8,
    rotationX: Math.random() * 360,
    rotationXV: (Math.random() - 0.5) * 5,
    width: 5 + Math.random() * 4,
    height: 9 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    opacity: 1,
  };
}

export function ConfettiBurst({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piecesRef = useRef<Piece[]>([]);
  const rafRef = useRef<number | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn pieces from top-center
    const originX = canvas.width / 2;
    const originY = canvas.height * 0.12;
    const count = 90 + Math.floor(Math.random() * 30);
    piecesRef.current = Array.from({ length: count }, () => makePiece(originX, originY));

    const GRAVITY = 0.28;
    const AIR = 0.992;
    const FADE_AFTER_MS = 2200;
    const start = performance.now();

    function tick(now: number) {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const elapsed = now - start;
      const fadeFraction = elapsed > FADE_AFTER_MS
        ? Math.min(1, (elapsed - FADE_AFTER_MS) / 1000)
        : 0;

      let alive = false;
      for (const p of piecesRef.current) {
        p.vy += GRAVITY;
        p.vx *= AIR;
        p.vy *= AIR;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationV;
        p.rotationX += p.rotationXV;
        p.opacity = Math.max(0, 1 - fadeFraction);

        if (p.y < canvas!.height + 20 && p.opacity > 0) {
          alive = true;
          ctx!.save();
          ctx!.globalAlpha = p.opacity;
          ctx!.translate(p.x, p.y);
          ctx!.rotate((p.rotation * Math.PI) / 180);
          // Simulate 3D tumble by scaling height with cosine of rotationX
          const scaleY = Math.abs(Math.cos((p.rotationX * Math.PI) / 180));
          ctx!.scale(1, Math.max(0.1, scaleY));
          ctx!.fillStyle = p.color;
          ctx!.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
          ctx!.restore();
        }
      }

      if (alive) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        startedRef.current = false;
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      aria-hidden="true"
    />,
    document.body,
  );
}
