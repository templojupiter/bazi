/**
 * The narrative engine. Scenes 01–04 (hero → body → breath/presence/soul →
 * connection) share one fixed WebGL canvas that the scroll transforms —
 * per the brief, the figure persists and the scroll rewrites it, rather than
 * each section owning its own background.
 */
(function () {
  "use strict";

  function initNarrative({ gsap, ScrollTrigger, sceneCtrl }) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stage = document.getElementById("scene-stage");

    // ---- Hero entrance (not scroll-linked: the arrival itself) ----------
    const heroTl = gsap.timeline({ delay: 0.3 });
    if (sceneCtrl) heroTl.call(() => sceneCtrl.formIn(reduced ? 0.2 : 4.5));
    heroTl
      .from("[data-hero-mark]", { opacity: 0, duration: 1.2 }, 1.4)
      .from("[data-hero-word]", { opacity: 0, y: 16, duration: 1.1, stagger: 0.15 }, 2.0)
      .from("[data-hero-sub]", { opacity: 0, y: 10, duration: 1, stagger: 0.12 }, 2.9)
      .from("[data-hero-lines] p", { opacity: 0, y: 8, duration: 1, stagger: 0.25 }, 3.4)
      .from("[data-hero-cta]", { opacity: 0, y: 8, duration: 1 }, 4.1)
      .from("[data-breathe-trigger]", { opacity: 0, duration: 1.2 }, 4.3);

    const breatheBtn = document.querySelector("[data-breathe-trigger]");
    if (breatheBtn && sceneCtrl) {
      breatheBtn.addEventListener("click", () => sceneCtrl.pulseBreath());
    }

    if (reduced || !gsap.plugins || true) {
      // ScrollTrigger is registered by main.js before calling this.
    }

    // ---- Keep the WebGL canvas visible only across scenes 01–04 ---------
    if (stage) {
      ScrollTrigger.create({
        trigger: "#hero",
        endTrigger: "#connection",
        start: "top top",
        end: "bottom bottom",
        onToggle: (self) => {
          gsap.to(stage, { opacity: self.isActive ? 1 : 0, duration: 1.2, ease: "power1.out" });
          if (sceneCtrl) self.isActive ? sceneCtrl.resume() : sceneCtrl.pause();
        },
      });
    }

    // ---- Scene 02 — THE BODY: subtle reveal + parallax -------------------
    ScrollTrigger.create({
      trigger: "#body-knows",
      start: "top 70%",
      onEnter: () => document.querySelector("#body-knows").classList.add("is-visible"),
      once: true,
    });
    if (!reduced) {
      gsap.utils.toArray("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
        gsap.to(el, {
          yPercent: speed * 100,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        });
      });
    }

    // ---- Scene 03 — the journey: llegar → pausar → ... → celebrar --------
    const words = gsap.utils.toArray("#bbps [data-word]");
    if (words.length) {
      const wordsTl = gsap.timeline({
        scrollTrigger: { trigger: "#bbps", start: "top top", end: `+=${words.length * 35}%`, scrub: 0.6, pin: true },
      });
      words.forEach((w, i) => {
        wordsTl.to(w, { opacity: 1, duration: 0.3 });
        if (sceneCtrl) wordsTl.call(() => sceneCtrl.setIntensity(1 + i * 0.25), null, "<");
        wordsTl.to(w, { opacity: 0, duration: 0.3 }, "+=0.4");
      });
      wordsTl.from("#bbps [data-manifesto]", { opacity: 0, y: 14, duration: 0.6 });
      wordsTl.to({}, { duration: 0.4 }); // hold
    }

    // ---- Scene 04 — CONNECTION: silhouette disperses into a network ------
    ScrollTrigger.create({
      trigger: "#connection",
      start: "top 60%",
      onEnter: () => sceneCtrl && sceneCtrl.setDispersion(1),
      onLeaveBack: () => sceneCtrl && sceneCtrl.setDispersion(0),
    });

    // ---- Generic content reveals for editorial sections -------------------
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        onEnter: () => el.classList.add("is-visible"),
        onEnterBack: () => el.classList.add("is-visible"),
      });
    });

    // ---- Final loop: one particle becomes the mark, again ----------------
    const finalStep = document.querySelectorAll("#final-loop [data-final-step]");
    if (finalStep.length) {
      const finalTl = gsap.timeline({
        scrollTrigger: { trigger: "#final-loop", start: "top 75%" },
      });
      finalStep.forEach((step, i) => {
        finalTl.to(step, { opacity: 1, y: 0, duration: 1 }, i * 0.5);
      });
    }
  }

  window.SoulScroll = { initNarrative };
})();
