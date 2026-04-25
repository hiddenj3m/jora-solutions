(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setupDrawer() {
    const root = document.documentElement;
    const body = document.body;
    const shell = document.querySelector("[data-index3-drawer-shell]");
    const panel = document.querySelector("[data-index3-drawer]");
    const menuButton = document.querySelector("[data-index3-menu-toggle]");
    const overlay = document.querySelector("[data-index3-drawer-overlay]");
    const closeButton = document.querySelector("[data-index3-drawer-close]");
    const headerThemeToggle = document.querySelector(".site-header .theme-toggle");
    const drawerThemeToggle = document.querySelector(".index3-drawer-theme-toggle");

    if (!shell || !panel || !menuButton) return;

    let closeTimer = 0;

    function themeName() {
      return root.dataset.theme === "light" ? "light" : "dark";
    }

    function syncToggle(button) {
      if (!button) return;

      const label = button.querySelector(".theme-toggle-text");
      const isLight = themeName() === "light";
      button.setAttribute("aria-pressed", String(isLight));
      button.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} mode`);
      if (label) label.textContent = isLight ? "Light" : "Dark";
    }

    function hasVisibleModal() {
      return Array.from(document.querySelectorAll(".modal")).some((modal) => !modal.hidden);
    }

    function setOpen(open) {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = 0;
      }

      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      panel.setAttribute("aria-hidden", String(!open));

      if (open) {
        shell.hidden = false;
        body.classList.add("no-scroll");
        window.requestAnimationFrame(() => shell.classList.add("is-open"));
        return;
      }

      shell.classList.remove("is-open");
      if (!hasVisibleModal()) body.classList.remove("no-scroll");
      closeTimer = window.setTimeout(() => {
        shell.hidden = true;
      }, 320);
    }

    menuButton.addEventListener("click", () => {
      setOpen(!shell.classList.contains("is-open"));
    });

    overlay?.addEventListener("click", () => setOpen(false));
    closeButton?.addEventListener("click", () => setOpen(false));
    panel.querySelectorAll("a[href]").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    drawerThemeToggle?.addEventListener("click", () => {
      headerThemeToggle?.click();
      syncToggle(drawerThemeToggle);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && shell.classList.contains("is-open")) {
        setOpen(false);
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 960 && shell.classList.contains("is-open")) {
        setOpen(false);
      }
    });

    syncToggle(drawerThemeToggle);

    if ("MutationObserver" in window) {
      const observer = new MutationObserver(() => {
        syncToggle(drawerThemeToggle);
      });

      observer.observe(root, {
        attributes: true,
        attributeFilter: ["data-theme"]
      });
    }
  }

  function setupJoraScene() {
    const scene = document.querySelector("#index3-jora-scene");
    if (!scene) return;

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function ease(progress) {
      return 1 - Math.pow(1 - progress, 3);
    }

    if (reduceMotion) {
      scene.classList.add("is-ready");
      scene.style.setProperty("--definition-opacity", "1");
      scene.style.setProperty("--definition-y", "0px");
      scene.style.setProperty("--jora-drop", "0px");
      scene.style.setProperty("--suffix-opacity", "1");
      scene.style.setProperty("--suffix-slide", "0px");
      scene.style.setProperty("--photo-opacity", "0");
      return;
    }

    function updateScene() {
      const rect = scene.getBoundingClientRect();
      const travel = Math.max(scene.offsetHeight - window.innerHeight, 1);
      const progress = clamp((-rect.top) / travel, 0, 1);
      const eased = ease(progress);
      const introProgress = ease(clamp(progress / 0.22, 0, 1));
      const definitionProgress = ease(clamp(progress / 0.12, 0, 1));
      const suffixProgress = ease(clamp((progress - 0.16) / 0.38, 0, 1));
      const photoProgress = ease(clamp((progress - 0.14) / 0.28, 0, 1));
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth <= 620;
      const isCompact = viewportWidth <= 960;

      const lateral = isMobile
        ? clamp(viewportWidth * 0.102, 38, 82)
        : isCompact
          ? clamp(viewportWidth * 0.138, 78, 160)
          : clamp(viewportWidth * 0.19, 132, 292);
      const vertical = isMobile
        ? clamp(viewportHeight * 0.075, 26, 52)
        : isCompact
          ? clamp(viewportHeight * 0.095, 40, 76)
          : clamp(viewportHeight * 0.13, 62, 118);
      const spread = isMobile
        ? clamp(viewportWidth * 0.01, 4, 10)
        : isCompact
          ? clamp(viewportWidth * 0.013, 8, 16)
          : clamp(viewportWidth * 0.018, 10, 26);
      const introLift = isMobile ? 38 : isCompact ? 52 : 68;

      scene.style.setProperty("--jo-x", `${Math.round((lateral + spread) * eased)}px`);
      scene.style.setProperty("--jo-y", `${Math.round(vertical * eased)}px`);
      scene.style.setProperty("--ra-x", `${Math.round((lateral - spread) * eased)}px`);
      scene.style.setProperty("--ra-y", `${Math.round(vertical * eased)}px`);
      scene.style.setProperty("--jora-progress", eased.toFixed(3));
      scene.style.setProperty("--jora-drop", `${Math.round((1 - introProgress) * -introLift)}px`);
      scene.style.setProperty("--definition-opacity", `${(1 - definitionProgress).toFixed(3)}`);
      scene.style.setProperty("--definition-y", `${Math.round(definitionProgress * 18)}px`);
      scene.style.setProperty("--suffix-opacity", suffixProgress.toFixed(3));
      scene.style.setProperty("--suffix-slide", `${Math.round((1 - suffixProgress) * 20)}px`);
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

    if (document.fonts?.ready) {
      document.fonts.ready.then(requestUpdate).catch(() => {});
    }
  }

  setupDrawer();
  setupJoraScene();
})();
