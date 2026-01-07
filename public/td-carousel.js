const prefersReducedMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

function setActiveDot(root, idx) {
  root.querySelectorAll("[data-dot]").forEach((dot, i) => {
    dot.classList.toggle("is-active", i === idx);
  });
}

function getIdxFromScroll(viewport) {
  const w = viewport.clientWidth || 1;
  return Math.round(viewport.scrollLeft / w);
}

function scrollToIdx(viewport, idx) {
  const w = viewport.clientWidth || 1;
  viewport.scrollTo({
    left: idx * w,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

function initCarousel(root) {
  const count = parseInt(root.getAttribute("data-count") || "1", 10);
  const viewport = root.querySelector(".tdc-viewport");
  if (!viewport || count < 2) return;

  let idx = 0;

  // Prev/Next
  root.querySelector(".tdc-prev")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    idx = (idx - 1 + count) % count;
    scrollToIdx(viewport, idx);
    setActiveDot(root, idx);
  });

  root.querySelector(".tdc-next")?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    idx = (idx + 1) % count;
    scrollToIdx(viewport, idx);
    setActiveDot(root, idx);
  });

  // Dots
  root.querySelectorAll("[data-dot]").forEach((dot, i) => {
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      idx = i;
      scrollToIdx(viewport, idx);
      setActiveDot(root, idx);
    });
  });

  // Scroll -> active dot
  let t;
  viewport.addEventListener(
    "scroll",
    () => {
      clearTimeout(t);
      t = setTimeout(() => {
        idx = Math.max(0, Math.min(count - 1, getIdxFromScroll(viewport)));
        setActiveDot(root, idx);
      }, 80);
    },
    { passive: true }
  );

  // Resize snap
  window.addEventListener(
    "resize",
    () => scrollToIdx(viewport, idx),
    { passive: true }
  );

  // --- Click vs Drag: wenn geswiped wurde, darf der <a> im Slide NICHT navigieren ---
  let downX = 0;
  let downY = 0;
  let dragging = false;

  viewport.addEventListener("pointerdown", (e) => {
    downX = e.clientX;
    downY = e.clientY;
    dragging = false;
  });

  viewport.addEventListener("pointermove", (e) => {
    if (Math.abs(e.clientX - downX) > 8 || Math.abs(e.clientY - downY) > 8) {
      dragging = true;
    }
  });

  // Capture-Phase: blockiert Link-Klick nach Drag
  viewport.addEventListener(
    "click",
    (e) => {
      if (!dragging) return;
      e.preventDefault();
      e.stopPropagation();
      dragging = false;
    },
    true
  );

  setActiveDot(root, idx);
}

function initAll() {
  document.querySelectorAll("[data-td-carousel]").forEach(initCarousel);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll, { once: true });
} else {
  initAll();
}
