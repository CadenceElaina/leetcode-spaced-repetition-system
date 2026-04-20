"use client";

import { useEffect, useRef } from "react";

export function SkyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let W = 0, H = 0;

    function resize() {
      W = canvas!.offsetWidth;
      H = canvas!.offsetHeight;
      canvas!.width = W * devicePixelRatio;
      canvas!.height = H * devicePixelRatio;
      ctx!.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();

    type Star = { x: number; y: number; r: number; a: number; ts: number; to: number };
    let stars: Star[] = [];

    function makeStars() {
      stars = [];
      const count = Math.floor((W * H) / 4500);
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 0.9 + 0.25,
          a: Math.random() * 0.35 + 0.15,
          ts: Math.random() * 0.008 + 0.003,
          to: Math.random() * Math.PI * 2,
        });
      }
    }
    makeStars();

    const resizeCb = () => { resize(); makeStars(); };
    window.addEventListener("resize", resizeCb);

    function hexAlpha(hex: string, a: number) {
      return hex + Math.floor(a * 255).toString(16).padStart(2, "0");
    }

    function frame(ts: number) {
      ctx!.clearRect(0, 0, W, H);
      for (const s of stars) {
        const a = s.a * (0.5 + 0.5 * Math.sin(ts * s.ts + s.to));
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fillStyle = hexAlpha("#a78bfa", a);
        ctx!.fill();
      }
      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resizeCb);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}
