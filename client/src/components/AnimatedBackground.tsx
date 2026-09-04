import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const c = canvas;
    const x = ctx;

    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor() {
        this.x = Math.random() * c.width;
        this.y = Math.random() * c.height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        if (this.x < 0 || this.x > c.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > c.height) this.vy = -this.vy;
        this.x += this.vx;
        this.y += this.vy;
      }

      draw() {
        x.beginPath();
        x.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        x.fillStyle = "rgba(56, 255, 20, 0.4)";
        x.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      const numParticles = Math.floor((c.width * c.height) / 15000);
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
      }
    };

    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            x.beginPath();
            x.moveTo(particles[i].x, particles[i].y);
            x.lineTo(particles[j].x, particles[j].y);
            x.lineWidth = 1;
            x.strokeStyle = `rgba(56, 255, 20, ${1 - distance / 150})`;
            x.stroke();
          }
        }
      }
    };

    const animate = () => {
      x.clearRect(0, 0, c.width, c.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      drawLines();
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.25,
      }}
    />
  );
}
