document.addEventListener("DOMContentLoaded", () => {
  JoraTools.initCalculator({
    slug: "lead-value",
    name: "Lead Value Calculator",
    defaultRecommendation: "Improve close rate and lead quality before buying more volume.",
    schema: [
      { name: "dealValue", fallback: 1500 },
      { name: "margin", fallback: 60 },
      { name: "closeRate", fallback: 20 },
      { name: "leadCost", fallback: 60 },
      { name: "costShare", fallback: 35 }
    ],
    calculate(values) {
      const dealValue = Math.max(0, values.dealValue);
      const margin = JoraTools.clamp(values.margin / 100, 0, 1);
      const closeRate = JoraTools.clamp(values.closeRate / 100, 0, 1);
      const leadCost = Math.max(0, values.leadCost);
      const costShare = JoraTools.clamp(values.costShare / 100, 0.01, 1);

      const grossProfitPerCustomer = dealValue * margin;
      const expectedLeadValue = grossProfitPerCustomer * closeRate;
      const maxLeadCost = expectedLeadValue * costShare;
      const profitPerLead = expectedLeadValue - leadCost;
      const requiredCloseRate = JoraTools.safeDivide(leadCost, grossProfitPerCustomer, Infinity);

      let recommendation = "Lead cost is supportable if lead quality and sales follow-up stay consistent.";
      if (profitPerLead < 0) {
        recommendation = "Lead cost is too high for the current close rate. Improve qualification, follow-up or offer fit before scaling.";
      } else if (leadCost > maxLeadCost) {
        recommendation = "The lead is profitable, but acquisition is using too much value. Increase close rate before buying more leads.";
      }

      return {
        recommendation,
        metrics: [
          {
            label: "Expected lead value",
            value: JoraTools.money(expectedLeadValue),
            note: "Gross profit weighted by close rate"
          },
          {
            label: "Max lead cost",
            value: JoraTools.money(maxLeadCost),
            note: `${JoraTools.percent(values.costShare, 0)} of value`
          },
          {
            label: "Profit per lead",
            value: JoraTools.money(profitPerLead),
            note: profitPerLead >= 0 ? "After lead cost" : "Loss per lead"
          },
          {
            label: "Close rate needed",
            value: JoraTools.percent(requiredCloseRate * 100, 1),
            note: "To cover current lead cost"
          }
        ],
        snapshot: {
          grossProfitPerCustomer,
          expectedLeadValue,
          maxLeadCost,
          profitPerLead,
          requiredCloseRate
        }
      };
    }
  });
});
