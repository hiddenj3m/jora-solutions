document.addEventListener("DOMContentLoaded", () => {
  JoraTools.initCalculator({
    slug: "support-ticket-cost",
    name: "Support Ticket Cost Calculator",
    defaultRecommendation: "Compare pay-per-ticket support against a fixed retainer at your actual ticket volume.",
    schema: [
      { name: "ticketsPerMonth", fallback: 25 },
      { name: "avgResolutionMinutes", fallback: 45 },
      { name: "engineerHourlyCost", fallback: 40 },
      { name: "payPerTicketPrice", fallback: 75 },
      { name: "retainerMonthlyCost", fallback: 600 }
    ],
    calculate(values) {
      const ticketsPerMonth = Math.max(0, values.ticketsPerMonth);
      const avgResolutionMinutes = Math.max(0, values.avgResolutionMinutes);
      const engineerHourlyCost = Math.max(0, values.engineerHourlyCost);
      const payPerTicketPrice = Math.max(0, values.payPerTicketPrice);
      const retainerMonthlyCost = Math.max(0, values.retainerMonthlyCost);

      const hoursPerMonth = (ticketsPerMonth * avgResolutionMinutes) / 60;
      const internalCostPerMonth = hoursPerMonth * engineerHourlyCost;
      const payPerTicketCostPerMonth = ticketsPerMonth * payPerTicketPrice;
      const breakEvenTickets = JoraTools.safeDivide(retainerMonthlyCost, payPerTicketPrice, Infinity);
      const cheaperThisMonth = payPerTicketCostPerMonth <= retainerMonthlyCost ? "Pay-per-ticket" : "Retainer";

      let recommendation = `At this volume, pay-per-ticket support currently costs less than the retainer.`;
      if (cheaperThisMonth === "Retainer") {
        recommendation = "At this volume, a fixed retainer works out cheaper than paying per ticket.";
      }

      return {
        recommendation,
        metrics: [
          {
            label: "Hours of support a month",
            value: JoraTools.number(hoursPerMonth, 1),
            note: `${JoraTools.number(ticketsPerMonth, 0)} tickets`
          },
          {
            label: "Pay-per-ticket cost",
            value: JoraTools.money(payPerTicketCostPerMonth),
            note: `At ${JoraTools.money(payPerTicketPrice)} a ticket`
          },
          {
            label: "Retainer cost",
            value: JoraTools.money(retainerMonthlyCost),
            note: "Fixed monthly price"
          },
          {
            label: "Break-even volume",
            value: Number.isFinite(breakEvenTickets) ? `${JoraTools.number(breakEvenTickets, 1)} tickets/mo` : "Not applicable",
            note: `${cheaperThisMonth} is cheaper at your current volume`
          }
        ],
        snapshot: {
          hoursPerMonth,
          internalCostPerMonth,
          payPerTicketCostPerMonth,
          breakEvenTickets
        }
      };
    }
  });
});
