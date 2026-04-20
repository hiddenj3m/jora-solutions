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

  function setupTypingPlaceholder(input) {
    if (!input) return;

    const examples = [
      "www.example.com",
      "www.northstarstudio.com",
      "www.cleaningco.co.uk",
      "www.fitnessgrowth.io",
      "www.wholesalehub.com",
      "www.localbrand.co"
    ];

    if (reduceMotion) {
      input.placeholder = examples[0];
      return;
    }

    let exampleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const example = examples[exampleIndex];

      if (!input.value) {
        input.placeholder = example.slice(0, charIndex) || " ";
      }

      if (deleting) {
        charIndex -= 1;
      } else {
        charIndex += 1;
      }

      let delay = deleting ? 38 : 72;

      if (!deleting && charIndex > example.length) {
        deleting = true;
        delay = 1050;
      }

      if (deleting && charIndex < 0) {
        deleting = false;
        exampleIndex = (exampleIndex + 1) % examples.length;
        charIndex = 0;
        delay = 260;
      }

      window.setTimeout(tick, delay);
    }

    tick();
  }

  function setupAuditEntry() {
    const modal = document.querySelector("#auditModal");
    const urlForm = document.querySelector("[data-audit-url-form]");
    const urlInput = document.querySelector("[data-audit-url-input]");
    const visualTrigger = document.querySelector(".hero-visual-trigger[data-audit-open]");
    const auditEntry = document.querySelector(".hero-audit-entry");

    setupTypingPlaceholder(urlInput);

    if (!modal) return;

    const emailForm = modal.querySelector("[data-audit-email-form]");
    const emailInput = modal.querySelector("[data-audit-email]");
    const status = modal.querySelector("[data-audit-status]");
    const websiteLabel = modal.querySelector("[data-audit-website]");
    const websiteInput = modal.querySelector("[data-audit-website-input]");
    let previousFocus = null;
    let activeWebsite = "";

    function normalizeWebsite(value) {
      const raw = String(value || "").trim();
      if (!raw) return "";

      const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

      try {
        const parsed = new URL(candidate);
        if (!parsed.hostname.includes(".")) return "";
        return parsed.hostname.replace(/^www\./i, "www.");
      } catch (error) {
        return "";
      }
    }

    function openAuditModal(website) {
      activeWebsite = normalizeWebsite(website) || "";
      previousFocus = document.activeElement;

      if (websiteLabel) websiteLabel.textContent = activeWebsite || "your website";
      if (websiteInput) {
        websiteInput.value = activeWebsite;
        websiteInput.setCustomValidity("");
      }
      if (status) status.textContent = "";
      if (emailInput) emailInput.value = "";

      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
      window.setTimeout(() => (activeWebsite ? emailInput : websiteInput)?.focus(), 0);
    }

    function closeAuditModal() {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      setHeroGrowth(false);
      previousFocus?.focus?.();
    }

    function submitUrlForm(event) {
      event.preventDefault();

      const website = normalizeWebsite(urlInput?.value);

      if (!website) {
        urlInput?.setCustomValidity("Enter a valid website, for example www.example.com.");
        urlInput?.reportValidity();
        return;
      }

      urlInput?.setCustomValidity("");
      openAuditModal(website);
    }

    function handleVisualTriggerClick() {
      openAuditModal("");
    }

    function bindGrowthHover(element) {
      if (!element) return;

      element.addEventListener("pointerenter", () => setHeroGrowth(true));
      element.addEventListener("pointerleave", () => setHeroGrowth(false));
      element.addEventListener("focusin", () => setHeroGrowth(true));
      element.addEventListener("focusout", (event) => {
        if (!element.contains(event.relatedTarget)) setHeroGrowth(false);
      });
    }

    urlInput?.addEventListener("input", () => urlInput.setCustomValidity(""));
    urlForm?.addEventListener("submit", submitUrlForm);
    visualTrigger?.addEventListener("click", handleVisualTriggerClick);
    bindGrowthHover(visualTrigger);
    bindGrowthHover(auditEntry);

    emailForm?.addEventListener("submit", (event) => {
      event.preventDefault();

      const website = normalizeWebsite(websiteInput?.value);

      if (!website) {
        websiteInput?.setCustomValidity("Enter a valid website, for example www.example.com.");
        if (status) status.textContent = "Add the website you want us to review.";
        websiteInput?.reportValidity();
        return;
      }

      websiteInput?.setCustomValidity("");
      activeWebsite = website;
      if (websiteLabel) websiteLabel.textContent = activeWebsite;

      if (!emailForm.checkValidity()) {
        if (status) status.textContent = "Add a valid email and we will keep the next step clear.";
        emailForm.reportValidity();
        return;
      }

      if (status) {
        status.textContent = `Prototype note: ${activeWebsite || "your website"} is ready for review, but no backend is connected yet. The audit handoff can be wired here when the site goes live.`;
      }
    });

    websiteInput?.addEventListener("input", () => websiteInput.setCustomValidity(""));

    modal.querySelectorAll("[data-close-audit-modal]").forEach((button) => {
      button.addEventListener("click", closeAuditModal);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeAuditModal();
    });
  }

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

  function setupServiceBackdrop() {
    document.querySelectorAll(".service-showcase").forEach((showcase) => {
      const cards = showcase.querySelectorAll(".service-card[data-service]");

      function setActive(service) {
        if (service) showcase.dataset.activeService = service;
        else delete showcase.dataset.activeService;
      }

      cards.forEach((card) => {
        const service = card.dataset.service;

        card.addEventListener("pointerenter", () => setActive(service));
        card.addEventListener("pointerleave", () => setActive(""));
        card.addEventListener("focus", () => setActive(service));
        card.addEventListener("blur", () => setActive(""));
      });
    });
  }

  function setupProcessSteps() {
    const detailCopy = {
      diagnose: {
        title: "Diagnose the constraint",
        text: "We inspect search visibility, buyer journeys, page performance, offer clarity, and conversion signals to separate real growth constraints from noisy symptoms. The goal is a clear diagnosis your team can trust before anything gets built."
      },
      map: {
        title: "Map the commercial path",
        text: "We turn the diagnosis into a priority map that connects search intent, content depth, page journeys, and offer moments to the commercial outcomes that matter most. You see what should happen first, what can wait, and why."
      },
      build: {
        title: "Build the system",
        text: "We ship the pages, assets, technical fixes, content structures, and testing loops with enough partner context that every change supports the wider growth engine instead of becoming another isolated marketing task."
      },
      compound: {
        title: "Compound what works",
        text: "We read the signal, refine the next move, and turn proven improvements into a repeatable rhythm. The system gets sharper over time, so momentum compounds instead of resetting every quarter."
      }
    };

    document.querySelectorAll(".pipeline").forEach((pipeline) => {
      const buttons = Array.from(pipeline.querySelectorAll(".pipeline-step[data-step]"));
      const detailTitle = pipeline.querySelector("#process-detail-title");
      const detailText = pipeline.querySelector("#process-detail-text");
      if (!buttons.length) return;
      let activeStep = pipeline.dataset.activeStep || buttons[0].dataset.step;

      function renderDetail(step) {
        const content = detailCopy[step] || detailCopy.diagnose;
        if (detailTitle) detailTitle.textContent = content.title;
        if (detailText) detailText.textContent = content.text;
      }

      function setPreview(step) {
        if (step) {
          pipeline.dataset.previewStep = step;
          renderDetail(step);
        } else {
          delete pipeline.dataset.previewStep;
          renderDetail(activeStep);
        }
      }

      function activateStep(step) {
        activeStep = step;
        pipeline.dataset.activeStep = activeStep;

        buttons.forEach((button) => {
          button.setAttribute("aria-pressed", String(button.dataset.step === activeStep));
        });

        renderDetail(activeStep);
      }

      buttons.forEach((button) => {
        const step = button.dataset.step;

        button.addEventListener("click", () => activateStep(step));
        button.addEventListener("pointerenter", () => setPreview(step));
        button.addEventListener("pointerleave", () => setPreview(""));
        button.addEventListener("focus", () => setPreview(step));
        button.addEventListener("blur", () => setPreview(""));
      });

      activateStep(pipeline.dataset.activeStep || buttons[0].dataset.step);
    });
  }

  function setupBottomContactForm() {
    document.querySelectorAll("[data-bottom-contact-form]").forEach((form) => {
      const status = form.querySelector(".form-status");

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
          if (status) status.textContent = "Add your email and choose the service that feels closest.";
          form.reportValidity();
          return;
        }

        const service = new FormData(form).get("service") || "your growth system";
        if (status) {
          status.textContent = `Prototype note: we would reach out about ${service}, but no backend is connected yet.`;
        }
        form.reset();
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
  setupAuditEntry();
  setupTiltCards();
  setupServiceBackdrop();
  setupProcessSteps();
  setupBottomContactForm();
  setupRevealObserver();
  setupStoryModal();
  setupForm();
})();
