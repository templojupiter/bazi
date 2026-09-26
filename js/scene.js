/**
 * Hero scene — Three.js particle field that breathes into a human silhouette.
 * Not a 3D model: an abstract figure made of light, sampled from a 2D
 * silhouette drawn on an offscreen canvas. This is the one place WebGL earns
 * its cost (rule 03/37); everything else uses the lighter 2D field.
 */
(function (global) {
  "use strict";

  function buildSilhouettePoints(count) {
    const w = 480, h = 640;
    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const ctx = off.getContext("2d");
    ctx.fillStyle = "#fff";

    // Abstract standing figure: head, torso, arms softly open, legs — no
    // anatomical detail, just a silhouette the eye reads as "a body of light".
    ctx.beginPath();
    ctx.ellipse(w / 2, 96, 46, 54, 0, 0, Math.PI * 2); // head
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w / 2 - 70, 190);
    ctx.quadraticCurveTo(w / 2, 150, w / 2 + 70, 190); // shoulders
    ctx.quadraticCurveTo(w / 2 + 100, 320, w / 2 + 40, 420); // right side to hip
    ctx.quadraticCurveTo(w / 2 + 30, 470, w / 2 + 46, 600); // right leg
    ctx.quadraticCurveTo(w / 2, 620, w / 2 - 46, 600); // feet
    ctx.quadraticCurveTo(w / 2 - 30, 470, w / 2 - 40, 420); // left leg
    ctx.quadraticCurveTo(w / 2 - 100, 320, w / 2 - 70, 190); // left side
    ctx.closePath();
    ctx.fill();

    // arms softly away from body, like mid-gesture
    ctx.beginPath();
    ctx.ellipse(w / 2 - 118, 260, 22, 90, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w / 2 + 118, 260, 22, 90, 0.35, 0, Math.PI * 2);
    ctx.fill();

    const img = ctx.getImageData(0, 0, w, h).data;
    const candidates = [];
    for (let y = 0; y < h; y += 3) {
      for (let x = 0; x < w; x += 3) {
        const a = img[(y * w + x) * 4 + 3];
        if (a > 128) candidates.push({ x: (x - w / 2) / 60, y: (h / 2 - y) / 60 });
      }
    }
    const points = [];
    for (let i = 0; i < count; i++) {
      points.push(candidates[Math.floor((i / count) * candidates.length)] || { x: 0, y: 0 });
    }
    return points;
  }

  function init(canvas) {
    const THREE = global.THREE;
    if (!THREE) return null;

    const tier = (global.SoulParticles && global.SoulParticles.qualityTier()) || "medium";
    const COUNTS = { minimal: 250, low: 700, medium: 1600, high: 2800 };
    const count = COUNTS[tier];

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 9;

    const targets = buildSilhouettePoints(count);
    const positions = new Float32Array(count * 3);
    const scatter = new Float32Array(count * 3);
    const target = new Float32Array(count * 3);
    const seed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const t = targets[i];
      target[i * 3] = t.x;
      target[i * 3 + 1] = t.y;
      target[i * 3 + 2] = (Math.random() - 0.5) * 0.6;

      const radius = 6 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      scatter[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      scatter[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      scatter[i * 3 + 2] = radius * Math.cos(phi) * 0.4;

      positions[i * 3] = scatter[i * 3];
      positions[i * 3 + 1] = scatter[i * 3 + 1];
      positions[i * 3 + 2] = scatter[i * 3 + 2];
      seed[i] = Math.random() * 1000;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color("#c9a96a"),
      size: tier === "high" ? 0.045 : 0.06,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const state = {
      formation: 0, // 0 = scattered, 1 = fully formed silhouette
      dispersion: 0, // scroll-driven: 0 formed, 1 dispersed into network
      intensity: 1,
      speed: 1,
      breath: 0,
      paused: false,
    };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();

    function animate() {
      if (state.paused) return;
      requestAnimationFrame(animate);
      const t = clock.getElapsedTime() * state.speed;
      const posAttr = geometry.attributes.position;
      const arr = posAttr.array;

      for (let i = 0; i < count; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
        const driftX = Math.sin(t * 0.3 + seed[i]) * 0.05;
        const driftY = Math.cos(t * 0.25 + seed[i]) * 0.05;

        const formed = target[ix] + driftX;
        const formedY = target[iy] + driftY;
        const scatterX = scatter[ix] + Math.sin(t * 0.15 + seed[i]) * 0.3;
        const scatterY = scatter[iy] + Math.cos(t * 0.12 + seed[i]) * 0.3;

        const mix = state.formation * (1 - state.dispersion);
        arr[ix] += ((formed * mix + scatterX * (1 - mix)) - arr[ix]) * 0.04;
        arr[iy] += ((formedY * mix + scatterY * (1 - mix)) - arr[iy]) * 0.04;
        arr[iz] += (target[iz] * mix - arr[iz]) * 0.04;
      }
      posAttr.needsUpdate = true;

      const breathScale = 1 + Math.sin(t * (Math.PI / 5)) * 0.03 * state.breath;
      points.scale.setScalar(breathScale);
      points.rotation.y = Math.sin(t * 0.05) * 0.15;
      material.opacity = 0.85 * state.intensity;

      renderer.render(scene, camera);
    }
    animate();

    return {
      formIn(duration = 3.5) {
        global.gsap && global.gsap.to(state, { formation: 1, breath: 1, duration, ease: "power2.out" });
        if (!global.gsap) { state.formation = 1; state.breath = 1; }
      },
      setDispersion(v, duration = 1.6) {
        if (global.gsap) global.gsap.to(state, { dispersion: v, duration, ease: "power2.inOut" });
        else state.dispersion = v;
      },
      setIntensity(v, duration = 1.2) {
        if (global.gsap) global.gsap.to(state, { intensity: v, duration });
        else state.intensity = v;
      },
      setSpeed(v, duration = 1.2) {
        if (global.gsap) global.gsap.to(state, { speed: v, duration });
        else state.speed = v;
      },
      pulseBreath() {
        if (!global.gsap) return;
        global.gsap.timeline()
          .to(points.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 4, ease: "sine.inOut" })
          .to(points.scale, { x: 1, y: 1, z: 1, duration: 6, ease: "sine.inOut" });
      },
      pause() { state.paused = true; },
      resume() { if (state.paused) { state.paused = false; animate(); } },
    };
  }

  global.SoulScene = { init };
})(window);
