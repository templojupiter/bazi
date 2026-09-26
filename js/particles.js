/**
 * Reusable canvas-2D particle field.
 * Used for: connection network, "what do you need" word cloud reactions,
 * form light-thread convergence, final loop.
 * Kept separate from the Three.js hero (scene.js) because these instances
 * are cheap, numerous, and only need 2D drift/attraction/connection — not a
 * 3D silhouette.
 */
(function (global) {
  "use strict";

  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function qualityTier() {
    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const narrow = window.innerWidth < 768;
    if (REDUCED_MOTION) return "minimal";
    if (mem <= 2 || cores <= 2 || narrow) return "low";
    if (mem <= 4 || cores <= 4) return "medium";
    return "high";
  }

  const COUNTS = { minimal: 18, low: 40, medium: 90, high: 160 };

  class Particle {
    constructor(x, y) {
      this.x = x; this.y = y;
      this.tx = x; this.ty = y; // target
      this.vx = 0; this.vy = 0;
      this.driftX = Math.random() * 1000;
      this.driftY = Math.random() * 1000;
      this.r = 0.6 + Math.random() * 1.4;
      this.alpha = 0.25 + Math.random() * 0.5;
    }
  }

  class ParticleField {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object} opts { color, connect: bool, connectDist, mode }
     */
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.color = opts.color || "184, 154, 97"; // gold rgb
      this.connect = opts.connect !== false;
      this.connectDist = opts.connectDist || 120;
      this.mode = opts.mode || "drift"; // drift | converge | disperse | still
      this.tier = qualityTier();
      this.count = opts.count || COUNTS[this.tier];
      this.particles = [];
      this.running = false;
      this.t = 0;
      this._onResize = this.resize.bind(this);
      this.resize();
      window.addEventListener("resize", this._onResize);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = rect.width; this.height = rect.height;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!this.particles.length) this._seed();
    }

    _seed() {
      this.particles = [];
      for (let i = 0; i < this.count; i++) {
        this.particles.push(new Particle(Math.random() * this.width, Math.random() * this.height));
      }
    }

    /** Send particles toward explicit target points (e.g. a circle of people, a silhouette). */
    setTargets(points) {
      this.particles.forEach((p, i) => {
        const target = points[i % points.length];
        p.tx = target.x; p.ty = target.y;
      });
      this.mode = "converge";
    }

    setMode(mode) { this.mode = mode; }

    start() {
      if (this.running) return;
      this.running = true;
      const loop = (ts) => {
        if (!this.running) return;
        this._tick(ts);
        this._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    }

    stop() {
      this.running = false;
      if (this._raf) cancelAnimationFrame(this._raf);
    }

    destroy() {
      this.stop();
      window.removeEventListener("resize", this._onResize);
    }

    _tick(ts) {
      this.t = ts * 0.0002;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      const speed = this.mode === "disperse" ? 0.02 : 0.045;

      this.particles.forEach((p, i) => {
        if (this.mode === "converge") {
          p.vx += (p.tx - p.x) * 0.02;
          p.vy += (p.ty - p.y) * 0.02;
          p.vx *= 0.85; p.vy *= 0.85;
        } else if (this.mode === "disperse") {
          const cx = this.width / 2, cy = this.height / 2;
          p.vx += (p.x - cx) * 0.002;
          p.vy += (p.y - cy) * 0.002;
          p.vx *= 0.98; p.vy *= 0.98;
        } else if (this.mode === "still") {
          p.vx *= 0.8; p.vy *= 0.8;
        } else {
          // organic drift via offset sine fields — no linear motion
          const nx = Math.sin(this.t + p.driftX) * 0.6;
          const ny = Math.cos(this.t * 0.8 + p.driftY) * 0.6;
          p.vx += nx * speed;
          p.vy += ny * speed;
          p.vx *= 0.94; p.vy *= 0.94;
        }
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${p.alpha})`;
        ctx.fill();
      });

      if (this.connect && this.tier !== "minimal") {
        ctx.lineWidth = 0.6;
        for (let i = 0; i < this.particles.length; i++) {
          for (let j = i + 1; j < this.particles.length; j++) {
            const a = this.particles[i], b = this.particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.connectDist) {
              const alpha = (1 - dist / this.connectDist) * 0.18;
              ctx.strokeStyle = `rgba(${this.color}, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }
    }
  }

  global.SoulParticles = { ParticleField, qualityTier, REDUCED_MOTION };
})(window);
