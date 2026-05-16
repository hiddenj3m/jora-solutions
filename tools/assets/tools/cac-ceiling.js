document.addEventListener("DOMContentLoaded", () => {
  JoraTools.initCalculator({
    slug: "cac-ceiling",
    name: "CAC Ceiling Calculator",
    defaultRecommendation: "Raise allowable CAC before scaling acquisition.",
    schema: [
      { name: "aov", fallback: 99 },
      { name: "margin", fallback: 65 },
      { name: "refundRate", fallback: 5 },
      { name: "ltv", fallback: 180 },
      { name: "ltvShare", fallback: 35 },
      { name: "currentCac", fallback: 45 }
    ],
    calculate(values) {
      const aov = Math.max(0, values.aov);
      const ltv = Math.max(aov, values.ltv);
      const margin = JoraTools.clamp(values.margin / 100, 0, 1);
      const refundRate = JoraTools.clamp(values.refundRate / 100, 0, 0.95);
      const ltvShare = JoraTools.clamp(values.ltvShare / 100, 0.01, 1);
      const currentCac = Math.max(0, values.currentCac);
      const netMargin = Math.max(margin - refundRate, 0);

      const firstOrderCeiling = aov * netMargin;
      const ltvContribution = ltv * netMargin;
      const ltvCeiling = ltvContribution * ltvShare;
      const allowableCac = Math.min(firstOrderCeiling, ltvCeiling);
      const headroom = allowableCac - currentCac;
      const ltvCac = JoraTools.safeDivide(ltv, currentCac, Infinity);

      let recommendation = "The current CAC is inside the ceiling. Scale carefully while watching refunds and conversion rate.";
      if (headroom < 0) {
        recommendation = "Current CAC is above the ceiling. Improve AOV, margin, conversion rate or LTV before scaling.";
      } else if (headroom < allowableCac * 0.2) {
        recommendation = "CAC is close to the ceiling. Build more headroom before increasing budget.";
      }

      return {
        recommendation,
        metrics: [
          {
            label: "Max allowable CAC",
            value: JoraTools.money(allowableCac),
            note: "Conservative ceiling"
          },
          {
            label: "Current CAC headroom",
            value: JoraTools.money(headroom),
            note: headroom >= 0 ? "Room to test" : "Over ceiling"
          },
          {
            label: "First-order ceiling",
            value: JoraTools.money(firstOrderCeiling),
            note: "Payback from first order"
          },
          {
            label: "LTV:CAC ratio",
            value: JoraTools.multiple(ltvCac),
            note: "Based on current CAC"
          }
        ],
        snapshot: {
          netMargin,
          firstOrderCeiling,
          ltvCeiling,
          allowableCac,
          headroom,
          ltvCac
        }
      };
    }
  });
});
