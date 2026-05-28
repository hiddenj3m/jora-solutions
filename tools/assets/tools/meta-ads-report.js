(function (root) {
  const moneyFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  function toNumber(value) {
    const number = parseFloat(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
  }

  function safeDivide(numerator, denominator) {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
      return null;
    }

    return numerator / denominator;
  }

  function formatMoney(value) {
    return Number.isFinite(value) ? moneyFormatter.format(value) : "n/a";
  }

  function formatNumber(value) {
    return Number.isFinite(value) ? value.toLocaleString("en-GB", { maximumFractionDigits: 0 }) : "0";
  }

  function formatPercent(value, decimals = 1) {
    return Number.isFinite(value) ? `${value.toFixed(decimals)}%` : "n/a";
  }

  function formatMultiple(value) {
    return Number.isFinite(value) ? `${value.toFixed(2)}x` : "n/a";
  }

  function metric(label, value, note) {
    return { label, value, note };
  }

  function dropoff(fromLabel, toLabel, fromValue, toValue) {
    const lost = Math.max(fromValue - toValue, 0);
    const dropRate = safeDivide(lost, fromValue);
    const conversionRate = safeDivide(toValue, fromValue);

    return {
      label: `${fromLabel} to ${toLabel}`,
      lost,
      dropRate,
      conversionRate,
      summary: `${formatNumber(lost)} lost (${formatPercent((dropRate || 0) * 100, 1)} drop-off)`
    };
  }

  function strongestWeakness(stages) {
    const validStages = stages.filter(stage => Number.isFinite(stage.rate));
    if (!validStages.length) return null;
    return validStages.sort((a, b) => a.rate - b.rate)[0];
  }

  function buildRecommendation(input, rates) {
    if (input.spend <= 0) {
      return "Add campaign spend before judging the funnel. The report needs spend to calculate costs and ROAS.";
    }

    if (input.leads <= 0) {
      return "The campaign is not producing leads yet. Start with audience, creative, offer clarity and landing-page relevance.";
    }

    if (input.addToCarts <= 0) {
      return "Leads are not becoming add to carts. Check traffic quality, offer fit and the first product or landing-page step.";
    }

    if (input.checkouts <= 0) {
      return "Add to carts are not reaching checkout. Check product-page clarity, basket friction, delivery costs and trust signals.";
    }

    if (!input.hasSales) {
      return "Add sales when available. For now, focus on the lead-to-cart and cart-to-checkout stages before judging ROAS.";
    }

    const weakness = strongestWeakness([
      { name: "lead to add to cart", rate: rates.leadToAtc },
      { name: "add to cart to checkout", rate: rates.atcToCheckout },
      { name: "checkout to sale", rate: rates.checkoutToSale }
    ]);

    if (!weakness) {
      return "The funnel has enough data to review, but one or more stages are missing volume. Add more stage data before scaling.";
    }

    return `The weakest stage is ${weakness.name}. Fix that step before increasing spend, then rerun the report.`;
  }

  function calculateReport(rawValues) {
    const input = {
      spend: toNumber(rawValues.spend),
      leads: toNumber(rawValues.leads),
      addToCarts: toNumber(rawValues.addToCarts),
      checkouts: toNumber(rawValues.checkouts),
      sales: toNumber(rawValues.sales),
      revenue: toNumber(rawValues.revenue)
    };

    input.hasSales = input.sales > 0;
    input.hasRevenue = input.revenue > 0;

    const rates = {
      leadToAtc: safeDivide(input.addToCarts, input.leads),
      atcToCheckout: safeDivide(input.checkouts, input.addToCarts),
      checkoutToSale: input.hasSales ? safeDivide(input.sales, input.checkouts) : null,
      leadToSale: input.hasSales ? safeDivide(input.sales, input.leads) : null
    };

    const costs = {
      costPerLead: safeDivide(input.spend, input.leads),
      costPerAtc: safeDivide(input.spend, input.addToCarts),
      costPerCheckout: safeDivide(input.spend, input.checkouts),
      costPerSale: input.hasSales ? safeDivide(input.spend, input.sales) : null
    };

    const revenueMetrics = {
      roas: input.hasRevenue ? safeDivide(input.revenue, input.spend) : null,
      revenuePerLead: input.hasRevenue ? safeDivide(input.revenue, input.leads) : null,
      revenuePerCheckout: input.hasRevenue ? safeDivide(input.revenue, input.checkouts) : null,
      averageOrderValue: input.hasRevenue && input.hasSales ? safeDivide(input.revenue, input.sales) : null
    };

    revenueMetrics.maxAtcRoas = Number.isFinite(revenueMetrics.averageOrderValue)
      ? safeDivide(input.addToCarts * revenueMetrics.averageOrderValue, input.spend)
      : null;
    revenueMetrics.maxCheckoutRoas = Number.isFinite(revenueMetrics.averageOrderValue)
      ? safeDivide(input.checkouts * revenueMetrics.averageOrderValue, input.spend)
      : null;
    revenueMetrics.roasGap = Number.isFinite(revenueMetrics.maxCheckoutRoas) && Number.isFinite(revenueMetrics.roas)
      ? revenueMetrics.maxCheckoutRoas - revenueMetrics.roas
      : null;

    const metrics = [
      metric("Cost per lead", formatMoney(costs.costPerLead), "Spend divided by leads"),
      metric("Cost per add to cart", formatMoney(costs.costPerAtc), "Spend divided by add to carts"),
      metric("Cost per checkout", formatMoney(costs.costPerCheckout), "Spend divided by checkouts"),
      metric("Lead to add to cart", formatPercent((rates.leadToAtc || 0) * 100), "First intent step"),
      metric("Add to cart to checkout", formatPercent((rates.atcToCheckout || 0) * 100), "Cart progression"),
      metric("Spend", formatMoney(input.spend), "Total Meta Ads spend")
    ];

    if (input.hasSales) {
      metrics.push(
        metric("Cost per sale", formatMoney(costs.costPerSale), "Spend divided by sales"),
        metric("Lead to sale", formatPercent((rates.leadToSale || 0) * 100), "End-to-end conversion"),
        metric("Checkout to sale", formatPercent((rates.checkoutToSale || 0) * 100), "Final-stage conversion")
      );
    }

    if (input.hasRevenue) {
      metrics.push(
        metric("ROAS", formatMultiple(revenueMetrics.roas), "Revenue divided by spend"),
        metric("Revenue per lead", formatMoney(revenueMetrics.revenuePerLead), "Revenue divided by leads"),
        metric("Revenue per checkout", formatMoney(revenueMetrics.revenuePerCheckout), "Revenue divided by checkouts")
      );
    }

    if (input.hasSales && input.hasRevenue) {
      metrics.push(
        metric("Average order value", formatMoney(revenueMetrics.averageOrderValue), "Revenue divided by sales"),
        metric("Max ATC ROAS", formatMultiple(revenueMetrics.maxAtcRoas), "If every add to cart bought at AOV"),
        metric("Max checkout ROAS", formatMultiple(revenueMetrics.maxCheckoutRoas), "If every checkout bought at AOV"),
        metric("ROAS gap", formatMultiple(revenueMetrics.roasGap), "Potential lost after checkout")
      );
    }

    const dropoffs = [
      dropoff("Leads", "Add to carts", input.leads, input.addToCarts),
      dropoff("Add to carts", "Checkouts", input.addToCarts, input.checkouts)
    ];

    if (input.hasSales) {
      dropoffs.push(dropoff("Checkouts", "Sales", input.checkouts, input.sales));
    }

    const stages = [
      { label: "Leads", value: input.leads },
      { label: "Add to carts", value: input.addToCarts },
      { label: "Checkouts", value: input.checkouts }
    ];

    if (input.hasSales) {
      stages.push({ label: "Sales", value: input.sales });
    }

    const costStages = [
      { label: "Lead", value: costs.costPerLead },
      { label: "Add to cart", value: costs.costPerAtc },
      { label: "Checkout", value: costs.costPerCheckout }
    ];

    if (input.hasSales) {
      costStages.push({ label: "Sale", value: costs.costPerSale });
    }

    const roasStages = [
      { label: "Actual ROAS", value: revenueMetrics.roas },
      { label: "Max ATC ROAS", value: revenueMetrics.maxAtcRoas },
      { label: "Max checkout ROAS", value: revenueMetrics.maxCheckoutRoas }
    ].filter(stage => Number.isFinite(stage.value));

    return {
      input,
      metrics,
      dropoffs,
      stages,
      costStages,
      roasStages,
      recommendation: buildRecommendation(input, rates),
      summary: `Report based on ${formatMoney(input.spend)} spend, ${formatNumber(input.leads)} leads, ${formatNumber(input.addToCarts)} add to carts and ${formatNumber(input.checkouts)} checkouts.`
    };
  }

  function createMetricCard(item) {
    const card = document.createElement("div");
    card.className = "result-metric";

    const label = document.createElement("span");
    label.textContent = item.label;
    card.appendChild(label);

    const value = document.createElement("strong");
    value.textContent = item.value;
    card.appendChild(value);

    const note = document.createElement("em");
    note.textContent = item.note;
    card.appendChild(note);

    return card;
  }

  function createBarRow(item, maxValue, formatter) {
    const row = document.createElement("div");
    row.className = "meta-bar-row";

    const top = document.createElement("div");
    top.className = "meta-bar-row-top";

    const label = document.createElement("span");
    label.textContent = item.label;
    top.appendChild(label);

    const value = document.createElement("strong");
    value.textContent = formatter(item.value);
    top.appendChild(value);

    const track = document.createElement("div");
    track.className = "meta-bar-track";

    const bar = document.createElement("span");
    const width = maxValue > 0 && Number.isFinite(item.value) ? Math.max(4, (item.value / maxValue) * 100) : 4;
    bar.style.width = `${Math.min(width, 100)}%`;
    track.appendChild(bar);

    row.appendChild(top);
    row.appendChild(track);

    return row;
  }

  function renderBars(target, items, formatter) {
    if (!target) return;
    const finiteValues = items.map(item => item.value).filter(Number.isFinite);
    const maxValue = finiteValues.length ? Math.max(...finiteValues, 1) : 1;
    target.replaceChildren(...items.map(item => createBarRow(item, maxValue, formatter)));
  }

  function renderDropoffs(target, dropoffs) {
    if (!target) return;

    target.replaceChildren(...dropoffs.map(item => {
      const row = document.createElement("div");
      row.className = "meta-dropoff-item";

      const label = document.createElement("strong");
      label.textContent = item.label;
      row.appendChild(label);

      const summary = document.createElement("span");
      summary.textContent = item.summary;
      row.appendChild(summary);

      return row;
    }));
  }

  function readFormValues(form) {
    return {
      spend: form.elements.spend?.value,
      leads: form.elements.leads?.value,
      addToCarts: form.elements.addToCarts?.value,
      checkouts: form.elements.checkouts?.value,
      sales: form.elements.sales?.value,
      revenue: form.elements.revenue?.value
    };
  }

  function renderReport(report) {
    const doc = root.document;
    doc.querySelector("[data-report-summary]").textContent = report.summary;
    doc.querySelector("[data-report-recommendation]").textContent = report.recommendation;
    doc.querySelector("[data-meta-report-status]").textContent = "Report ready";

    const metrics = doc.querySelector("[data-report-metrics]");
    metrics.replaceChildren(...report.metrics.map(createMetricCard));

    renderDropoffs(doc.querySelector("[data-report-dropoffs]"), report.dropoffs);
    renderBars(doc.querySelector("[data-funnel-chart]"), report.stages, item => formatNumber(item));
    renderBars(doc.querySelector("[data-cost-chart]"), report.costStages, item => formatMoney(item));

    const roasCard = doc.querySelector("[data-roas-card]");
    if (report.roasStages.length) {
      roasCard.hidden = false;
      renderBars(doc.querySelector("[data-roas-chart]"), report.roasStages, item => formatMultiple(item));
    } else {
      roasCard.hidden = true;
    }
  }

  function init() {
    const doc = root.document;
    const form = doc.querySelector("[data-meta-report-form]");
    if (!form) return;

    function generate() {
      const report = calculateReport(readFormValues(form));
      renderReport(report);
      return report;
    }

    form.addEventListener("submit", event => {
      event.preventDefault();
      generate();
    });

    form.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", generate);
    });

    doc.querySelector("[data-print-report]")?.addEventListener("click", () => {
      generate();
      root.setTimeout(() => root.print(), 60);
    });

    generate();
  }

  if (root.document) {
    root.document.addEventListener("DOMContentLoaded", init);
  }

  root.MetaAdsReportTool = { calculateReport };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calculateReport };
  }
})(typeof window !== "undefined" ? window : globalThis);
