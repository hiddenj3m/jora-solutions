/* =========================================================
   JORA SOLUTIONS - AD PROFIT COMMAND CENTRE
   Launch-ready JS for redesigned horizontal control layout
   ========================================================= */

const STATE_KEY = "jora_tools_ad_profit_command_centre_input_state_v1";
const SNAPSHOT_KEY = "jora_tools_ad_profit_command_centre_latest_snapshot_v1";

const inputIds = [
  "businessName",
  "businessModel",
  "offerPrice",
  "aov",
  "margin",
  "ltv",
  "refundRate",
  "upsellRate",
  "cpcLow",
  "cpcExp",
  "cpcHigh",
  "cvrLow",
  "cvrExp",
  "cvrHigh",
  "closeRate",
  "dailySpend",
  "monthlySpend",
  "fixedCosts",
  "paybackDays",
  "proofStrength",
  "urgency",
  "capacity"
];

const charts = {};
const defaults = {};

let latestSnapshot = null;
let hasRenderedAtLeastOnce = false;
let isSyncingBudget = false;
let activeModalTrigger = null;

/* =========================================================
   DEV RESET
   ========================================================= */

if (new URLSearchParams(window.location.search).get("reset-apcc") === "1") {
  localStorage.removeItem(STATE_KEY);
  localStorage.removeItem(SNAPSHOT_KEY);

  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}

/* =========================================================
   HELPERS
   ========================================================= */

function el(id) {
  return document.getElementById(id);
}

function exists(id) {
  return Boolean(el(id));
}

function getNumber(id, fallback = 0) {
  const element = el(id);
  if (!element) return fallback;

  const value = parseFloat(element.value);
  return Number.isFinite(value) ? value : fallback;
}

function getString(id, fallback = "") {
  const element = el(id);
  if (!element) return fallback;
  return element.value || fallback;
}

function setText(id, value) {
  const element = el(id);
  if (element) element.textContent = value;
}

function setValue(id, value) {
  const element = el(id);
  if (element) element.value = value;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeDivide(numerator, denominator, fallback = 0) {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return fallback;
  }

  return numerator / denominator;
}

function randomBetween(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return 0;
  if (max < min) return randomBetween(max, min);
  return min + Math.random() * (max - min);
}

