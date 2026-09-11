document.addEventListener("DOMContentLoaded", () => {
  JoraTools.initCalculator({
    slug: "downtime-cost",
    name: "Downtime Cost Calculator",
    defaultRecommendation: "Weigh the annual cost of outages against what proactive support or monitoring would cost.",
    schema: [
      { name: "teamSize", fallback: 8 },
      { name: "hourlyCost", fallback: 35 },
      { name: "revenuePerHour", fallback: 200 },
      { name: "outageHours", fallback: 3 },
      { name: "outagesPerYear", fallback: 4 }
    ],
    calculate(values) {
      const teamSize = Math.max(0, values.teamSize);
      const hourlyCost = Math.max(0, values.hourlyCost);
      const revenuePerHour = Math.max(0, values.revenuePerHour);
      const outageHours = Math.max(0, values.outageHours);
      const outagesPerYear = Math.max(0, values.outagesPerYear);

      const staffCostPerHour = teamSize * hourlyCost;
      const costPerHourOfDowntime = staffCostPerHour + revenuePerHour;
      const costPerOutage = costPerHourOfDowntime * outageHours;
      const annualCost = costPerOutage * outagesPerYear;
      const budgetCeiling = annualCost / 12;

      let recommendation = "Occasional outages at this scale are unlikely to justify a dedicated support retainer.";
      if (annualCost >= 5000) {
        recommendation = "This is a meaningful annual cost. A support retainer or proactive monitoring is worth pricing against it.";
      } else if (annualCost >= 1500) {
        recommendation = "Worth reviewing what's causing the outages before paying for cover you may not need.";
      }

      return {
        recommendation,
        metrics: [
          {
            label: "Cost per hour of downtime",
            value: JoraTools.money(costPerHourOfDowntime),
            note: "Staff cost plus revenue at risk"
          },
          {
            label: "Cost per outage",
            value: JoraTools.money(costPerOutage),
            note: `${JoraTools.number(outageHours, 1)} hour outage`
          },
          {
            label: "Annual cost",
            value: JoraTools.money(annualCost),
            note: `At ${JoraTools.number(outagesPerYear, 0)} outages a year`
          },
          {
            label: "Monthly budget ceiling",
            value: JoraTools.money(budgetCeiling),
            note: "What prevention could cost and still break even"
          }
        ],
        snapshot: {
          staffCostPerHour,
          costPerHourOfDowntime,
          costPerOutage,
          annualCost,
          budgetCeiling
        }
      };
    }
  });
});
