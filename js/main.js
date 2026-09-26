/**
 * Orchestration. Loads data/retiro.json (the single source of truth),
 * populates every data-field in the DOM, and wires up the modules.
 * The HTML already contains "[COMPLETAR]" as a working default, so the site
 * is fully open-able even before the JSON is filled in or if fetch fails
 * (e.g. opened via file:// without a local server).
 */
(function () {
  "use strict";

  const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let RETIRO_DATA = null;

  function setField(root, key, value) {
    root.querySelectorAll(`[data-field="${key}"]`).forEach((el) => {
      if (value === undefined || value === null || value === "") return;
      el.textContent = value;
    });
  }

  function applyData(data) {
    if (!data) return;
    setField(document, "fecha", data.retiro?.fecha);
    setField(document, "duracion", data.retiro?.duracion);
    setField(document, "ubicacion", data.retiro?.ubicacion);
    setField(document, "lugar_descripcion", data.retiro?.lugar_descripcion);
    setField(document, "inversion_monto", data.inversion?.monto);
    setField(document, "inversion_sena", data.inversion?.sena);
    setField(document, "inversion_cupos", data.inversion?.cupos);
    setField(document, "instagram_handle", data.contacto?.instagram_handle);

    const pagos = document.querySelector('[data-field="formas_de_pago"]');
    if (pagos && data.inversion?.formas_de_pago?.length) {
      pagos.textContent = data.inversion.formas_de_pago.join(" · ");
    }

    const instaLink = document.querySelector('[data-field="instagram_url"]');
    if (instaLink && data.contacto?.instagram_url && data.contacto.instagram_url !== "[COMPLETAR]") {
      instaLink.href = data.contacto.instagram_url;
    }

    document.querySelectorAll('a[data-field="email"]').forEach((el) => {
      if (data.contacto?.email && data.contacto.email !== "[COMPLETAR]") {
        el.href = `mailto:${data.contacto.email}`;
      }
    });

    if (data.facilitadores?.length) {
      setField(document, "facilitadores", data.facilitadores.map((g) => g.nombre).filter(Boolean).join(" · "));
    }

    // Programa (day by day) — only replace copy where real data exists.
    (data.programa || []).forEach((day, i) => {
      const frame = document.querySelector(`[data-day-frame][data-index="${i}"]`);
      if (frame && day.descripcion && day.descripcion !== "[COMPLETAR]") {
        frame.querySelector("[data-day-desc]").textContent = day.descripcion;
      }
    });

    // Prácticas descriptions
    (data.practicas || []).forEach((p) => {
      const el = document.querySelector(`[data-practice-desc="${p.nombre}"]`);
      if (el && p.descripcion && p.descripcion !== "[COMPLETAR]") el.textContent = p.descripcion;
    });

    // Facilitadores — only render cards if real people were provided.
    const guidesGrid = document.querySelector("[data-guides-grid]");
    if (guidesGrid && data.facilitadores?.length) {
      guidesGrid.innerHTML = "";
      data.facilitadores.forEach((g) => {
        const card = document.createElement("button");
        card.className = "guide-card";
        card.setAttribute("data-guide-card", "");
        card.setAttribute("data-name", g.nombre || "");
        card.setAttribute("data-story", g.historia || "");
        card.setAttribute("data-way", g.forma_de_acompanar || "");
        card.setAttribute("data-cursor", "view");
        card.innerHTML = `<span class="guide-name serif">${g.nombre || ""}</span><span class="guide-line">${g.frase || ""}</span>`;
        guidesGrid.appendChild(card);
      });
    }

    // Testimonios — render only if real ones exist. Never fabricate (rule 27/46).
    const testiWrap = document.querySelector("[data-testimonials]");
    if (testiWrap) {
      if (data.testimonios?.length) {
        testiWrap.innerHTML = "";
        data.testimonios.forEach((t) => {
          const fig = document.createElement("figure");
          fig.className = "testimonial";
          fig.innerHTML = `<blockquote class="serif">&ldquo;${t.frase}&rdquo;</blockquote><figcaption>— ${t.nombre || ""}${t.lugar ? ", " + t.lugar : ""}</figcaption>`;
          testiWrap.appendChild(fig);
        });
      }
    }

    // WhatsApp fab + Hablemos CTA
    const number = (data.contacto?.whatsapp_numero || "").replace(/[^\d]/g, "");
    const message = encodeURIComponent(data.contacto?.whatsapp_mensaje_precargado || "Hola, quiero saber más.");
    document.querySelectorAll("[data-whatsapp-link]").forEach((a) => {
      if (number) a.href = `https://wa.me/${number}?text=${message}`;
      else a.setAttribute("aria-disabled", "true");
    });
  }

  async function loadData() {
    try {
      const res = await fetch("data/retiro.json", { cache: "no-store" });
      if (!res.ok) throw new Error("no json");
      RETIRO_DATA = await res.json();
      applyData(RETIRO_DATA);
    } catch (err) {
      // Static [COMPLETAR] placeholders already in the HTML stand in.
      console.info("Soul Connection: usando placeholders — sirve el sitio por HTTP para leer data/retiro.json");
    }
  }

  function initHeroScene() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return null;
    if (REDUCED_MOTION) {
      canvas.closest("#scene-stage")?.classList.add("is-static");
      return null;
    }
    return window.SoulScene ? window.SoulScene.init(canvas) : null;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    document.documentElement.classList.add("js-ready");

    // If the CDN scripts (GSAP/ScrollTrigger) didn't load — blocked network,
    // offline, ad blocker — fall back to a static narrative instead of
    // leaving scroll-driven elements permanently invisible.
    const hasMotionLibs = Boolean(window.gsap && window.ScrollTrigger);
    if (!hasMotionLibs || REDUCED_MOTION) {
      document.documentElement.classList.add("no-motion-lib");
    }

    await loadData();

    const sceneCtrl = initHeroScene();

    window.SoulInteractions?.initNav();
    window.SoulInteractions?.initNeedScene();
    window.SoulInteractions?.initConnectionNetwork();
    window.SoulInteractions?.initDayRail();
    window.SoulInteractions?.initPractices();
    window.SoulInteractions?.initGuides();
    window.SoulInteractions?.initMagnetic();
    window.SoulInteractions?.initSoundToggle();

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      window.SoulScroll?.initNarrative({ gsap, ScrollTrigger, sceneCtrl });
    }

    window.SoulForm?.init(() => RETIRO_DATA?.contacto || {});

    // Final loop → back to the beginning.
    document.querySelector("[data-loop-restart]")?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("hero")?.scrollIntoView({ behavior: REDUCED_MOTION ? "auto" : "smooth" });
    });
  });
})();
