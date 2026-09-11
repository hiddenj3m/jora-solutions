document.addEventListener("DOMContentLoaded", () => {
  JoraTools.initCalculator({
    slug: "customer-ltv",
    name: "Customer Lifetime Value Calculator",
    defaultRecommendation: "Use profit LTV, not revenue LTV, to judge what a customer is actually worth acquiring.",
    schema: [
      { name: "aov", fallback: 65 },
      { name: "ordersPerYear", fallback: 4 },
      { name: "lifespanYears", fallback: 3 },
      { name: "margin", fallback: 40 },
      { name: "cac", fallback: 40 }
    ],
    calculate(values) {
      const aov = Math.max(0, values.aov);
      const ordersPerYear = Math.max(0, values.ordersPerYear);
      const lifespanYears = Math.max(0, values.lifespanYears);
      const margin = JoraTools.clamp(values.margin / 100, 0, 1);
      const cac = Math.max(0, values.cac);

      const annualRevenuePerCustomer = aov * ordersPerYear;
      const revenueLTV = annualRevenuePerCustomer * lifespanYears;
      const profitLTV = revenueLTV * margin;
      const ltvToCac = cac > 0 ? profitLTV / cac : Infinity;
      const maxRecommendedCac = profitLTV / 3;

      let recommendation = "Current CAC leaves healthy room against lifetime value.";
      if (!Number.isFinite(ltvToCac)) {
        recommendation = "Add a CAC figure to see whether current acquisition spend is sustainable.";
      } else if (ltvToCac < 1) {
        recommendation = "Acquisition cost exceeds profit lifetime value. This is not sustainable as it stands.";
      } else if (ltvToCac < 3) {
        recommendation = "Below the commonly used 3:1 LTV:CAC target. Improve retention, margin, or acquisition cost.";
      }

      return {
        recommendation,
        metrics: [
          {
            label: "Revenue LTV",
            value: JoraTools.money(revenueLTV),
            note: `${JoraTools.number(lifespanYears, 1)} year customer lifespan`
          },
          {
            label: "Profit LTV",
            value: JoraTools.money(profitLTV),
            note: `At ${JoraTools.percent(values.margin, 0)} margin`
          },
          {
            label: "LTV : CAC",
            value: Number.isFinite(ltvToCac) ? JoraTools.multiple(ltvToCac) : "Add CAC",
            note: "Common target is 3:1 or higher"
          },
          {
            label: "Max recommended CAC",
            value: JoraTools.money(maxRecommendedCac),
            note: "At a 3:1 target ratio"
          }
        ],
        snapshot: {
          annualRevenuePerCustomer,
          revenueLTV,
          profitLTV,
          ltvToCac,
          maxRecommendedCac
        }
      };
    }
  });
});
