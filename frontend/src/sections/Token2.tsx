import { Section } from "@/components/Section";
import { Box, Divider, Stack } from "@mui/material";
import { Panel } from "@/components/Panel";
import { Property } from "@/components/Property";
import { Chip } from "@/components/Chip";
import { formatDecimal } from "@/formatters";
import React from "react";
import { ENoteInfo, Payment } from "@/types";
import { PaymentSchedule } from "@/components/paymentSchedule/PaymentSchedule";
import { Text } from "@/components/Text";
import { BRCType } from "@/constants";
import { BRC } from "@/components/graphs/BRC";
import { Decimal } from "decimal.js";

export function Token2(props: { note: ENoteInfo; payments: Payment[]; now: Date; balance: number }) {
  const underlyingAssetValue = 42_264;
  const initialFixingPrice = 43_000;
  const barrierLevel = 80;

  return (
    <Section title="Payment schedule">
      <Box display="grid" flex="1 1 auto" gridTemplateColumns="repeat(12, 1fr)" gap={6}>
        <Box gridColumn={{ xs: "span 12", xl: "span 8" }}>
          <Panel spacing={5}>
            <PaymentSchedule
              issuanceDate={props.note.issuanceDate}
              maturityDate={props.note.maturityDate}
              payments={props.payments}
              now={props.now}
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
                    {`${props.note.structuredProductDetails.underlyingAsset} / ${props.note.currency}`}
                    <Chip sx={{ color: (theme) => theme.palette.info.main }}>Live</Chip>
                  </Stack>
                }
                v={<Text variant="500|32px|35px">{formatDecimal(underlyingAssetValue)}</Text>}
              />
              <Property
                horizontal
                k="Updated principal"
                v={`${props.note.currency} ${formatDecimal(props.note.principal * props.balance)}`}
              />
              <Property
                horizontal
                k="Total coupon payment"
                v={`${props.note.currency} ${formatDecimal(props.note.coupon * props.balance)}`}
              />
              <Property
                horizontal
                k="Total repayment"
                v={`${props.note.currency} ${formatDecimal(
                  (props.note.principal + props.note.coupon) * props.balance
                )}`}
              />
            </Stack>
            <Divider />
            <BRC
              type={BRCType.European}
              barrier={barrierLevel}
              coupon={props.note.interestRate * 100}
              underlyingAsset={props.note.structuredProductDetails.underlyingAsset}
              currency={props.note.currency}
              issuanceAmount={new Decimal(props.note.principal).times(props.balance).toNumber()}
              initialFixingPrice={initialFixingPrice}
            />
          </Panel>
        </Box>
      </Box>
    </Section>
  );
}
