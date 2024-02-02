import { StructuredProductType, StructuredProductUnderlyingAsset } from "@/constants";

export type DeploymentInfo = {
  transactions: string[];
  mint: string;
  investorPublicKey: string;
  coupon: number;
};

export type ENoteInfo = {
  issuerName: string;
  maturityDate: Date | string;
  currency: string;
  principal: number;
  coupon: number;
  interestRate: number;
  eNoteName: string;
  issuanceDate: Date | string;
  eNoteContractAddress: string;
  signatureDate: Date | string;
  structuredProductDetails: {
    type: StructuredProductType;
    underlyingAsset: StructuredProductUnderlyingAsset;
  };
};

export type SignerInfo = {
  name: string;
};

export type Payment = {
  type: "coupon" | "principal";
  scheduledAt: Date;
  status: "scheduled" | "open" | "settled";
  currency: string;
  amount: number;
};

export type QuoteInfo = {
  id: string;
  issuerCountryCode: string;
  issuerName: string;
  initialFixingPrice: { currency: string; amount: number };
  yield: number;
  tags?: string[];
  totalCouponPayment: number;
  absoluteCouponRate: number;
  totalRepayment: number;
};
