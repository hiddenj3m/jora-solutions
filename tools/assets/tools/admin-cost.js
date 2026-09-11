document.addEventListener("DOMContentLoaded", () => {
  JoraTools.initCalculator({
    slug: "admin-cost",
    name: "Manual Admin Cost Calculator",
    defaultRecommendation: "Compare the annual cost of the manual process against what removing it would take to build.",
    schema: [
      { name: "hoursPerWeek", fallback: 6 },
      { name: "peopleCount", fallback: 2 },
      { name: "hourlyRate", fallback: 22 },
      { name: "automationReduction", fallback: 70 },
      { name: "automationCost", fallback: 1500 }
    ],
    calculate(values) {
      const hoursPerWeek = Math.max(0, values.hoursPerWeek);
      const peopleCount = Math.max(0, values.peopleCount);
      const hourlyRate = Math.max(0, values.hourlyRate);
      const reduction = JoraTools.clamp(values.automationReduction / 100, 0, 1);
      const automationCost = Math.max(0, values.automationCost);

      const weeklyCost = hoursPerWeek * peopleCount * hourlyRate;
      const annualCost = weeklyCost * 52;
      const annualHours = hoursPerWeek * peopleCount * 52;
      const annualSaving = annualCost * reduction;
      const hoursFreed = annualHours * reduction;
      const paybackMonths = annualSaving > 0 ? (automationCost / annualSaving) * 12 : Infinity;

      let recommendation = "The saving is real but modest. A quick process fix may be more proportionate than a full build.";
      if (Number.isFinite(paybackMonths) && paybackMonths <= 12 && annualSaving >= 1000) {
        recommendation = "This pays for itself within a year. Worth scoping as a proper implementation project.";
      } else if (annualSaving < 500) {
        recommendation = "The current cost is small. Revisit this once the process grows or more people are doing it.";
      }

      return {
        recommendation,
        metrics: [
          {
            label: "Current annual cost",
            value: JoraTools.money(annualCost),
            note: `${JoraTools.number(annualHours, 0)} hours a year`
          },
          {
            label: "Potential annual saving",
            value: JoraTools.money(annualSaving),
            note: `At ${JoraTools.percent(values.automationReduction, 0)} time removed`
          },
          {
            label: "Hours freed per year",
            value: JoraTools.number(hoursFreed, 0),
            note: "Time back for higher-value work"
          },
          {
            label: "Payback period",
            value: Number.isFinite(paybackMonths) ? `${JoraTools.number(paybackMonths, 1)} months` : "Not applicable",
            note: `Against ${JoraTools.money(automationCost)} build cost`
          }
        ],
        snapshot: {
          weeklyCost,
          annualCost,
          annualSaving,
          hoursFreed,
          paybackMonths
        }
      };
    }
  });
});
