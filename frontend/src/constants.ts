import { formatDecimal } from "@/formatters";

export enum StructuredProductType {
  CPN = "CPN",
  RC = "RC",
  BRC = "BRC",
  OC = "OC",
}
export enum StructuredProductUnderlyingAsset {
  BTC = "BTC",
  ETH = "ETH",
  COIN = "COIN",
  NVDA = "NVDA",
  PYPL = "PYPL",
  CLA = "CLA",
}
export enum BarrierType {
  European = "European",
  American = "American",
  DailyOnClose = "DailyOnClose",
}
export enum Currencies {
  USDC = "USDC",
}
export enum CouponFrequency {
  DemoMode = "DemoMode",
}

export const MONEY_DECIMAL_PLACES = 2;
export const ISSUANCE_AMOUNT_MAX = 100_000_000_000;
export const STRUCTURED_PRODUCT_TYPE_NAMES: Record<StructuredProductType, string> = {
  CPN: "Capital Protection Note",
  RC: "Reverse Convertible",
  BRC: "Barrier Reverse Convertible",
  OC: "Outperformance Certificate",
};
export const STRUCTURED_PRODUCT_ASSET_NAMES: Record<StructuredProductUnderlyingAsset, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  COIN: "Coinbase Global Inc",
  NVDA: "Nvidia Corp",
  PYPL: "Paypal Holdings Inc",
  CLA: "WTI Crude Oil",
};
export const STRUCTURED_PRODUCT_BARRIER_TYPE_NAMES: Record<BarrierType, string> = {
  DailyOnClose: "Daily on close",
  American: "American",
  European: "European",
};
export const COUPON_FREQUENCY_OPTIONS: Record<CouponFrequency, string> = {
  DemoMode: "Demo mode",
};
export const PRINCIPAL_OPTIONS: [number, string][] = [1_000, 10_000, 100_000, 1_000_000].map((key) => [
  key,
  formatDecimal(key),
]);
