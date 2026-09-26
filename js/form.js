/**
 * Ingresar al retiro — one question per screen, a thread of light for
 * progress instead of a percentage. Ends in "Connection Found" and a
 * WhatsApp handoff (rule 29–33). The free-text soul-searching answers stay
 * local to the browser tab; only name + why-now-category ride into the
 * WhatsApp message, since the real conversation happens there, not in a form
 * field (rule 32 — no unnecessary sensitive data in the prefilled message).
 */
(function () {
  "use strict";

  function init(getContact) {
    const form = document.querySelector("[data-intake-form]");
    if (!form) return;
    const steps = Array.from(form.querySelectorAll("[data-step]"));
    const progressPath = form.querySelector(".thread-progress");
    const pathLength = progressPath ? progressPath.getTotalLength() : 0;
    if (progressPath) {
      progressPath.style.strokeDasharray = String(pathLength);
      progressPath.style.strokeDashoffset = String(pathLength);
    }

    const answers = {};
    let current = 0;
    // Hidden until submit — inert so its WhatsApp link isn't Tab-reachable
    // before there's a story to hand off.
    document.querySelector("[data-connection-found]")?.setAttribute("inert", "");

    function paint(focus = true) {
      steps.forEach((s, i) => {
        const isActive = i === current;
        s.classList.toggle("is-active", isActive);
        // Inactive steps are already opacity:0/pointer-events:none, but
        // without `inert` their inputs stayed reachable by Tab — a
        // keyboard user could land in a screen's worth of invisible fields.
        if (isActive) s.removeAttribute("inert");
        else s.setAttribute("inert", "");
      });
      if (progressPath) {
        const pct = current / (steps.length - 1);
        progressPath.style.strokeDashoffset = String(pathLength * (1 - pct));
      }
      if (focus) {
        const active = steps[current];
        active?.querySelector("input, textarea, button[data-option]")?.focus({ preventScroll: true });
      }
    }

    function canAdvance(step) {
      const key = step.getAttribute("data-step");
      const type = step.getAttribute("data-step-type");
      if (type === "options") return Boolean(answers[key]);
      const field = step.querySelector("input, textarea");
      return !field || !field.hasAttribute("required") || field.value.trim().length > 0;
    }

    function goNext() {
      const step = steps[current];
      const field = step.querySelector("input, textarea");
      const key = step.getAttribute("data-step");
      if (field) answers[key] = field.value.trim();
      if (!canAdvance(step)) {
        step.classList.add("shake");
        setTimeout(() => step.classList.remove("shake"), 400);
        return;
      }
      if (current < steps.length - 1) {
        current += 1;
        paint();
      } else {
        submit();
      }
    }

    function goPrev() {
      if (current > 0) { current -= 1; paint(); }
    }

    steps.forEach((step) => {
      step.querySelectorAll("[data-option]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const key = step.getAttribute("data-step");
          answers[key] = btn.getAttribute("data-option");
          step.querySelectorAll("[data-option]").forEach((o) => o.classList.remove("is-selected"));
          btn.classList.add("is-selected");
          setTimeout(goNext, 260);
        });
      });
      step.querySelector("[data-next]")?.addEventListener("click", goNext);
      step.querySelector("[data-prev]")?.addEventListener("click", goPrev);
      step.querySelector("input, textarea")?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); goNext(); }
      });
    });

    function submit() {
      form.classList.add("is-complete");
      const found = document.querySelector("[data-connection-found]");
      found?.classList.add("is-visible");
      found?.removeAttribute("inert");
      found?.scrollIntoView({ behavior: "smooth" });

      const contact = getContact ? getContact() : {};
      const waLink = form.querySelector("[data-whatsapp-cta]");
      if (waLink) {
        const number = (contact.whatsapp_numero || "").replace(/[^\d]/g, "");
        const name = answers["1"] ? `Soy ${answers["1"]}. ` : "";
        const need = answers["2"] ? `Vengo a buscar: ${answers["2"]}. ` : "";
        const message = encodeURIComponent(
          `${name}${need}${contact.whatsapp_mensaje_precargado || "Quiero saber más sobre Soul Connection."}`
        );
        waLink.href = number
          ? `https://wa.me/${number}?text=${message}`
          : "#";
        if (!number) waLink.setAttribute("aria-disabled", "true");
      }
    }

    // Initial mount: set up step state without stealing focus from the page
    // the visitor just landed on.
    paint(false);
  }

  window.SoulForm = { init };
})();
