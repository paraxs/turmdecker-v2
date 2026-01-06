if (!window.__tdCarouselInit) {
  window.__tdCarouselInit = true;

  const prefersReduced = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = new Map();

  function setActiveDot(uid, idx) {
    const s = state.get(uid);
    if (!s) return;
    s.dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
  }

  function go(uid, dir) {
    const s = state.get(uid);
    if (!s) return;

    const w = s.viewport.clientWidth || 1;
    const next = (s.idx + dir + s.count) % s.count;

    s.idx = next;
    s.viewport.scrollTo({
      left: next * w,
      behavior: prefersReduced() ? "auto" : "smooth",
    });
    setActiveDot(uid, next);

    // Sync: alle Carousels springen auf denselben Index
    syncStep(next);
  }

  function syncStep(idx) {
    state.forEach((s) => {
      if (!s || s.count < 2) return;
      const w = s.viewport.clientWidth || 1;
      const clamped = idx % s.count;
      s.idx = clamped;
      s.viewport.scrollTo({ left: clamped * w, behavior: "auto" });
      setActiveDot(s.uid, clamped);
    });
  }

  function attachTapToOpen(viewport, href) {
    if (!viewport || !href) return;

    let down = null;
    let lastNavAt = 0;

    // robustes Fallback: Click (wird bei echtem Scroll/Drag i.d.R. nicht ausgelöst)
    viewport.addEventListener("click", () => {
      const now = performance.now();
      if (now - lastNavAt < 400) return;
      window.location.assign(href);
    });

    viewport.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;

        down = {
          x: e.clientX,
          y: e.clientY,
          t: performance.now(),
          scrollLeft: viewport.scrollLeft,
        };
      },
      { passive: true }
    );

    viewport.addEventListener(
      "pointerup",
      (e) => {
        if (!down) return;

        const dx = Math.abs(e.clientX - down.x);
        const dy = Math.abs(e.clientY - down.y);
        const dt = performance.now() - down.t;
        const dScroll = Math.abs(viewport.scrollLeft - down.scrollLeft);

        down = null;

        // WICHTIG: Schwellen lockerer wegen Scroll-Snap “Mikro-Bewegung”
        if (dx <= 12 && dy <= 12 && dScroll <= 24 && dt < 600) {
          lastNavAt = performance.now();
          window.location.assign(href);
        }
      },
      { passive: true }
    );

    viewport.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        window.location.assign(href);
      }
    });
  }

  function init() {
    document.querySelectorAll("[data-td-carousel]").forEach((root) => {
      const uid = root.getAttribute("data-uid");
      const count = Number(root.getAttribute("data-count") || "0");
      const href = root.getAttribute("data-href") || "";

      const viewport = root.querySelector(".tdc-viewport");
      const prev = root.querySelector(".tdc-prev");
      const next = root.querySelector(".tdc-next");
      const dots = Array.from(root.querySelectorAll("[data-dot]"));

      if (!uid || !viewport || !count || count < 2) return;

      if (!state.has(uid)) {
        state.set(uid, { uid, idx: 0, count, viewport, dots, href });
      } else {
        const s = state.get(uid);
        s.viewport = viewport;
        s.dots = dots;
        s.count = count;
        s.href = href;
      }

      prev && prev.addEventListener("click", (e) => { e.stopPropagation(); go(uid, -1); });
      next && next.addEventListener("click", (e) => { e.stopPropagation(); go(uid, +1); });

      dots.forEach((d) => {
        d.addEventListener("click", (e) => {
          e.stopPropagation();
          const s = state.get(uid);
          if (!s) return;
          const idx = Number(d.getAttribute("data-dot") || "0");
          s.idx = idx;
          const w = s.viewport.clientWidth || 1;
          s.viewport.scrollTo({ left: idx * w, behavior: prefersReduced() ? "auto" : "smooth" });
          setActiveDot(uid, idx);
          syncStep(idx);
        });
      });

      attachTapToOpen(viewport, href);

      // Scroll -> active dot aktualisieren
      let raf = 0;
      viewport.addEventListener(
        "scroll",
        () => {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            const s = state.get(uid);
            if (!s) return;
            const w = s.viewport.clientWidth || 1;
            const idx = Math.round(s.viewport.scrollLeft / w);
            if (idx !== s.idx) {
              s.idx = idx;
              setActiveDot(uid, idx);
            }
          });
        },
        { passive: true }
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("resize", () => {
    state.forEach((s) => {
      const w = s.viewport.clientWidth || 1;
      s.viewport.scrollTo({ left: s.idx * w, behavior: "auto" });
    });
  });
}
