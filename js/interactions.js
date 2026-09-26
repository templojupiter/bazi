/**
 * Everything the visitor touches: nav behaviour, the floating "what do you
 * need" scene, day-by-day rail, practices cloud, guides, magnetic CTAs.
 */
(function () {
  "use strict";

  function initNav() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    let lastY = window.scrollY;

    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y > 120 && y > lastY) nav.classList.add("nav-hidden");
      else nav.classList.remove("nav-hidden");
      nav.classList.toggle("is-scrolled", y > 40);
      lastY = y;
    }, { passive: true });

    const toggle = document.querySelector(".menu-toggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
      });
      nav.querySelectorAll(".nav-links a").forEach((a) =>
        a.addEventListener("click", () => {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        })
      );
    }
  }

  /** ¿Qué necesitás hoy? — words float, hover pulls the whole scene's mood. */
  function initNeedScene() {
    const section = document.getElementById("need-today");
    if (!section) return;
    const canvas = section.querySelector("canvas");
    const words = section.querySelectorAll("[data-need]");
    const responseEl = section.querySelector("[data-need-response]");
    let field = null;

    if (canvas && window.SoulParticles) {
      field = new window.SoulParticles.ParticleField(canvas, {
        color: "184, 154, 97",
        count: window.SoulParticles.qualityTier() === "low" ? 30 : 70,
        connect: true,
      });
      field.start();
    }

    const RESPONSES = {
      descansar: "El movimiento se vuelve más lento.",
      soltar: "Las partículas empiezan a disolverse.",
      reconectar: "Las líneas comienzan a unirse.",
      sanar: "La escena respira más profundo.",
      claridad: "La escena se ilumina.",
      comunidad: "Aparecen más puntos, más cerca.",
      "volver-a-sentir": "La energía de la escena aumenta.",
      "empezar-de-nuevo": "Todo vuelve a empezar desde una sola luz.",
    };

    words.forEach((w) => {
      w.addEventListener("mouseenter", () => {
        words.forEach((o) => o.classList.remove("is-active"));
        w.classList.add("is-active");
        if (!field) return;
        const key = w.getAttribute("data-need");
        if (key === "soltar") field.setMode("disperse");
        else if (key === "empezar-de-nuevo") field.setMode("converge");
        else field.setMode("drift");
        if (responseEl) responseEl.textContent = RESPONSES[key] || "";
      });
      w.addEventListener("click", () => {
        section.querySelector("[data-need-followup]")?.classList.add("is-visible");
      });
    });

    section.addEventListener("mouseleave", () => {
      words.forEach((o) => o.classList.remove("is-active"));
      if (field) field.setMode("drift");
    });
  }

  /** Connection network canvas — five/eight nodes converging into a round. */
  function initConnectionNetwork() {
    const section = document.getElementById("connection");
    const canvas = section && section.querySelector("canvas");
    if (!canvas || !window.SoulParticles) return;
    const field = new window.SoulParticles.ParticleField(canvas, {
      color: "217, 199, 169",
      count: 60,
      connect: true,
      connectDist: 200,
    });
    field.start();

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const rect = canvas.getBoundingClientRect();
        const cx = rect.width / 2, cy = rect.height / 2;
        const r = Math.min(rect.width, rect.height) * 0.32;
        const nodeCount = 7;
        const points = [];
        for (let i = 0; i < nodeCount; i++) {
          const a = (i / nodeCount) * Math.PI * 2;
          points.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
        field.setTargets(points);
      });
    }, { threshold: 0.4 });
    io.observe(section);
  }

  /** Day-by-day rail: scroll activates each node, swaps the visible frame. */
  function initDayRail() {
    const rail = document.querySelector("[data-day-rail]");
    if (!rail) return;
    const nodes = rail.querySelectorAll("[data-day-node]");
    const frames = document.querySelectorAll("[data-day-frame]");

    function activate(index) {
      nodes.forEach((n, i) => {
        n.classList.toggle("is-active", i === index);
        if (i === index) n.setAttribute("aria-current", "step");
        else n.removeAttribute("aria-current");
      });
      frames.forEach((f, i) => f.classList.toggle("is-active", i === index));
    }

    nodes.forEach((node, i) => node.addEventListener("click", () => activate(i)));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) activate(Number(entry.target.getAttribute("data-index")));
        });
      },
      { threshold: 0.6 }
    );
    nodes.forEach((n) => io.observe(n));
    activate(0);
  }

  /** Practices — expand in place, no cards. Keyboard-operable: it's a
   *  role="button" div, so unlike a real <button> it won't fire "click" on
   *  Enter/Space by itself. */
  function initPractices() {
    const all = document.querySelectorAll("[data-practice]");
    function toggle(el) {
      const isOpen = el.classList.contains("is-open");
      all.forEach((o) => {
        o.classList.remove("is-open");
        o.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        el.classList.add("is-open");
        el.setAttribute("aria-expanded", "true");
      }
    }
    all.forEach((el) => {
      el.addEventListener("click", () => toggle(el));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          toggle(el);
        }
      });
    });
  }

  /** Guides — click opens a fullscreen editorial panel. Keyboard users get
   *  focus moved into the dialog, Escape to close, and focus restored to
   *  whichever card opened it — a modal that traps focus without ever
   *  giving it back strands keyboard and screen-reader users inside it. */
  function initGuides() {
    const overlay = document.querySelector("[data-guide-overlay]");
    if (!overlay) return;
    const nameEl = overlay.querySelector("[data-guide-name]");
    const storyEl = overlay.querySelector("[data-guide-story]");
    const wayEl = overlay.querySelector("[data-guide-way]");
    const closeBtn = overlay.querySelector("[data-guide-close]");
    let lastTrigger = null;

    function close() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      lastTrigger?.focus();
    }

    document.querySelectorAll("[data-guide-card]").forEach((card) => {
      card.addEventListener("click", () => {
        lastTrigger = card;
        nameEl.textContent = card.getAttribute("data-name") || "";
        storyEl.textContent = card.getAttribute("data-story") || "";
        wayEl.textContent = card.getAttribute("data-way") || "";
        overlay.classList.add("is-open");
        overlay.setAttribute("aria-hidden", "false");
        closeBtn?.focus();
      });
    });
    closeBtn?.addEventListener("click", close);
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  /** Magnetic pull for primary CTAs — subtle, never gamer-ish. */
  function initMagnetic() {
    if (window.matchMedia("(hover: none)").matches) return;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  function initSoundToggle() {
    const btn = document.querySelector("[data-sound-toggle]");
    const audio = document.querySelector("[data-ambient-audio]");
    if (!btn || !audio) return;
    btn.addEventListener("click", () => {
      const on = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!on));
      if (!on) audio.play().catch(() => {});
      else audio.pause();
    });
  }

  window.SoulInteractions = {
    initNav,
    initNeedScene,
    initConnectionNetwork,
    initDayRail,
    initPractices,
    initGuides,
    initMagnetic,
    initSoundToggle,
  };
})();
