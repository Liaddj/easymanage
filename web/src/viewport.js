let started = false;

export function startViewportLock() {
  if (started || typeof window === "undefined") return;
  started = true;

  const root = document.documentElement;

  function apply() {
    const vv = window.visualViewport;
    const height = vv?.height || window.innerHeight || 0;
    const offset = vv?.offsetTop || 0;
    root.style.setProperty("--vvh", `${Math.round(height)}px`);
    root.style.setProperty("--vv-offset", `${Math.round(offset)}px`);
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0);
    }
  }

  apply();
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
  window.visualViewport?.addEventListener("resize", apply);
  window.visualViewport?.addEventListener("scroll", apply);

  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
    },
    { passive: true }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      if (canScroll(event.target)) return;
      event.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener("focusin", (event) => {
    const field = event.target;
    if (!(field instanceof HTMLElement)) return;
    if (!field.matches("input, textarea, select")) return;
    window.scrollTo(0, 0);
    apply();
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      const pane = field.closest(".content, .sheet");
      if (pane instanceof HTMLElement) {
        const top = field.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop - 12;
        pane.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    });
  });

  document.addEventListener("focusout", () => {
    window.scrollTo(0, 0);
    apply();
  });
}

function canScroll(target) {
  let node = target instanceof Element ? target : target?.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight - node.clientHeight > 1) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}
