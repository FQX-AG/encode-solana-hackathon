import { CouponFrequency, StructuredProductType, StructuredProductUnderlyingAsset } from "@/constants";
import { Decimal } from "decimal.js";

export function ensure<T>(value: T | undefined | null, error: string): T {
  if (value === undefined || value === null) throw new Error(error);

  return value;
}
export const isValidDate = (value: string | Date) => !Number.isNaN(new Date(value).valueOf());
export const couponFrequencyToAmount = (couponFrequency: CouponFrequency) => {
  switch (couponFrequency) {
    case CouponFrequency.DemoMode:
      return 2;
  }
};

function getFormattedDate(date: Date) {
  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = date.toLocaleString("default", {
    month: "short",
    timeZone: "UTC",
  });
  const year = date.getFullYear().toString().slice(-2);
  return `${day}${month}${year}`;
}

export function generateENoteName(
  ticker: string,
  type: StructuredProductType,
  underlyingAsset: StructuredProductUnderlyingAsset,
  currency: string,
  maturityDate: Date,
  interestRate: number
): string {
  return [
    ticker,
    `${type} ${underlyingAsset}`,
    `${new Decimal(interestRate).times(100).toFixed(2)}%`,
    getFormattedDate(maturityDate),
    currency,
  ]
    .filter(Boolean)
    .join(" ");
}
