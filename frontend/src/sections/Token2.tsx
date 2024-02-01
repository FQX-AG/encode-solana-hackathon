import { Section } from "@/components/Section";
import { Box, Divider, Stack } from "@mui/material";
import { Panel } from "@/components/Panel";
import { Property } from "@/components/Property";
import { Chip } from "@/components/Chip";
import { formatDecimal } from "@/formatters";
import React from "react";
import { ENoteInfo, Payment, QuoteInfo } from "@/types";
import { PaymentSchedule } from "@/components/paymentSchedule/PaymentSchedule";
import { Text } from "@/components/Text";
import { StructuredProductType } from "@/constants";
import { BRC } from "@/components/graphs/BRC";
import { Values } from "@/schemas/newIssuance";

export function Token2({
  note,
  values,
  quote,
  payments,
  underlyingAssetValue,
  now,
}: {
  note: ENoteInfo;
  values: Values;
  quote: QuoteInfo;
  payments: Payment[];
  underlyingAssetValue: number;
  now: Date;
}) {
  return (
    <Section title="Payment schedule">
      <Box display="grid" flex="1 1 auto" gridTemplateColumns="repeat(12, 1fr)" gap={6}>
        <Box gridColumn={{ xs: "span 12", xl: "span 8" }}>
          <Panel spacing={5}>
            <PaymentSchedule
              issuanceDate={note.issuanceDate}
              maturityDate={note.maturityDate}
              payments={payments}
              now={now}
            />
            <div />
          </Panel>
        </Box>
        <Box gridColumn={{ xs: "span 12", xl: "span 4" }}>
          <Panel spacing={3}>
            <Stack spacing={2}>
              <Property
                horizontal
                k={
                  <Stack direction="row" spacing={1} alignItems="center">
                    {`${note.structuredProductDetails.underlyingAsset} / ${note.currency}`}
                    <Chip sx={{ color: (theme) => theme.palette.info.main }}>Live</Chip>
                  </Stack>
                }
                v={<Text variant="500|32px|35px">{formatDecimal(underlyingAssetValue)}</Text>}
              />
              <Property horizontal k="Updated principal" v={`${note.currency} ${formatDecimal(note.principal)}`} />
              <Property horizontal k="Total coupon payment" v={`${note.currency} ${formatDecimal(note.coupon)}`} />
              <Property
                horizontal
                k="Total repayment"
                v={`${note.currency} ${formatDecimal(note.principal + note.coupon)}`}
              />
            </Stack>
            {values.type === StructuredProductType.BRC && (
              <>
                <Divider />
                <BRC
                  type={values.brcDetails.type}
                  barrier={values.brcDetails.level}
                  coupon={quote.absoluteCouponRate * 100}
                  underlyingAsset={values.underlyingAsset}
                  currency={values.currency}
                  issuanceAmount={values.totalIssuanceAmount}
                  initialFixingPrice={quote.initialFixingPrice.amount}
                />
              </>
            )}
          </Panel>
        </Box>
      </Box>
    </Section>
  );
}
