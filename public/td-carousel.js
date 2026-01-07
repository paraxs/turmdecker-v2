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
  // idempotent
  if (root.dataset.tdcInit === "1") return;
  root.dataset.tdcInit = "1";

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
  window.addEventListener("resize", () => scrollToIdx(viewport, idx), {
    passive: true,
  });

  // --- Desktop Drag-to-Scroll ohne setPointerCapture (damit Links nicht sterben) ---
  let downX = 0;
  let downY = 0;
  let startScroll = 0;
  let active = false;
  let dragging = false;

  // Block click direkt nach Drag (weil click nach pointerup feuert)
  let blockClickUntil = 0;

  function onMove(e) {
    if (!active) return;

    const dx = e.clientX - downX;
    const dy = e.clientY - downY;

    // Drag erst ab klarer Schwelle aktivieren
    if (!dragging && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      dragging = true;
      viewport.classList.add("is-dragging");
    }

    if (dragging) {
      viewport.scrollLeft = startScroll - dx;
      e.preventDefault();
    }
  }

  function endDrag() {
    if (!active) return;

    active = false;
    window.removeEventListener("pointermove", onMove, true);
    window.removeEventListener("pointerup", endDrag, true);
    window.removeEventListener("pointercancel", endDrag, true);

    if (dragging) {
      blockClickUntil = performance.now() + 350;
    }

    dragging = false;
    viewport.classList.remove("is-dragging");
  }

  viewport.addEventListener("pointerdown", (e) => {
    // Touch: native scroll lassen
    if (e.pointerType === "touch") return;

    // Nur linker Mausbutton
    if (e.pointerType === "mouse" && e.button !== 0) return;

    active = true;
    dragging = false;

    downX = e.clientX;
    downY = e.clientY;
    startScroll = viewport.scrollLeft;

    // Global listener, damit Drag auch außerhalb sauber endet
    window.addEventListener("pointermove", onMove, true);
    window.addEventListener("pointerup", endDrag, true);
    window.addEventListener("pointercancel", endDrag, true);
  });

  // Capture: blockiert Link-Klick nur direkt nach echtem Drag
  viewport.addEventListener(
    "click",
    (e) => {
      if (performance.now() < blockClickUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  setActiveDot(root, idx);
}

function initAll() {
  document.querySelectorAll("[data-td-carousel]").forEach(initCarousel);
}

// Initial load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll, { once: true });
} else {
  initAll();
}

// Astro ViewTransitions / Soft-Navigation: re-init
document.addEventListener("astro:page-load", initAll);
document.addEventListener("astro:after-swap", initAll);
