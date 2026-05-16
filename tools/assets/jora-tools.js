(function () {
  const moneyFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const moneyFormatterExact = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function safeDivide(numerator, denominator, fallback = 0) {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return fallback;
    }

    return numerator / denominator;
  }

  function readNumber(form, name, fallback = 0) {
    const field = form.elements[name];
    if (!field) return fallback;

    const value = parseFloat(field.value);
    return Number.isFinite(value) ? value : fallback;
  }

  function money(value, decimals = 0) {
    if (!Number.isFinite(value)) return "Unlimited";
    return decimals > 0 ? moneyFormatterExact.format(value) : moneyFormatter.format(value);
  }

  function percent(value, decimals = 1) {
    if (!Number.isFinite(value)) return "0%";
    return `${value.toFixed(decimals)}%`;
  }

  function multiple(value, decimals = 1) {
    if (!Number.isFinite(value)) return "Unlimited";
    return `${value.toFixed(decimals)}x`;
  }

  function number(value, decimals = 0) {
    if (!Number.isFinite(value)) return "0";
    return value.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function setText(selector, value) {
    const target = qs(selector);
    if (target) target.textContent = value;
  }

  function createMetricCard(metric) {
    const card = document.createElement("div");
    card.className = "result-metric";

    const label = document.createElement("span");
    label.textContent = metric.label;
    card.appendChild(label);

    const value = document.createElement("strong");
    value.textContent = metric.value;
    card.appendChild(value);

    if (metric.note) {
      const note = document.createElement("em");
      note.textContent = metric.note;
      card.appendChild(note);
    }

    return card;
  }

  function renderResult(tool, result) {
    const metrics = qs(`[data-result-metrics="${tool.slug}"]`);
    const recommendation = qs(`[data-result-recommendation="${tool.slug}"]`);
    const status = qs(`[data-tool-status="${tool.slug}"]`);

    if (metrics) {
      metrics.replaceChildren(...result.metrics.map(createMetricCard));
    }

    if (recommendation) {
      recommendation.textContent = result.recommendation;
    }

    if (status) {
      status.textContent = "Result ready";
    }
  }

  function collectValues(form, schema) {
    return schema.reduce((values, field) => {
      values[field.name] = readNumber(form, field.name, field.fallback);
      return values;
    }, {});
  }

  function initCalculator(config) {
    const tool = { ...config };
    const form = qs(`[data-tool-form="${tool.slug}"]`);
    if (!form) return;

    setText(`[data-tool-status="${tool.slug}"]`, "Ready");

    function calculateAndRender() {
      const values = collectValues(form, tool.schema);
      const result = tool.calculate(values);
      renderResult(tool, result);
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      calculateAndRender();
    });

    qsa("input, select", form).forEach(field => {
      field.addEventListener("input", () => {
        const metrics = qs(`[data-result-metrics="${tool.slug}"]`);
        if (metrics && metrics.children.length > 0) calculateAndRender();
      });
    });
  }

  window.JoraTools = {
    clamp,
    initCalculator,
    money,
    multiple,
    number,
    percent,
    safeDivide
  };
})();
