import * as Yup from "yup";

import {
  BarrierType,
  Currencies,
  StructuredProductType,
  StructuredProductUnderlyingAsset,
  CouponFrequency,
  MONEY_DECIMAL_PLACES,
  ISSUANCE_AMOUNT_MAX,
} from "@/constants";
import { Decimal } from "decimal.js";

export const maxDecimalPlaces: Yup.TestConfig<number | undefined> = {
  name: "max-decimal-places",
  message: `$\{label\} must have no more than ${MONEY_DECIMAL_PLACES} decimal places.`,
  test: (value) => typeof value !== "number" || new Decimal(value).decimalPlaces() <= MONEY_DECIMAL_PLACES,
};

export const divisibleByPrincipal: Yup.TestConfig<number | undefined> = {
  name: "divisible-by-principal",
  message: "${label} must be divisible by the eNote denomination",
  test: (value, context) => !value || new Decimal(value).div(context.parent.principal).decimalPlaces() === 0,
};

export type FormValues = {
  type: string;
  underlyingAsset: string;
  totalIssuanceAmount: string;
  currency: string;
  principal: string;
  maturityDate: Date | null;
  couponFrequency: CouponFrequency;
  cpnDetails: {
    level: string;
  };
  rcDetails: {
    strike: string;
  };
  brcDetails: {
    level: string;
    type: string;
  };
};

export const initialValues: FormValues = {
  type: "",
  underlyingAsset: StructuredProductUnderlyingAsset.BTC,
  totalIssuanceAmount: (100_000).toString(),
  currency: Currencies.USDC,
  principal: (100_000).toString(),
  maturityDate: null,
  couponFrequency: CouponFrequency.DemoMode,
  cpnDetails: {
    level: "100",
  },
  rcDetails: {
    strike: "100",
  },
  brcDetails: {
    level: "100",
    type: BarrierType.European,
  },
};

type GenericValues<Type extends StructuredProductType, Params extends object> = {
  type: Type;
  underlyingAsset: StructuredProductUnderlyingAsset;
  totalIssuanceAmount: number;
  currency: string;
  principal: number;
  maturityDate: Date;
  couponFrequency: CouponFrequency;
} & Params;

export type Values =
  | GenericValues<StructuredProductType.OC, {}>
  | GenericValues<StructuredProductType.CPN, { cpnDetails: { level: number } }>
  | GenericValues<StructuredProductType.RC, { rcDetails: { strike: number } }>
  | GenericValues<StructuredProductType.BRC, { brcDetails: { level: number; type: BarrierType } }>;

export const validationSchema = Yup.object<Values>({
  type: Yup.string().label("Type").oneOf(Object.values(StructuredProductType)).required(),
  underlyingAsset: Yup.string()
    .label("Underlying asset")
    .oneOf(Object.values(StructuredProductUnderlyingAsset))
    .required(),
  totalIssuanceAmount: Yup.number()
    .label("Target issuance amount")
    .min(Yup.ref("principal"))
    .max(ISSUANCE_AMOUNT_MAX)
    .test(maxDecimalPlaces)
    .test(divisibleByPrincipal)
    .required(),
  currency: Yup.string().label("Currency").oneOf(Object.values(Currencies)).required(),
  principal: Yup.number().label("Denomination").moreThan(0).test(maxDecimalPlaces).required(),
  maturityDate: Yup.date().label("Maturity date").required(),
  couponFrequency: Yup.string().label("Coupon frequency").oneOf(Object.values(CouponFrequency)).required(),
  cpnDetails: Yup.object({
    level: Yup.number().label("Capital protection level").min(0).lessThan(10000).required(),
  })
    .required()
    .when("type", { is: StructuredProductType.CPN, otherwise: () => Yup.mixed().nullable().strip() }),
  rcDetails: Yup.object({
    strike: Yup.number().label("Strike").min(0).lessThan(10000).required(),
  })
    .required()
    .when("type", { is: StructuredProductType.RC, otherwise: () => Yup.mixed().nullable().strip() }),
  brcDetails: Yup.object({
    level: Yup.number().label("Barrier level").min(0).lessThan(10000).required(),
    type: Yup.string().label("Barrier type").oneOf(Object.values(BarrierType)).required(),
  })
    .required()
    .when("type", { is: StructuredProductType.BRC, otherwise: () => Yup.mixed().nullable().strip() }),
});