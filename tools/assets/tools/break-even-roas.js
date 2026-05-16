document.addEventListener("DOMContentLoaded", () => {
  JoraTools.initCalculator({
    slug: "break-even-roas",
    name: "Break-even ROAS Calculator",
    defaultRecommendation: "Compare platform ROAS to your actual profit floor before scaling.",
    schema: [
      { name: "adSpend", fallback: 1500 },
      { name: "margin", fallback: 65 },
      { name: "refundRate", fallback: 5 },
      { name: "fixedCosts", fallback: 250 },
      { name: "currentRoas", fallback: 2.5 }
    ],
    calculate(values) {
      const adSpend = Math.max(1, values.adSpend);
      const grossMargin = JoraTools.clamp(values.margin / 100, 0, 1);
      const refundRate = JoraTools.clamp(values.refundRate / 100, 0, 0.95);
      const netMargin = Math.max(grossMargin - refundRate, 0.01);
      const fixedCosts = Math.max(0, values.fixedCosts);
      const currentRoas = Math.max(0, values.currentRoas);

      const breakEvenRevenue = (adSpend + fixedCosts) / netMargin;
      const breakEvenRoas = breakEvenRevenue / adSpend;
      const currentRevenue = currentRoas * adSpend;
      const currentProfit = currentRevenue * netMargin - adSpend - fixedCosts;
      const roasHeadroom = currentRoas - breakEvenRoas;

      let recommendation = "Your ROAS has enough room above the floor for cautious testing.";
      if (roasHeadroom < 0) {
        recommendation = "Do not scale yet. The expected ROAS is below break-even after refunds and fixed costs.";
      } else if (roasHeadroom < 0.4) {
        recommendation = "This is close to the floor. Improve AOV, margin or conversion rate before increasing spend.";
      }

      return {
        recommendation,
        metrics: [
          {
            label: "Break-even ROAS",
            value: JoraTools.multiple(breakEvenRoas),
            note: "Minimum viable floor"
          },
          {
            label: "Revenue needed",
            value: JoraTools.money(breakEvenRevenue),
            note: `On ${JoraTools.money(adSpend)} spend`
          },
          {
            label: "Current profit estimate",
            value: JoraTools.money(currentProfit),
            note: `${JoraTools.multiple(currentRoas)} current ROAS`
          },
          {
            label: "ROAS headroom",
            value: JoraTools.multiple(roasHeadroom),
            note: roasHeadroom >= 0 ? "Above floor" : "Below floor"
          }
        ],
        snapshot: {
          netMargin,
          breakEvenRevenue,
          breakEvenRoas,
          currentProfit,
          roasHeadroom
        }
      };
    }
  });
});
