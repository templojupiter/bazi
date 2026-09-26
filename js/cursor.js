/**
 * Custom cursor. Desktop only — disabled on touch (rule 12/40).
 * States come from data-cursor="explore|enter|connect|view" on any element.
 */
(function () {
  "use strict";
  const isCoarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (isCoarse) return;

  document.addEventListener("DOMContentLoaded", () => {
    const dot = document.createElement("div");
    dot.className = "cursor";
    const ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add("has-custom-cursor");

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });

    function raf() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(raf);
    }
    raf();

    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest("[data-cursor]");
      const state = target ? target.getAttribute("data-cursor") : "";
      dot.setAttribute("data-state", state);
      ring.setAttribute("data-state", state);
    });

    document.addEventListener("mouseout", (e) => {
      if (e.target.closest("[data-cursor]") && !e.relatedTarget?.closest?.("[data-cursor]")) {
        dot.removeAttribute("data-state");
        ring.removeAttribute("data-state");
      }
    });
  });
})();
