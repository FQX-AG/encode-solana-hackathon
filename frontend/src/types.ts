import { StructuredProductType, StructuredProductUnderlyingAsset } from "@/constants";

export type DeploymentInfo = {
  transactions: string[];
  mint: string;
  investorPublicKey: string;
  principal: string;
  coupon: string;
  supply: string;
  totalIssuanceAmount: string;
  initialFixingPrice: string;
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
