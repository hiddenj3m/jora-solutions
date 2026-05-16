document.addEventListener("DOMContentLoaded", () => {
  JoraTools.initCalculator({
    slug: "cvr-impact",
    name: "CVR Impact Calculator",
    defaultRecommendation: "Prioritise conversion work where profit lift is large enough to matter.",
    schema: [
      { name: "visitors", fallback: 2500 },
      { name: "currentCvr", fallback: 2 },
      { name: "targetCvr", fallback: 3 },
      { name: "aov", fallback: 99 },
      { name: "margin", fallback: 65 },
      { name: "trafficCost", fallback: 1500 }
    ],
    calculate(values) {
      const visitors = Math.max(1, values.visitors);
      const currentCvr = JoraTools.clamp(values.currentCvr / 100, 0, 1);
      const targetCvr = JoraTools.clamp(values.targetCvr / 100, 0, 1);
      const aov = Math.max(0, values.aov);
      const margin = JoraTools.clamp(values.margin / 100, 0, 1);
      const trafficCost = Math.max(0, values.trafficCost);

      const currentConversions = visitors * currentCvr;
      const targetConversions = visitors * targetCvr;
      const extraConversions = targetConversions - currentConversions;
      const revenueLift = extraConversions * aov;
      const profitLift = revenueLift * margin;
      const currentCac = JoraTools.safeDivide(trafficCost, currentConversions, Infinity);
      const targetCac = JoraTools.safeDivide(trafficCost, targetConversions, Infinity);
      const cacImprovement = currentCac - targetCac;

      let recommendation = "The CVR lift has meaningful profit impact. Prioritise page clarity, proof and offer tests.";
      if (extraConversions <= 0) {
        recommendation = "The target CVR does not improve the model. Set a higher target or fix traffic quality first.";
      } else if (profitLift < 500) {
        recommendation = "The lift is useful but modest. Use fast copy, proof and CTA tests before a full rebuild.";
      }

      return {
        recommendation,
        metrics: [
          {
            label: "Monthly profit lift",
            value: JoraTools.money(profitLift),
            note: "Before extra fulfilment costs"
          },
          {
            label: "Extra conversions",
            value: JoraTools.number(extraConversions, 1),
            note: "At the same traffic volume"
          },
          {
            label: "Revenue lift",
            value: JoraTools.money(revenueLift),
            note: `${JoraTools.percent(values.currentCvr, 1)} to ${JoraTools.percent(values.targetCvr, 1)} CVR`
          },
          {
            label: "CAC improvement",
            value: JoraTools.money(cacImprovement, 0),
            note: `${JoraTools.money(currentCac)} to ${JoraTools.money(targetCac)}`
          }
        ],
        snapshot: {
          currentConversions,
          targetConversions,
          extraConversions,
          revenueLift,
          profitLift,
          currentCac,
          targetCac,
          cacImprovement
        }
      };
    }
  });
});