function formatMoney(value, decimals = 0) {
  if (!Number.isFinite(value)) return "Unlimited";

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

function formatPercent(value, decimals = 1) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(decimals)}%`;
}

function formatMultiple(value, decimals = 1) {
  if (!Number.isFinite(value)) return "Unlimited";
  return `${value.toFixed(decimals)}x`;
}

/* =========================================================
   STATUS
   ========================================================= */

function updateAccessUI() {
  setText("runModelBtn", "RUN");
  setText("accessStatus", hasRenderedAtLeastOnce ? "Result ready" : "Ready");

  if (exists("lockedContent")) {
    el("lockedContent").classList.remove("locked-preview");
  }
}

/* =========================================================
   INPUT STATE
   ========================================================= */

function cacheDefaults() {
  inputIds.forEach(id => {
    if (exists(id)) {
      defaults[id] = el(id).value;
    }
  });
}

function getInputs() {
  const businessName = getString("businessName", "").trim();
  const businessModel = getString("businessModel", "E-commerce");

  const offerPrice = getNumber("offerPrice", 99);
  const aov = getNumber("aov", offerPrice || 99);
  const marginPercent = getNumber("margin", 65);
  const ltv = getNumber("ltv", aov);
  const refundRatePercent = getNumber("refundRate", 5);
  const upsellRatePercent = getNumber("upsellRate", 15);

  const cpcLow = getNumber("cpcLow", 0.6);
  const cpcExpected = getNumber("cpcExp", 1.2);
  const cpcHigh = getNumber("cpcHigh", 2.2);

  const cvrLowPercent = getNumber("cvrLow", 1.2);
  const cvrExpectedPercent = getNumber("cvrExp", 2.5);
  const cvrHighPercent = getNumber("cvrHigh", 4.5);
  const closeRatePercent = getNumber("closeRate", 25);

  const dailySpend = getNumber("dailySpend", 50);
  const monthlySpend = getNumber("monthlySpend", dailySpend * 30);
  const fixedCosts = getNumber("fixedCosts", 250);
  const paybackDays = getNumber("paybackDays", 30);

  const proofStrength = getNumber("proofStrength", 55);
  const urgency = getNumber("urgency", 45);
  const capacity = getNumber("capacity", 80);

  return {
    businessName,
    businessModel,

    offerPrice: Math.max(0, offerPrice),
    aov: Math.max(0, aov),
    margin: clamp(marginPercent / 100, 0, 1),
    ltv: Math.max(0, ltv),
    refundRate: clamp(refundRatePercent / 100, 0, 0.95),
    upsellRate: clamp(upsellRatePercent / 100, 0, 1),

    cpcLow: Math.max(0.01, cpcLow),
    cpcExpected: Math.max(0.01, cpcExpected),
    cpcHigh: Math.max(0.01, cpcHigh),

    cvrLow: clamp(cvrLowPercent / 100, 0, 1),
    cvrExpected: clamp(cvrExpectedPercent / 100, 0, 1),
    cvrHigh: clamp(cvrHighPercent / 100, 0, 1),
    closeRate: clamp(closeRatePercent / 100, 0, 1),

    dailySpend: Math.max(0, dailySpend),
    monthlySpend: Math.max(0, monthlySpend),
    fixedCosts: Math.max(0, fixedCosts),
    paybackDays: Math.max(1, paybackDays),

    proofStrength: clamp(proofStrength, 0, 100),
    urgency: clamp(urgency, 0, 100),
    capacity: clamp(capacity, 0, 100)
  };
}

function saveInputState() {
  const state = {};

  inputIds.forEach(id => {
    if (exists(id)) {
      state[id] = el(id).value;
    }
  });

  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadInputState() {
  try {
    const state = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");

    inputIds.forEach(id => {
      if (exists(id) && state[id] !== undefined) {
        el(id).value = state[id];
      }
    });
  } catch (error) {
    console.warn("Could not load APCC input state:", error);
  }
}

function syncBudgetFields(changedId) {
  if (isSyncingBudget) return;

  const daily = exists("dailySpend") ? el("dailySpend") : null;
  const monthly = exists("monthlySpend") ? el("monthlySpend") : null;

  if (!daily || !monthly) return;

  isSyncingBudget = true;

  if (changedId === "dailySpend") {
    const dailyValue = getNumber("dailySpend", 0);
    monthly.value = Math.round(dailyValue * 30);
  }

  if (changedId === "monthlySpend") {
    const monthlyValue = getNumber("monthlySpend", 0);
    daily.value = Math.round((monthlyValue / 30) * 100) / 100;
  }

  isSyncingBudget = false;
}

function updateConfigSummaries() {
  const margin = getNumber("margin", 65);
  const cvr = getNumber("cvrExp", 2.5);
  const closeRate = getNumber("closeRate", 25);
  const capacity = getNumber("capacity", 80);

  setText(
    "offerSummary",
    `${formatMoney(getNumber("aov", 99))} AOV / ${Math.round(margin)}% margin / ${formatMoney(
      getNumber("ltv", 180)
    )} LTV`
  );

  setText(
    "trafficSummary",
    `${formatMoney(getNumber("cpcExp", 1.2), 2)} CPC / ${formatPercent(
      cvr,
      1
    )} CVR / ${Math.round(closeRate)}% close`
  );

  setText(
    "budgetSummary",
    `${formatMoney(getNumber("dailySpend", 50))}/day / ${formatMoney(
      getNumber("monthlySpend", 1500)
    )}/mo / ${Math.round(capacity)}% capacity`
  );
}

/* =========================================================
   CORE CALCULATION ENGINE
   ========================================================= */

function calculateModel(input, overrides = {}) {
  const businessModel = overrides.businessModel || input.businessModel;

  const monthlySpend = overrides.monthlySpend ?? input.monthlySpend;
  const cpc = overrides.cpcExpected ?? overrides.cpc ?? input.cpcExpected;
  const cvr = overrides.cvrExpected ?? overrides.cvr ?? input.cvrExpected;
  const closeRate = overrides.closeRate ?? input.closeRate;

  const aov = overrides.aov ?? input.aov;
  const margin = overrides.margin ?? input.margin;
  const ltv = overrides.ltv ?? input.ltv;
  const refundRate = overrides.refundRate ?? input.refundRate;
  const upsellRate = overrides.upsellRate ?? input.upsellRate;
  const fixedCosts = overrides.fixedCosts ?? input.fixedCosts;

  const isLeadModel = businessModel === "Lead generation" || businessModel === "Service business";
  const effectiveConversionRate = isLeadModel ? cvr * closeRate : cvr;

  const upsellValuePerConversion = aov * 0.35 * upsellRate;
  const effectiveAov = aov + upsellValuePerConversion;

  const clicks = safeDivide(monthlySpend, cpc, 0);
  const conversions = clicks * effectiveConversionRate;

  const revenue = conversions * effectiveAov;
  const grossProfit = revenue * margin;
  const refundCost = revenue * refundRate;
  const netProfit = grossProfit - monthlySpend - refundCost - fixedCosts;

  const cac = conversions > 0 ? monthlySpend / conversions : Infinity;

  const grossProfitPerConversion = effectiveAov * margin;
  const refundCostPerConversion = effectiveAov * refundRate;
  const contributionPerConversion = grossProfitPerConversion - refundCostPerConversion;

  const maxAllowableCac = Math.max(0, contributionPerConversion);
  const cacHeadroom = maxAllowableCac - cac;

  const roas = safeDivide(revenue, monthlySpend, 0);
  const breakEvenRoas = safeDivide(1, Math.max(margin - refundRate, 0.01), 0);
  const ltvCac = Number.isFinite(cac) && cac > 0 ? ltv / cac : 0;

  const breakEvenConversions = safeDivide(
    monthlySpend + fixedCosts,
    Math.max(contributionPerConversion, 0.01),
    Infinity
  );

  const breakEvenCvr = safeDivide(breakEvenConversions, clicks, Infinity);

  return {
    businessModel,
    monthlySpend,
    dailySpend: monthlySpend / 30,
    cpc,
    cvr,
    closeRate,
    effectiveConversionRate,

    clicks,
    conversions,
    customers: conversions,

    aov,
    effectiveAov,
    ltv,
    revenue,
    grossProfit,
    refundCost,
    fixedCosts,
    netProfit,

    cac,
    maxAllowableCac,
    cacHeadroom,
    roas,
    breakEvenRoas,
    ltvCac,

    contributionPerConversion,
    breakEvenConversions,
    breakEvenCvr
  };
}

/* =========================================================
   MONTE CARLO ESTIMATION
   ========================================================= */

function runMonteCarlo(input, runs = 1500) {
  const results = [];

  for (let index = 0; index < runs; index += 1) {
    const simulatedCpc = randomBetween(input.cpcLow, input.cpcHigh);
    const simulatedCvr = randomBetween(input.cvrLow, input.cvrHigh);

    const simulatedAov = input.aov * randomBetween(0.88, 1.18);
    const simulatedLtv = input.ltv * randomBetween(0.78, 1.28);
    const simulatedRefundRate = clamp(input.refundRate * randomBetween(0.55, 1.55), 0, 0.95);
    const simulatedMargin = clamp(input.margin * randomBetween(0.92, 1.05), 0, 1);

    const model = calculateModel(input, {
      cpc: simulatedCpc,
      cvr: simulatedCvr,
      aov: simulatedAov,
      ltv: simulatedLtv,
      refundRate: simulatedRefundRate,
      margin: simulatedMargin
    });

    results.push({
      profit: model.netProfit,
      cac: model.cac,
      roas: model.roas,
      ltvCac: model.ltvCac
    });
  }

  const profitResults = results.map(result => result.profit).sort((a, b) => a - b);

  const percentile = p => {
    const index = clamp(Math.floor(profitResults.length * p), 0, profitResults.length - 1);
    return profitResults[index];
  };

  const probabilityOfProfit = safeDivide(
    profitResults.filter(value => value > 0).length,
    profitResults.length,
    0
  );

  return {
    results,
    profitResults,
    p10: percentile(0.1),
    p50: percentile(0.5),
    p90: percentile(0.9),
    expectedProfit: profitResults.reduce((sum, value) => sum + value, 0) / profitResults.length,
    probabilityOfProfit,
    probabilityOfLoss: 1 - probabilityOfProfit
  };
}

/* =========================================================
   OFFER STRENGTH SCORE
   ========================================================= */

function calculateOfferScore(input, model) {
  const pricePower = clamp(input.margin * 125, 0, 100);
  const conversionPower = clamp(input.cvrExpected * 2400, 0, 100);
  const ltvPower = clamp(model.ltvCac * 25, 0, 100);
  const riskReversal = clamp(100 - input.refundRate * 220, 0, 100);

  const components = [
    ["Price Power", pricePower],
    ["Conversion Power", conversionPower],
    ["LTV Power", ltvPower],
    ["Risk Reversal", riskReversal],
    ["Proof Strength", input.proofStrength],
    ["Urgency / Scarcity", input.urgency],
    ["Operational Capacity", input.capacity]
  ];

  const score =
    pricePower * 0.19 +
    conversionPower * 0.18 +
    ltvPower * 0.2 +
    riskReversal * 0.13 +
    input.proofStrength * 0.12 +
    input.urgency * 0.08 +
    input.capacity * 0.1;

  let verdict = "Weak";

  if (score >= 82) verdict = "Scalable";
  else if (score >= 68) verdict = "Strong";
  else if (score >= 52) verdict = "Viable";

  return {
    score,
    verdict,
    components
  };
}

/* =========================================================
   DIAGNOSIS AND VERDICT
   ========================================================= */

function diagnoseBottleneck(input, model) {
  if (model.cac > model.maxAllowableCac) {
    return {
      label: "Traffic cost issue",
      reason:
        "Your projected CAC is above your allowable CAC. This usually means the creative, targeting, offer, or landing page cannot currently support profitable acquisition.",
      priority: "Reduce CAC or increase allowable CAC."
    };
  }

  if (model.ltvCac < 2) {
    return {
      label: "Weak LTV:CAC economics",
      reason:
        "Your LTV:CAC ratio is too low. Even if the first purchase works, the model does not have enough backend strength to scale confidently.",
      priority:
        "Increase LTV through repeat purchase, email, retargeting, subscription, bundles, or upsells."
    };
  }

  if (input.cvrExpected < 0.018) {
    return {
      label: "Landing page conversion bottleneck",
      reason:
        "Your conversion rate is weak. More spend will probably amplify the leak instead of fixing the economics.",
      priority: "Improve page clarity, proof, CTA strength, objections, speed, and offer framing."
    };
  }

  if (input.margin < 0.45) {
    return {
      label: "Margin issue",
      reason:
        "Your gross margin leaves limited room for traffic costs, refunds, testing waste, and fixed operating costs.",
      priority: "Increase price, reduce fulfilment cost, bundle products, or shift the offer mix."
    };
  }

  if (input.refundRate > 0.12) {
    return {
      label: "Refund / fulfilment leakage",
      reason:
        "Refunds or failed conversions are eating into the model and reducing the amount you can afford to spend.",
      priority: "Improve expectation setting, onboarding, delivery quality, and customer fit."
    };
  }

  if (input.capacity < 55) {
    return {
      label: "Operational capacity risk",
      reason: "The ads may work, but fulfilment capacity could break once volume increases.",
      priority: "Fix delivery systems before scaling spend."
    };
  }

  return {
    label: "Scale readiness",
    reason:
      "The model has enough CAC headroom, LTV support, and margin strength to justify controlled scaling tests.",
    priority: "Scale gradually while monitoring CAC, CVR, ROAS, refunds, and fulfilment."
  };
}

function calculateFinalVerdict(input, model, monteCarlo, score) {
  if (monteCarlo.probabilityOfProfit < 0.35 || model.cac > model.maxAllowableCac * 1.25) {
    return {
      label: "Do Not Advertise",
      reason:
        "The model has a high probability of losing money. Fix the offer economics, conversion rate, or traffic cost before running ads.",
      risk: "High"
    };
  }

  if (monteCarlo.probabilityOfProfit < 0.52 || score.score < 52) {
    return {
      label: "Validate Further",
      reason:
        "The model is not completely broken, but it is too unstable for confident paid acquisition.",
      risk: "Medium-High"
    };
  }

  if (monteCarlo.probabilityOfProfit < 0.68 || model.ltvCac < 3) {
    return {
      label: "Test With Small Budget",
      reason:
        "Run controlled tests only. Do not scale until CAC, conversion rate, and refund rate stabilise.",
      risk: "Medium"
    };
  }

  if (score.score >= 82 && model.ltvCac >= 4 && monteCarlo.probabilityOfProfit >= 0.78) {
    return {
      label: "Scale Aggressively",
      reason:
        "The model shows strong CAC headroom, healthy profit probability, and scalable offer economics.",
      risk: "Low"
    };
  }

  return {
    label: "Ready To Scale",
    reason:
      "The model is commercially viable. Increase budget in controlled stages while monitoring CAC, CVR, ROAS, and refunds.",
    risk: "Low-Medium"
  };
}

function calculateRecommendedDailyBudget(input, model, monteCarlo) {
  if (model.cacHeadroom < 0 || monteCarlo.probabilityOfProfit < 0.5) {
    return Math.max(10, input.dailySpend * 0.35);
  }

  if (monteCarlo.probabilityOfProfit >= 0.75 && model.ltvCac >= 3) {
    return input.dailySpend * 1.5;
  }

  return input.dailySpend;
}

/* =========================================================
   SCENARIOS AND BREAKPOINTS
   ========================================================= */

function buildScenarios(input) {
  const scenarios = [
    {
      name: "Base",
      overrides: {}
    },
    {
      name: "Higher Price",
      overrides: {
        aov: input.aov * 1.15,
        ltv: input.ltv * 1.08
      }
    },
    {
      name: "Lower LTV",
      overrides: {
        ltv: input.ltv * 0.75
      }
    },
    {
      name: "Better CVR",
      overrides: {
        cvr: input.cvrExpected * 1.35
      }
    },
    {
      name: "Higher CPC",
      overrides: {
        cpc: input.cpcExpected * 1.35
      }
    },
    {
      name: "Add Upsell",
      overrides: {
        upsellRate: clamp(input.upsellRate + 0.25, 0, 1)
      }
    },
    {
      name: "Reduce Refunds",
      overrides: {
        refundRate: input.refundRate * 0.5
      }
    },
    {
      name: "Increase Budget",
      overrides: {
        monthlySpend: input.monthlySpend * 1.5,
        cpc: input.cpcExpected * 1.08,
        cvr: input.cvrExpected * 0.97
      }
    }
  ];

  return scenarios.map(scenario => {
    const result = calculateModel(input, scenario.overrides);

    let risk = "Low";
    let verdict = "Viable";

    if (result.netProfit < 0) {
      risk = "High";
      verdict = "Do not scale";
    } else if (result.ltvCac < 3 || result.cacHeadroom < 0) {
      risk = "Medium";
      verdict = "Test carefully";
    }

    return {
      name: scenario.name,
      result,
      risk,
      verdict
    };
  });
}

function calculateBreakpoints(input, model) {
  const contributionPerConversion = Math.max(model.contributionPerConversion, 0.01);
  const maxCpcBeforeLoss = contributionPerConversion * model.effectiveConversionRate;

  const minimumCvrRequired = safeDivide(input.cpcExpected, contributionPerConversion, Infinity);

  const minimumLtvRequiredFor3x = Number.isFinite(model.cac) ? model.cac * 3 : Infinity;

  const maxRefundRateAllowed = clamp(
    input.margin - safeDivide(1, Math.max(model.roas, 0.01), 0),
    0,
    1
  );

  return {
    maxCpcBeforeLoss,
    minimumCvrRequired,
    minimumLtvRequiredFor3x,
    maxRefundRateAllowed
  };
}

function buildActionPlan(input, model) {
  const actions = [];

  if (model.cac > model.maxAllowableCac) {
    actions.push(
      "Reduce CAC with stronger creative angles, higher-intent targeting, better hooks, and tighter ad-to-page message match."
    );
  }

  if (input.cvrExpected < 0.02) {
    actions.push(
      "Improve conversion rate by fixing the landing page headline, proof, CTA, objections, page speed, and offer clarity."
    );
  }

  if (model.ltvCac < 3) {
    actions.push(
      "Increase LTV with post-purchase email, repeat-purchase offers, bundles, subscriptions, or retargeting."
    );
  }

  if (input.margin < 0.55) {
    actions.push(
      "Improve margin by increasing price, reducing fulfilment cost, bundling products, or repositioning the offer."
    );
  }

  if (input.upsellRate < 0.2) {
    actions.push("Add an upsell or bundle to increase AOV without relying on cheaper traffic.");
  }

  if (input.refundRate > 0.08) {
    actions.push(
      "Reduce refunds by improving expectation setting, onboarding, qualification, fulfilment, and customer fit."
    );
  }

  if (input.proofStrength < 60) {
    actions.push(
      "Add proof: reviews, case studies, before/after examples, UGC, founder credibility, guarantees, and trust signals."
    );
  }

  if (input.urgency < 50) {
    actions.push(
      "Strengthen urgency with limited-time bonuses, stock or slot limits, launch windows, or deadline-based incentives."
    );
  }

  if (input.capacity < 65) {
    actions.push(
      "Check fulfilment capacity before scaling so increased demand does not damage delivery quality."
    );
  }

  if (!actions.length) {
    actions.push(
      "Scale budget gradually while monitoring CAC, CVR, ROAS, refund rate, LTV:CAC, and fulfilment capacity."
    );
  }

  return actions;
}

/* =========================================================
   TAGS
   ========================================================= */

function getHealthTag(value, healthyThreshold, cautionThreshold) {
  if (value >= healthyThreshold) {
    return {
      label: "Healthy",
      className: "tag"
    };
  }

  if (value >= cautionThreshold) {
    return {
      label: "Caution",
      className: "tag warning"
    };
  }

  return {
    label: "Dangerous",
    className: "tag danger"
  };
}

function applyTag(id, tag) {
  if (!exists(id)) return;

  el(id).className = tag.className;
  el(id).textContent = tag.label;
}

/* =========================================================
   RENDER KPI CARDS
   ========================================================= */

function renderKpis(input, model, monteCarlo, verdict) {
  setText("heroProfit", formatMoney(model.netProfit));
  setText("heroCAC", formatMoney(model.cac));
  setText("heroLtvCac", formatMultiple(model.ltvCac));
  setText("heroVerdict", verdict.label);

  setText("kpiProfit", formatMoney(monteCarlo.p50));
  setText("kpiWorst", formatMoney(monteCarlo.p10));
  setText("kpiBest", formatMoney(monteCarlo.p90));
  setText("kpiProb", formatPercent(monteCarlo.probabilityOfProfit * 100, 0));

  setText("kpiCAC", formatMoney(model.cac));
  setText("kpiMaxCAC", formatMoney(model.maxAllowableCac));
  setText("kpiHeadroom", formatMoney(model.cacHeadroom));
  setText("kpiLtvCac", formatMultiple(model.ltvCac));

  setText("kpiROAS", formatMultiple(model.roas));
  setText("kpiBEROAS", formatMultiple(model.breakEvenRoas));
  setText("kpiRecBudget", formatMoney(calculateRecommendedDailyBudget(input, model, monteCarlo)));
  setText("kpiRefundImpact", formatMoney(model.refundCost));

  applyTag("kpiProfitTag", getHealthTag(monteCarlo.p50, 1, -250));
  applyTag("kpiWorstTag", getHealthTag(monteCarlo.p10, 1, -500));
  applyTag("kpiBestTag", getHealthTag(monteCarlo.p90, 1, -250));
  applyTag("kpiProbTag", getHealthTag(monteCarlo.probabilityOfProfit, 0.7, 0.5));

  applyTag(
    "kpiCACTag",
    model.cac <= model.maxAllowableCac
      ? { label: "Healthy", className: "tag" }
      : { label: "Dangerous", className: "tag danger" }
  );

  applyTag(
    "kpiHeadroomTag",
    model.cacHeadroom > 0
      ? { label: "Healthy", className: "tag" }
      : { label: "Dangerous", className: "tag danger" }
  );

  applyTag("kpiLtvCacTag", getHealthTag(model.ltvCac, 3, 2));

  applyTag(
    "kpiROASTag",
    model.roas >= model.breakEvenRoas
      ? { label: "Healthy", className: "tag" }
      : { label: "Dangerous", className: "tag danger" }
  );

  applyTag(
    "kpiBudgetTag",
    monteCarlo.probabilityOfProfit > 0.65
      ? { label: "Safe", className: "tag" }
      : { label: "Restrict", className: "tag warning" }
  );
}

/* =========================================================
   RENDER OFFER SCORE
   ========================================================= */

function renderOfferScore(score, bottleneck) {
  setText("offerScore", Math.round(score.score));
  setText("offerVerdict", score.verdict);
  setText("constraintText", `${bottleneck.label} - ${bottleneck.priority}`);

  if (exists("scoreRing")) {
    el("scoreRing").style.setProperty("--score", clamp(score.score, 0, 100));
  }

  if (!exists("scoreBars")) return;

  el("scoreBars").innerHTML = score.components
    .map(([name, value]) => {
      const safeValue = clamp(value, 0, 100);

      return `
        <div class="score-bar">
          <span>${name}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${safeValue}%"></div>
          </div>
          <strong>${Math.round(safeValue)}</strong>
        </div>
      `;
    })
    .join("");
}

/* =========================================================
   CHARTS
   ========================================================= */

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function renderChart(id, type, data, options = {}) {
  if (!exists(id)) return;
  if (typeof Chart === "undefined") return;

  destroyChart(id);

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 450
    },
    plugins: {
      legend: {
        labels: {
          color: "#dfe6f4"
        }
      },
      tooltip: {
        callbacks: {
          label(context) {
            const value = context.raw;
            const label = context.dataset.label || "";

            if (typeof value === "number") {
              return `${label}: ${formatMoney(value)}`;
            }

            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: "#9aa4b2"
        },
        grid: {
          color: "rgba(255,255,255,.06)"
        }
      },
      y: {
        ticks: {
          color: "#9aa4b2"
        },
        grid: {
          color: "rgba(255,255,255,.06)"
        }
      }
    }
  };

  charts[id] = new Chart(el(id), {
    type,
    data,
    options: {
      ...baseOptions,
      ...options,
      plugins: {
        ...baseOptions.plugins,
        ...(options.plugins || {})
      },
      scales: {
        ...baseOptions.scales,
        ...(options.scales || {})
      }
    }
  });
}

function buildHistogram(values, binCount = 18) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const binSize = range > 0 ? range / binCount : 1;

  const bins = Array.from({ length: binCount }, (_, index) => ({
    label: min + binSize * index,
    count: 0
  }));

  values.forEach(value => {
    const index = clamp(Math.floor((value - min) / binSize), 0, binCount - 1);
    bins[index].count += 1;
  });

  return bins;
}

function renderCharts(input, model, monteCarlo) {
  const spendLevels = [250, 500, 1000, 1500, 2500, 5000, 7500, 10000];

  renderChart("profitRangeChart", "line", {
    labels: spendLevels.map(value => formatMoney(value)),
    datasets: [
      {
        label: "Worst Case",
        data: spendLevels.map(spend =>
          calculateModel(input, {
            monthlySpend: spend,
            cpc: input.cpcHigh,
            cvr: input.cvrLow
          }).netProfit
        ),
        tension: 0.35
      },
      {
        label: "Expected",
        data: spendLevels.map(spend =>
          calculateModel(input, {
            monthlySpend: spend,
            cpc: input.cpcExpected,
            cvr: input.cvrExpected
          }).netProfit
        ),
        tension: 0.35
      },
      {
        label: "Best Case",
        data: spendLevels.map(spend =>
          calculateModel(input, {
            monthlySpend: spend,
            cpc: input.cpcLow,
            cvr: input.cvrHigh
          }).netProfit
        ),
        tension: 0.35
      }
    ]
  });

  renderChart("scalingChart", "line", {
    labels: spendLevels.map(value => formatMoney(value)),
    datasets: [
      {
        label: "Profit With Diminishing Returns",
        data: spendLevels.map((spend, index) =>
          calculateModel(input, {
            monthlySpend: spend,
            cpc: input.cpcExpected * (1 + index * 0.08),
            cvr: input.cvrExpected * (1 - index * 0.035)
          }).netProfit
        ),
        tension: 0.35
      }
    ]
  });

  renderChart("cacChart", "bar", {
    labels: ["Projected CAC", "Max Allowable CAC", "Headroom"],
    datasets: [
      {
        label: "CAC Safety Margin",
        data: [
          Number.isFinite(model.cac) ? model.cac : 0,
          model.maxAllowableCac,
          model.cacHeadroom
        ]
      }
    ]
  });

  const baseProfit = model.netProfit;

  const sensitivity = [
    [
      "Conversion Rate +20%",
      calculateModel(input, { cvr: input.cvrExpected * 1.2 }).netProfit - baseProfit
    ],
    ["CPC +20%", calculateModel(input, { cpc: input.cpcExpected * 1.2 }).netProfit - baseProfit],
    ["LTV +20%", calculateModel(input, { ltv: input.ltv * 1.2 }).netProfit - baseProfit],
    ["AOV +20%", calculateModel(input, { aov: input.aov * 1.2 }).netProfit - baseProfit],
    [
      "Refund Rate +50%",
      calculateModel(input, { refundRate: input.refundRate * 1.5 }).netProfit - baseProfit
    ]
  ].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  renderChart(
    "sensitivityChart",
    "bar",
    {
      labels: sensitivity.map(item => item[0]),
      datasets: [
        {
          label: "Profit Impact",
          data: sensitivity.map(item => item[1])
        }
      ]
    },
    {
      indexAxis: "y"
    }
  );

  const scenarios = buildScenarios(input);

  renderChart("scenarioChart", "bar", {
    labels: scenarios.map(item => item.name),
    datasets: [
      {
        label: "Profit",
        data: scenarios.map(item => item.result.netProfit)
      }
    ]
  });

  const bins = buildHistogram(monteCarlo.profitResults, 18);

  renderChart(
    "monteCarloChart",
    "bar",
    {
      labels: bins.map(bin => formatMoney(bin.label)),
      datasets: [
        {
          label: "Frequency",
          data: bins.map(bin => bin.count)
        }
      ]
    },
    {
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              return `Frequency: ${context.raw}`;
            }
          }
        }
      }
    }
  );
}

/* =========================================================
   RENDER TABLES
   ========================================================= */

function renderScenarioTable(input) {
  if (!exists("scenarioTable")) return;

  const scenarios = buildScenarios(input);

  el("scenarioTable").innerHTML = scenarios
    .map(
      scenario => `
        <tr>
          <td>${scenario.name}</td>
          <td>${formatMoney(scenario.result.netProfit)}</td>
          <td>${formatMoney(scenario.result.cac)}</td>
          <td>${formatMultiple(scenario.result.roas)}</td>
          <td>${formatMultiple(scenario.result.ltvCac)}</td>
          <td>${scenario.risk}</td>
          <td>${scenario.verdict}</td>
        </tr>
      `
    )
    .join("");
}

function renderBreakpointAnalysis(input, model) {
  const breakpoints = calculateBreakpoints(input, model);

  setText("bpMaxCpc", formatMoney(breakpoints.maxCpcBeforeLoss, 2));
  setText("bpMinCvr", formatPercent(breakpoints.minimumCvrRequired * 100, 2));
  setText("bpMinLtv", formatMoney(breakpoints.minimumLtvRequiredFor3x));
  setText("bpMaxRefund", formatPercent(breakpoints.maxRefundRateAllowed * 100, 1));
}

function renderScalingTable(input) {
  if (!exists("scalingTable")) return;

  const dailySpendLevels = [25, 50, 100, 250, 500];

  el("scalingTable").innerHTML = dailySpendLevels
    .map((dailySpend, index) => {
      const monthlySpend = dailySpend * 30;

      const result = calculateModel(input, {
        monthlySpend,
        cpc: input.cpcExpected * (1 + index * 0.12),
        cvr: input.cvrExpected * (1 - index * 0.045)
      });

      let risk = "Low";
      let recommendation = "Safe test zone";

      if (result.netProfit < 0) {
        risk = "High";
        recommendation = "Do not scale here";
      } else if (result.ltvCac < 3 || result.cacHeadroom < 0) {
        risk = "Medium";
        recommendation = "Improve economics first";
      }

      return `
        <tr>
          <td>${formatMoney(dailySpend)}/day</td>
          <td>${formatMoney(monthlySpend)}</td>
          <td>${formatMoney(result.netProfit)}</td>
          <td>${formatMoney(result.cac)}</td>
          <td>${risk}</td>
          <td>${recommendation}</td>
        </tr>
      `;
    })
    .join("");
}

/* =========================================================
   RENDER DIAGNOSIS
   ========================================================= */

function renderDiagnosis(input, model, bottleneck, verdict) {
  setText("primaryBottleneck", bottleneck.label);
  setText("bottleneckWhy", bottleneck.reason);

  const actions = buildActionPlan(input, model);

  if (exists("actionPlan")) {
    el("actionPlan").innerHTML = actions.map(action => `<li>${action}</li>`).join("");
  }

  setText("finalVerdict", verdict.label);
  setText("finalReason", verdict.reason);
  setText("riskPill", `Risk: ${verdict.risk}`);
}

/* =========================================================
   SNAPSHOT
   ========================================================= */

function saveSnapshot(input, model, monteCarlo, score, bottleneck, verdict) {
  latestSnapshot = {
    createdAt: new Date().toISOString(),
    businessName: input.businessName,
    inputs: input,
    outputs: {
      expectedProfit: model.netProfit,
      p10: monteCarlo.p10,
      p50: monteCarlo.p50,
      p90: monteCarlo.p90,
      probabilityOfProfit: monteCarlo.probabilityOfProfit,
      probabilityOfLoss: monteCarlo.probabilityOfLoss,
      projectedCac: model.cac,
      maxAllowableCac: model.maxAllowableCac,
      cacHeadroom: model.cacHeadroom,
      roas: model.roas,
      breakEvenRoas: model.breakEvenRoas,
      ltvCac: model.ltvCac,
      offerStrengthScore: score.score,
      offerStrengthVerdict: score.verdict,
      bottleneck: bottleneck.label,
      finalVerdict: verdict.label,
      risk: verdict.risk,
      recommendedNextStep: verdict.reason
    }
  };

  const json = JSON.stringify(latestSnapshot);

  localStorage.setItem(SNAPSHOT_KEY, json);

  if (exists("modelSnapshot")) {
    el("modelSnapshot").value = json;
  }

  if (exists("modelRecommendedNextStep")) {
    el("modelRecommendedNextStep").value = verdict.reason;
  }
}

function loadSnapshot() {
  try {
    const saved = localStorage.getItem(SNAPSHOT_KEY);
    if (!saved) return null;

    latestSnapshot = JSON.parse(saved);
    return latestSnapshot;
  } catch (error) {
    console.warn("Could not load APCC snapshot:", error);
    return null;
  }
}

/* =========================================================
   CONFIG MODALS
   ========================================================= */

function openConfigModal(modalId, trigger = null) {
  if (!exists(modalId)) return;

  activeModalTrigger = trigger;
  el(modalId).classList.remove("hidden");
  document.body.classList.add("modal-open");

  const firstInput = el(modalId).querySelector("input, select, textarea");
  const fallbackButton = el(modalId).querySelector("button");

  if (firstInput) firstInput.focus();
  else if (fallbackButton) fallbackButton.focus();
}

function closeConfigModal(modal) {
  if (!modal) return;

  modal.classList.add("hidden");

  const anyOpen = document.querySelector(".config-modal:not(.hidden)");
  if (!anyOpen) {
    document.body.classList.remove("modal-open");

    if (activeModalTrigger) {
      activeModalTrigger.focus();
      activeModalTrigger = null;
    }
  }
}

function bindConfigModals() {
  document.querySelectorAll("[data-open-modal]").forEach(button => {
    button.addEventListener("click", () => {
      openConfigModal(button.getAttribute("data-open-modal"), button);
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => {
      closeConfigModal(button.closest(".config-modal"));
    });
  });

  document.querySelectorAll(".config-modal").forEach(modal => {
    modal.addEventListener("click", event => {
      if (event.target === modal) {
        closeConfigModal(modal);
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;

    document.querySelectorAll(".config-modal:not(.hidden)").forEach(modal => {
      closeConfigModal(modal);
    });
  });
}

function validateRequiredInputs() {
  if (!exists("businessName")) return true;

  const businessName = getString("businessName", "").trim();
  const businessNameField = el("businessName").closest(".field") || el("businessName");

  if (businessName) {
    businessNameField.classList.remove("field-error");
    return true;
  }

  businessNameField.classList.add("field-error");
  setText("accessStatus", "Enter Business Name");

  el("businessName").focus();
  el("businessName").scrollIntoView({ behavior: "smooth", block: "center" });

  return false;
}

/* =========================================================
   MAIN RENDER
   ========================================================= */

function renderModelOnly() {
  const input = getInputs();
  const model = calculateModel(input);
  const monteCarlo = runMonteCarlo(input);
  const score = calculateOfferScore(input, model);
  const bottleneck = diagnoseBottleneck(input, model);
  const verdict = calculateFinalVerdict(input, model, monteCarlo, score);

  renderKpis(input, model, monteCarlo, verdict);
  renderOfferScore(score, bottleneck);
  renderCharts(input, model, monteCarlo);
  renderScenarioTable(input);
  renderBreakpointAnalysis(input, model);
  renderScalingTable(input);
  renderDiagnosis(input, model, bottleneck, verdict);
  saveSnapshot(input, model, monteCarlo, score, bottleneck, verdict);

  hasRenderedAtLeastOnce = true;

  if (exists("lockedContent")) {
    el("lockedContent").classList.remove("locked-preview");
  }
}

function runModel(options = {}) {
  if (!validateRequiredInputs()) return;

  renderModelOnly();
  saveInputState();
  updateAccessUI();
}

/* =========================================================
   EVENTS
   ========================================================= */

function handleInputChange(event) {
  const changedId = event && event.target ? event.target.id : null;

  if (changedId === "dailySpend" || changedId === "monthlySpend") {
    syncBudgetFields(changedId);
  }

  if (changedId === "businessName" && exists("businessName")) {
    const field = el("businessName").closest(".field") || el("businessName");
    field.classList.remove("field-error");
  }

  saveInputState();
  updateConfigSummaries();
  runModel({ force: true });
}

function resetInputs() {
  inputIds.forEach(id => {
    if (exists(id) && defaults[id] !== undefined) {
      el(id).value = defaults[id];
    }
  });

  saveInputState();
  updateConfigSummaries();
  runModel({ force: true });
}

function clearStoredToolState() {
  localStorage.removeItem(SNAPSHOT_KEY);

  hasRenderedAtLeastOnce = false;
  latestSnapshot = null;

  updateAccessUI();
}

/* =========================================================
   INIT
   ========================================================= */

function initialiseApp() {
  cacheDefaults();
  loadInputState();
  updateConfigSummaries();
  bindConfigModals();
  loadSnapshot();

  inputIds.forEach(id => {
    if (!exists(id)) return;

    el(id).addEventListener("input", handleInputChange);
    el(id).addEventListener("change", handleInputChange);
  });

  if (exists("runModelBtn")) {
    el("runModelBtn").addEventListener("click", () => runModel());
  }

  if (exists("resetBtn")) {
    el("resetBtn").addEventListener("click", resetInputs);
  }

  renderModelOnly();
  updateAccessUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialiseApp);
} else {
  initialiseApp();
}
