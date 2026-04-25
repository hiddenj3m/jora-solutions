(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = document.querySelector("#index3-jora-scene");

  if (!scene || reduceMotion) return;

  const root = document.documentElement;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function ease(progress) {
    return 1 - Math.pow(1 - progress, 3);
  }

  function updateScene() {
    const rect = scene.getBoundingClientRect();
    const travel = Math.max(scene.offsetHeight - window.innerHeight, 1);
    const progress = clamp((-rect.top) / travel, 0, 1);
    const eased = ease(progress);
    const introProgress = ease(clamp(progress / 0.18, 0, 1));
    const suffixProgress = ease(clamp((progress - 0.14) / 0.4, 0, 1));
    const photoProgress = ease(clamp((progress - 0.1) / 0.32, 0, 1));
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const lateral = clamp(viewportWidth * 0.19, 132, 292);
    const vertical = clamp(viewportHeight * 0.13, 62, 118);
    const spread = clamp(viewportWidth * 0.018, 10, 26);

    scene.style.setProperty("--jo-x", `${Math.round((lateral + spread) * eased)}px`);
    scene.style.setProperty("--jo-y", `${Math.round(vertical * eased)}px`);
    scene.style.setProperty("--ra-x", `${Math.round((lateral - spread) * eased)}px`);
    scene.style.setProperty("--ra-y", `${Math.round(vertical * eased)}px`);
    scene.style.setProperty("--jora-progress", eased.toFixed(3));
    scene.style.setProperty("--jora-drop", `${Math.round((1 - introProgress) * -72)}px`);
    scene.style.setProperty("--suffix-opacity", suffixProgress.toFixed(3));
    scene.style.setProperty("--suffix-slide", `${Math.round((1 - suffixProgress) * 22)}px`);
    scene.style.setProperty("--photo-opacity", photoProgress.toFixed(3));

    if (eased > 0.02) scene.classList.add("is-ready");
    else scene.classList.remove("is-ready");
  }

  let ticking = false;

  function requestUpdate() {
    if (ticking) return;
    ticking = true;

    window.requestAnimationFrame(() => {
      updateScene();
      ticking = false;
    });
  }

  scene.classList.add("is-ready");
  updateScene();

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("load", requestUpdate);

  if (root?.fonts?.ready) {
    root.fonts.ready.then(requestUpdate).catch(() => {});
  }
})();
