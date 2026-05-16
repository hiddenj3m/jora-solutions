document.addEventListener("DOMContentLoaded", () => {
  JoraTools.initCalculator({
    slug: "discount-margin",
    name: "Discount Margin Calculator",
    defaultRecommendation: "Protect margin before increasing discount depth.",
    schema: [
      { name: "price", fallback: 100 },
      { name: "margin", fallback: 65 },
      { name: "discount", fallback: 20 },
      { name: "orders", fallback: 100 }
    ],
    calculate(values) {
      const price = Math.max(0, values.price);
      const marginRate = JoraTools.clamp(values.margin / 100, 0, 1);
      const discountRate = JoraTools.clamp(values.discount / 100, 0, 0.95);
      const orders = Math.max(1, values.orders);

      const originalGrossProfit = price * marginRate;
      const costOfGoods = price - originalGrossProfit;
      const discountedPrice = price * (1 - discountRate);
      const discountedGrossProfit = discountedPrice - costOfGoods;
      const discountedMargin = JoraTools.safeDivide(discountedGrossProfit, discountedPrice, 0);
      const profitLostPerOrder = originalGrossProfit - discountedGrossProfit;
      const requiredOrders = discountedGrossProfit > 0
        ? Math.ceil((originalGrossProfit * orders) / discountedGrossProfit)
        : Infinity;
      const requiredLift = JoraTools.safeDivide(requiredOrders - orders, orders, Infinity);

      let recommendation = "The discount is workable if the campaign can reliably create the required order lift.";
      if (discountedGrossProfit <= 0) {
        recommendation = "Do not run this discount as-is. It removes contribution margin before acquisition costs are considered.";
      } else if (requiredLift > 0.5) {
        recommendation = "This discount needs a large volume jump. Try a bonus, bundle, guarantee or payment term before cutting price.";
      } else if (discountedMargin < 0.35) {
        recommendation = "The margin after discount is thin. Use the discount only with tight audience, urgency and upsell controls.";
      }

      return {
        recommendation,
        metrics: [
          {
            label: "Discounted price",
            value: JoraTools.money(discountedPrice),
            note: `${JoraTools.percent(values.discount, 0)} off`
          },
          {
            label: "Margin after discount",
            value: JoraTools.percent(discountedMargin * 100, 1),
            note: `${JoraTools.money(profitLostPerOrder)} profit lost/order`
          },
          {
            label: "Orders needed to break even",
            value: Number.isFinite(requiredOrders) ? JoraTools.number(requiredOrders) : "Not viable",
            note: Number.isFinite(requiredLift) ? `${JoraTools.percent(requiredLift * 100, 0)} lift required` : "Contribution below zero"
          },
          {
            label: "Monthly profit impact",
            value: JoraTools.money((discountedGrossProfit - originalGrossProfit) * orders),
            note: "At current order volume"
          }
        ],
        snapshot: {
          discountedPrice,
          discountedMargin,
          profitLostPerOrder,
          requiredOrders,
          requiredLift
        }
      };
    }
  });
});
