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

export interface ProfitBreakdown {
  supplierCost: number;
  shipping: number;
  platformFees: number;
  paymentFees: number;
  advertisingCost: number;
  returnsReserve: number;
  taxAndDuty: number;
}

export interface ProfitCalculationResult {
  currency: string;
  salePrice: number;
  totalCosts: number;
  netProfit: number;
  roiPercent: number | null;
  marginPercent: number;
  breakEvenPrice: number;
  profitable: boolean;
  costBreakdown: ProfitBreakdown;
}

const NUMERIC_COST_KEYS: ReadonlyArray<keyof Omit<ProfitInput, "currency">> = [
  "salePrice",
  "supplierCost",
  "shipping",
  "platformFees",
  "paymentFees",
  "advertisingCost",
  "returnsReserve",
  "taxAndDuty"
];

function toCents(value: number, fieldName: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid non-negative number for ${fieldName}`);
  }
  return Math.round(value * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

function roundRate(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateProfit(input: ProfitInput): ProfitCalculationResult {
  for (const key of NUMERIC_COST_KEYS) {
    toCents(input[key], key);
  }

  const salePriceCents = toCents(input.salePrice, "salePrice");
  if (salePriceCents <= 0) {
    throw new Error("salePrice must be greater than zero");
  }

  const supplierCostCents = toCents(input.supplierCost, "supplierCost");
  const shippingCents = toCents(input.shipping, "shipping");
  const platformFeesCents = toCents(input.platformFees, "platformFees");
  const paymentFeesCents = toCents(input.paymentFees, "paymentFees");
  const advertisingCostCents = toCents(input.advertisingCost, "advertisingCost");
  const returnsReserveCents = toCents(input.returnsReserve, "returnsReserve");
  const taxAndDutyCents = toCents(input.taxAndDuty, "taxAndDuty");

  const totalCostsCents =
    supplierCostCents +
    shippingCents +
    platformFeesCents +
    paymentFeesCents +
    advertisingCostCents +
    returnsReserveCents +
    taxAndDutyCents;

  const netProfitCents = salePriceCents - totalCostsCents;
  const roiPercent =
    supplierCostCents > 0 ? roundRate((netProfitCents / supplierCostCents) * 100) : null;
  const marginPercent = roundRate((netProfitCents / salePriceCents) * 100);
  const currency = (input.currency?.trim() || "USD").toUpperCase();

  return {
    currency,
    salePrice: fromCents(salePriceCents),
    totalCosts: fromCents(totalCostsCents),
    netProfit: fromCents(netProfitCents),
    roiPercent,
    marginPercent,
    breakEvenPrice: fromCents(totalCostsCents),
    profitable: netProfitCents > 0,
    costBreakdown: {
      supplierCost: fromCents(supplierCostCents),
      shipping: fromCents(shippingCents),
      platformFees: fromCents(platformFeesCents),
      paymentFees: fromCents(paymentFeesCents),
      advertisingCost: fromCents(advertisingCostCents),
      returnsReserve: fromCents(returnsReserveCents),
      taxAndDuty: fromCents(taxAndDutyCents)
    }
  };
}