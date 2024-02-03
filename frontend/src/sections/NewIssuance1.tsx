import { Section } from "@/components/Section";
import { Panel } from "@/components/Panel";
import { WithSideContent } from "@/components/WithSideContent";
import { Box, Stack } from "@mui/material";
import { SelectField } from "@/components/form/SelectField";
import {
  BRCType,
  COUPON_FREQUENCY_NAMES,
  CouponFrequency,
  Currency,
  STRUCTURED_PRODUCT_ASSET_NAMES,
  STRUCTURED_PRODUCT_BARRIER_TYPE_NAMES,
  STRUCTURED_PRODUCT_TYPE_NAMES,
  StructuredProductType,
  StructuredProductUnderlyingAsset,
} from "@/constants";
import { NumericField } from "@/components/form/NumericField";
import { DateTimeField } from "@/components/form/DateTimeField";
import { formatDecimal } from "@/formatters";
import { useFormikContext } from "formik";
import { FormValues } from "@/schemas/newIssuance";
import { ExternalLink } from "@/components/ExternalLink";
import React from "react";

const typeOptions: [string, string, boolean][] = Object.entries(STRUCTURED_PRODUCT_TYPE_NAMES).map(([key, value]) => [
  key,
  value,
  key === StructuredProductType.BRC,
]);

const underlyingAssetOptions: [string, string, boolean][] = Object.entries(STRUCTURED_PRODUCT_ASSET_NAMES).map(
  ([key, value]) => [key, value, key === StructuredProductUnderlyingAsset.BTC]
);

const brcTypeOptions: [string, string, boolean][] = Object.entries(STRUCTURED_PRODUCT_BARRIER_TYPE_NAMES).map(
  ([key, value]) => [key, value, key === BRCType.European]
);

const currencyOptions: [string, string, boolean][] = Object.entries(Currency).map(([key, value]) => [
  key,
  value,
  key === Currency.USDC,
]);

const principalOptions: [number, string, boolean][] = [1_000, 10_000, 100_000, 1_000_000].map((key) => [
  key,
  formatDecimal(key),
  true,
]);

const couponFrequencyOptions: [string, string, boolean][] = Object.entries(COUPON_FREQUENCY_NAMES).map(
  ([key, value]) => [key, value, key === CouponFrequency.DemoMode]
);

export function NewIssuance1() {
  const formik = useFormikContext<FormValues>();

  return (
    <Section title="Create a request" description="Enter the details for creating your issuance program quote request.">
      <Panel spacing={3}>
        <WithSideContent side={<WithSideContent.Side>Product type</WithSideContent.Side>}>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <SelectField name="type" id="type" label="Type" options={typeOptions} sx={{ flex: "1 1 307px" }} />
            <SelectField
              name="underlyingAsset"
              id="underlyingAsset"
              label="Underlying asset"
              options={underlyingAssetOptions}
              sx={{ flex: "1 1 307px" }}
            />
          </Stack>
        </WithSideContent>
        {formik.values.type === StructuredProductType.BRC && (
          <WithSideContent side={<WithSideContent.Side>Barrier</WithSideContent.Side>}>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <NumericField
                name="brcDetails.level"
                id="brcDetails.level"
                label="Barrier level"
                sx={{ flex: "1 1 307px" }}
                hasFixedDecimalScale={true}
                endAdornment={<Box sx={{ color: (theme) => theme.customColors.oxfordBlue500 }}>%</Box>}
              />
              <SelectField
                name="brcDetails.type"
                id="brcDetails.type"
                label="Barrier type"
                options={brcTypeOptions}
                sx={{ flex: "1 1 307px" }}
              />
            </Stack>
          </WithSideContent>
        )}
        <WithSideContent side={<WithSideContent.Side>Issuance amount</WithSideContent.Side>}>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <SelectField
              name="currency"
              id="currency"
              label="Currency"
              options={currencyOptions}
              sx={{ flex: "1 1 130px" }}
            />
            <NumericField
              name="totalIssuanceAmount"
              id="totalIssuanceAmount"
              label="Target issuance amount"
              sx={{ flex: "2 1 230px" }}
            />
            <SelectField
              name="principal"
              id="principal"
              label="eNote denomination"
              options={principalOptions}
              sx={{ flex: "2 1 230px" }}
            />
          </Stack>
        </WithSideContent>
        <WithSideContent side={<WithSideContent.Side>Payment details</WithSideContent.Side>}>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <DateTimeField name="maturityDate" id="maturityDate" label="Maturity date" sx={{ flex: "1 1 307px" }} />
            <SelectField
              name="couponFrequency"
              id="couponFrequency"
              label="Coupon frequency"
              options={couponFrequencyOptions}
              sx={{ flex: "1 1 307px" }}
            />
          </Stack>
        </WithSideContent>
        <WithSideContent side={null}>
          <Box
            sx={{
              px: 2,
              py: 2,
              color: (theme) => theme.customColors.oxfordBlue500,
              background: (theme) => theme.palette.background.paper,
            }}
          >
            For demonstration purposes, we assume each product has a one-year lifecycle, but we accelerate it to five
            minutes with two equal coupons generated: one in the middle of the lifecycle and one at maturity. Don’t
            worry, we will send you test-USDC to cover your investment, but make sure you have SOL first. Use the{" "}
            <ExternalLink href="https://faucet.solana.com/" color="inherit">
              faucet
            </ExternalLink>
            .
          </Box>
        </WithSideContent>
      </Panel>
    </Section>
  );
}
