import { PublicKey } from "@solana/web3.js";
import { ensure } from "@/utils";

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
export enum BRCType {
  European = "European",
  American = "American",
  DailyOnClose = "DailyOnClose",
}
export enum Currency {
  USDC = "USDC",
  "USDC.e" = "USDC.e",
  EUROe = "EUROe",
}
export enum CouponFrequency {
  DemoMode = "DemoMode",
  Annual = "Annual",
  SemiAnnual = "SemiAnnual",
  Quarterly = "Quarterly",
  BiMonthly = "BiMonthly",
  Monthly = "Monthly",
  AtMaturity = "AtMaturity",
}

export const MONEY_DECIMAL_PLACES = 2;
export const ISSUANCE_AMOUNT_MAX = 100_000_000_000;
export const STRUCTURED_PRODUCT_TYPE_NAMES: Record<StructuredProductType, string> = {
  CPN: "Capital Protection Note (CPN)",
  RC: "Reverse Convertible (RC)",
  BRC: "Barrier Reverse Convertible (BRC)",
  OC: "Outperformance Certificate (OC)",
};
export const STRUCTURED_PRODUCT_ASSET_NAMES: Record<StructuredProductUnderlyingAsset, string> = {
  BTC: "Bitcoin (BTC)",
  ETH: "Ethereum (ETH)",
  COIN: "Coinbase Global Inc (COIN)",
  NVDA: "Nvidia Corp (NVDA)",
  PYPL: "Paypal Holdings Inc (PYPL)",
  CLA: "WTI Crude Oil (CLA)",
};
export const STRUCTURED_PRODUCT_BARRIER_TYPE_NAMES: Record<BRCType, string> = {
  DailyOnClose: "Daily on close",
  American: "American",
  European: "European",
};
export const COUPON_FREQUENCY_NAMES: Record<CouponFrequency, string> = {
  DemoMode: "Demo mode",
  Annual: "Annual",
  SemiAnnual: "Semi-annual",
  Quarterly: "Quarterly",
  BiMonthly: "Bi-monthly",
  Monthly: "Monthly",
  AtMaturity: "At maturity",
};
export const STRUCTURED_PRODUCT_PROGRAM_ID = new PublicKey(
  ensure(
    process.env.NEXT_PUBLIC_STRUCTURED_PRODUCT_PROGRAM_ID,
    "NEXT_PUBLIC_STRUCTURED_PRODUCT_PROGRAM_ID is undefined"
  )
);
export const TREASURY_WALLET_PROGRAM_ID = new PublicKey(
  ensure(process.env.NEXT_PUBLIC_TREASURY_WALLET_PROGRAM_ID, "NEXT_PUBLIC_TREASURY_WALLET_PROGRAM_ID is undefined")
);
export const TRANSFER_SNAPSHOT_HOOK_PROGRAM_ID = new PublicKey(
  ensure(
    process.env.NEXT_PUBLIC_TRANSFER_SNAPSHOT_HOOK_PROGRAM_ID,
    "NEXT_PUBLIC_TRANSFER_SNAPSHOT_HOOK_PROGRAM_ID is undefined"
  )
);
export const API_URL = ensure(process.env.NEXT_PUBLIC_API_URL, "NEXT_PUBLIC_API_URL is undefined");
export const RPC_URL = ensure(process.env.NEXT_PUBLIC_RPC_URL, "NEXT_PUBLIC_RPC_URL is undefined");
