document.addEventListener("DOMContentLoaded", () => {
  JoraTools.initCalculator({
    slug: "lead-leakage",
    name: "Lead Leakage Calculator",
    defaultRecommendation: "Fixing follow-up on existing leads is usually cheaper than buying more of them.",
    schema: [
      { name: "monthlyLeads", fallback: 120 },
      { name: "leakRate", fallback: 20 },
      { name: "closeRate", fallback: 25 },
      { name: "dealValue", fallback: 800 },
      { name: "margin", fallback: 60 }
    ],
    calculate(values) {
      const monthlyLeads = Math.max(0, values.monthlyLeads);
      const leakRate = JoraTools.clamp(values.leakRate / 100, 0, 1);
      const closeRate = JoraTools.clamp(values.closeRate / 100, 0, 1);
      const dealValue = Math.max(0, values.dealValue);
      const margin = JoraTools.clamp(values.margin / 100, 0, 1);

      const leadsLost = monthlyLeads * leakRate;
      const dealsLost = leadsLost * closeRate;
      const revenueLostMonthly = dealsLost * dealValue;
      const profitLostMonthly = revenueLostMonthly * margin;
      const profitLostAnnual = profitLostMonthly * 12;

      let recommendation = "The leak is small at this volume. Keep an eye on it as lead volume grows.";
      if (profitLostAnnual >= 10000) {
        recommendation = "This is a significant annual loss. A CRM pipeline with ownership and reminders would likely pay for itself quickly.";
      } else if (profitLostAnnual >= 2500) {
        recommendation = "Worth fixing. Start with clear lead ownership and automatic follow-up reminders.";
      }

      return {
        recommendation,
        metrics: [
          {
            label: "Leads lost per month",
            value: JoraTools.number(leadsLost, 1),
            note: `${JoraTools.percent(values.leakRate, 0)} of ${JoraTools.number(monthlyLeads, 0)} leads`
          },
          {
            label: "Deals lost per month",
            value: JoraTools.number(dealsLost, 1),
            note: `At ${JoraTools.percent(values.closeRate, 0)} close rate`
          },
          {
            label: "Monthly profit lost",
            value: JoraTools.money(profitLostMonthly),
            note: "Deals that were never followed up"
          },
          {
            label: "Annual profit lost",
            value: JoraTools.money(profitLostAnnual),
            note: "At the current leak rate"
          }
        ],
        snapshot: {
          leadsLost,
          dealsLost,
          revenueLostMonthly,
          profitLostMonthly,
          profitLostAnnual
        }
      };
    }
  });
});
