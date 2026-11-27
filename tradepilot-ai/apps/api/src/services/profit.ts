export interface ProfitInput {
  salePrice: number;
  supplierCost: number;
  shipping: number;
  platformFees: number;
  paymentFees: number;
  advertisingCost: number;
  returnsReserve: number;
  taxAndDuty: number;
  currency?: string;
}

export function calculateProfit(input: ProfitInput) {
  const values = Object.entries(input).filter(([key]) => key !== "currency");
  for (const [key, value] of values) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`Invalid non-negative number for ${key}`);
    }
  }
  if (input.salePrice <= 0) throw new Error("salePrice must be greater than zero");

  const totalCosts = input.supplierCost + input.shipping + input.platformFees +
    input.paymentFees + input.advertisingCost + input.returnsReserve + input.taxAndDuty;
  const netProfit = input.salePrice - totalCosts;
  const roi = input.supplierCost > 0 ? (netProfit / input.supplierCost) * 100 : null;
  const margin = (netProfit / input.salePrice) * 100;

  return {
    currency: input.currency || "USD",
    salePrice: round(input.salePrice),
    totalCosts: round(totalCosts),
    netProfit: round(netProfit),
    roiPercent: roi === null ? null : round(roi),
    marginPercent: round(margin),
    breakEvenPrice: round(totalCosts),
    profitable: netProfit > 0
  };
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
