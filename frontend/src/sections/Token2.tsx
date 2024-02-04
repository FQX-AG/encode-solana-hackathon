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
import { BRCAccount } from "@/web3/token";
import Image from "next/image";

export function Token2(props: {
  note: ENoteInfo;
  payments: Payment[];
  now: Date;
  balance: number;
  currentUnderlyingPrice: number;
  brcAccount: BRCAccount;
}) {
  return (
    <Section title="Payment schedule">
      <Box display="grid" flex="1 1 auto" gridTemplateColumns="1fr 430px" gap={6}>
        <Box gridColumn={{ xs: "span 2", lg: "1" }}>
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
        <Box marginInline="auto" maxWidth="430px" gridColumn={{ xs: "span 2", lg: "2" }}>
          <Panel spacing={3}>
            <Stack spacing={2}>
              <Property
                horizontal
                k={
                  <Stack direction="row" spacing={1} alignItems="center">
                    {`${props.note.structuredProductDetails.underlyingAsset} / ${props.note.currency}`}
                    {props.brcAccount.finalFixingDate ? (
                      <Chip sx={{ color: (theme) => theme.palette.info.main }}>Final</Chip>
                    ) : (
                      <Image
                        src="/live-chip.gif"
                        alt="Live"
                        width={49}
                        height={27}
                        style={{ position: "relative", top: -2 }}
                      />
                      // <Chip sx={{ color: (theme) => theme.palette.warning.main }}>Live</Chip>
                    )}
                  </Stack>
                }
                v={
                  <Text variant="500|32px|35px">
                    {formatDecimal(
                      props.brcAccount.finalFixingPrice
                        ? props.brcAccount.finalFixingPrice
                        : props.currentUnderlyingPrice
                    )}
                  </Text>
                }
              />
              {props.brcAccount.finalPrincipal !== undefined ? (
                <Property
                  horizontal
                  k="Final Principal after fixing"
                  v={`${props.note.currency} ${formatDecimal(props.brcAccount.finalPrincipal * props.balance)}`}
                />
              ) : (
                <Property
                  horizontal
                  k="Initial Principal before fixing"
                  v={`${props.note.currency} ${formatDecimal(props.brcAccount.initialPrincipal * props.balance)}`}
                />
              )}
              <Property
                horizontal
                k="Total coupon payment"
                v={`${props.note.currency} ${formatDecimal(props.note.coupon * props.balance)}`}
              />
              <Property
                horizontal
                k="Total repayment"
                v={`${props.note.currency} ${formatDecimal(
                  ((props.brcAccount.finalPrincipal ?? props.brcAccount.initialPrincipal) + props.note.coupon) *
                    props.balance
                )}`}
              />
            </Stack>
            <Divider />
            <BRC
              type={BRCType.European}
              barrier={new Decimal(props.brcAccount.barrier).div(props.brcAccount.initialFixingPrice).toNumber() * 100}
              coupon={props.note.interestRate * 100}
              underlyingAsset={props.note.structuredProductDetails.underlyingAsset}
              currency={props.note.currency}
              issuanceAmount={new Decimal(props.note.principal).times(props.balance).toNumber()}
              initialFixingPrice={props.brcAccount.initialFixingPrice}
            />
          </Panel>
        </Box>
      </Box>
    </Section>
  );
}
