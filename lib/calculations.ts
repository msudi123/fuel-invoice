export const FUEL_LABELS: Record<string, string> = {
  AGO: "Automotive Gas Oil (AGO)",
  PMS: "Premium Motor Spirit (PMS)",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: "KSh",
  USD: "USD",
};

export function fuelLabel(code: string): string {
  return FUEL_LABELS[code] ?? code;
}

export function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol} ${formatted}`;
}

export function calcVat(subtotal: number, vatRate: number): number {
  return (subtotal * vatRate) / 100;
}

export function calcGrossProfit(sellingAmount: number, purchaseAmount: number): number {
  return sellingAmount - purchaseAmount;
}

export function calcGrossMargin(grossProfit: number, sellingAmount: number): number {
  if (sellingAmount === 0) return 0;
  return (grossProfit / sellingAmount) * 100;
}

export function calcInvoiceTotal(sellingAmount: number, vatEnabled: boolean, vatRate: number): number {
  const vat = vatEnabled ? calcVat(sellingAmount, vatRate) : 0;
  return sellingAmount + vat;
}
