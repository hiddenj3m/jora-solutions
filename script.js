(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = document.querySelector(".hero, .page-hero");
  const particles = document.querySelector("#particles");
  const finalCta = document.querySelector(".final-cta");

  function setupActiveNav() {
    const page = document.body?.dataset?.page;
    if (!page) return;

    document.querySelectorAll("[data-page-link]").forEach((link) => {
      const isActive = link.dataset.pageLink === page;
      link.classList.toggle("active", isActive);

      if (isActive) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function setupTheme() {
    const root = document.documentElement;
    const toggle = document.querySelector(".theme-toggle");
    const label = document.querySelector(".theme-toggle-text");
    const systemPrefersLight = window.matchMedia("(prefers-color-scheme: light)");
    let storedTheme = null;

    try {
      storedTheme = window.localStorage.getItem("jora-theme");
    } catch (error) {
      storedTheme = null;
    }

    function applyTheme(theme, persist) {
      const nextTheme = theme === "light" ? "light" : "dark";
      root.dataset.theme = nextTheme;

      if (toggle) {
        const isLight = nextTheme === "light";
        toggle.setAttribute("aria-pressed", String(isLight));
        toggle.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} mode`);
      }

      if (label) {
        label.textContent = nextTheme === "light" ? "Light" : "Dark";
      }

      if (persist) {
        try {
          window.localStorage.setItem("jora-theme", nextTheme);
        } catch (error) {
          // Persistence is progressive enhancement; the toggle still works without it.
        }
      }
    }

    applyTheme(storedTheme || (systemPrefersLight.matches ? "light" : "dark"), false);

    toggle?.addEventListener("click", () => {
      applyTheme(root.dataset.theme === "light" ? "dark" : "light", true);
    });

    systemPrefersLight.addEventListener?.("change", (event) => {
      try {
        if (window.localStorage.getItem("jora-theme")) return;
      } catch (error) {
        // If localStorage is unavailable, keep following system preference.
      }

      applyTheme(event.matches ? "light" : "dark", false);
    });
  }

  function createParticles() {
    if (!particles || reduceMotion) return;

    const count = window.innerWidth < 720 ? 34 : 76;
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement("span");
      particle.className = "particle";
      particle.style.setProperty("--x", `${Math.random() * 100}%`);
      particle.style.setProperty("--y", `${Math.random() * 125}%`);
      particle.style.setProperty("--size", `${Math.random() * 2.4 + 1}px`);
      particle.style.setProperty("--delay", `${Math.random() * -18}s`);
      particle.style.setProperty("--duration", `${Math.random() * 14 + 16}s`);
      particle.style.setProperty("--drift-x", `${(Math.random() - 0.5) * 180}px`);
      fragment.appendChild(particle);
    }

    particles.appendChild(fragment);
  }

  function setHeroGrowth(active) {
    hero?.classList.toggle("growth-active", active);
    particles?.classList.toggle("accelerate", active);
  }

  document.querySelectorAll(".growth-trigger").forEach((trigger) => {
    const isFinalTrigger = Boolean(trigger.closest(".final-cta"));

    trigger.addEventListener("pointerenter", () => {
      if (isFinalTrigger) finalCta?.classList.add("growth-active");
      else setHeroGrowth(true);
    });

    trigger.addEventListener("pointerleave", () => {
      if (isFinalTrigger) finalCta?.classList.remove("growth-active");
      else setHeroGrowth(false);
    });

    trigger.addEventListener("focus", () => {
      if (isFinalTrigger) finalCta?.classList.add("growth-active");
      else setHeroGrowth(true);
    });

    trigger.addEventListener("blur", () => {
      if (isFinalTrigger) finalCta?.classList.remove("growth-active");
      else setHeroGrowth(false);
    });
  });

  function setupTiltCards() {
    if (reduceMotion) return;

    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        card.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  function animateCounter(counter) {
    if (counter.dataset.animated === "true") return;
    counter.dataset.animated = "true";

    const target = Number(counter.dataset.countTo || 0);
    if (reduceMotion) {
      counter.textContent = String(target);
      return;
    }

    const duration = 1100;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = String(Math.round(target * eased));

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function setupRevealObserver() {
    const revealItems = document.querySelectorAll(".reveal, .line-draw, .pipeline, .metric-card");

    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("in-view"));
      document.querySelectorAll(".counter").forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("in-view");
        entry.target.querySelectorAll?.(".line-draw").forEach((line) => line.classList.add("in-view"));
        entry.target.querySelectorAll?.(".counter").forEach(animateCounter);

        if (entry.target.classList.contains("counter")) {
          animateCounter(entry.target);
        }
      });
    }, {
      threshold: 0.22,
      rootMargin: "0px 0px -8% 0px"
    });

    revealItems.forEach((item) => observer.observe(item));
    document.querySelectorAll(".counter").forEach((counter) => observer.observe(counter));
  }

  function setupStoryModal() {
    const modal = document.querySelector("#storyModal");
    if (!modal) return;

    const name = modal.querySelector("#modalName");
    const role = modal.querySelector("#modalRole");
    const quote = modal.querySelector("#modalQuote");
    const closeButton = modal.querySelector(".modal-close");
    let previousFocus = null;

    function openModal(button) {
      previousFocus = document.activeElement;
      name.textContent = button.dataset.name || "Client story";
      role.textContent = button.dataset.role || "";
      quote.textContent = button.dataset.quote || "";
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
      closeButton.focus();
    }

    function closeModal() {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      previousFocus?.focus?.();
    }

    document.querySelectorAll(".story").forEach((button) => {
      button.addEventListener("click", () => openModal(button));
    });

    modal.querySelectorAll("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  function setupForm() {
    document.querySelectorAll(".growth-form").forEach((form) => {
      const status = form.querySelector(".form-status");
      if (!status) return;

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
          status.textContent = "Add your details above and we will keep the next step clear.";
          form.reportValidity();
          return;
        }

        status.textContent = "Prototype note: the form is validated, but no backend is connected yet. The growth-plan handoff can be wired here when the site goes live.";
        form.reset();
        finalCta?.classList.add("growth-active");
        window.setTimeout(() => finalCta?.classList.remove("growth-active"), reduceMotion ? 0 : 1200);
      });
    });
  }

  setupActiveNav();
  setupTheme();
  createParticles();
  setupTiltCards();
  setupRevealObserver();
  setupStoryModal();
  setupForm();
})();
