import Note from "@/components/note/Note";
import { Decimal } from "decimal.js";
import { StructuredProductType, StructuredProductUnderlyingAsset } from "@/constants";
import { Section } from "@/components/Section";
import { Box, Stack } from "@mui/material";
import { Text } from "@/components/Text";
import OpenInNew from "@mui/icons-material/OpenInNew";
import MUILink from "@mui/material/Link";
import React from "react";
import { Property } from "@/components/Property";
import { formatDecimal } from "@/formatters";
import { Panel } from "@/components/Panel";
import { Chip } from "@/components/Chip";

export default function Page() {
  const note = {
    issuerName: "France Company ",
    maturityDate: new Date(),
    currency: "USDC",
    principal: 100_000,
    coupon: 5_000,
    interestRate: 0.05,
    eNoteName: "SWCI BTC BRC 5.00% 26Mar23 USDC",
    issuanceDate: new Date(),
    eNoteContractAddress: "0",
    signatureDate: new Date(),
    structuredProductDetails: {
      type: StructuredProductType.BRC,
      underlyingAsset: StructuredProductUnderlyingAsset.BTC,
    },
  };

  const signer = {
    name: "John Doe",
  };

  const units = 8;
  const underlyingAssetValue = 1;

  return (
    <>
      <Section
        title={
          <Stack direction="row" justifyContent="space-between" spacing={3}>
            <Box>
              Your eNotes{" "}
              <Text component="span" variant="500|18px|23px" color="oxfordBlue500">
                ({units} units)
              </Text>
            </Box>
            <Text variant="400|18px|20px">
              <MUILink
                href={`https://solscan.io/token/${note.eNoteContractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <span>See on Solscan</span> <OpenInNew sx={{ fontSize: "18px" }} />
              </MUILink>
            </Text>
          </Stack>
        }
      >
        <Note
          issuer={note.issuerName}
          maturityDate={note.maturityDate}
          currency={note.currency}
          principal={note.principal}
          coupon={note.coupon}
          interestRate={note.interestRate}
          name={note.eNoteName}
          issuanceDate={note.issuanceDate}
          address={note.eNoteContractAddress}
          signature={signer ? { signer: signer.name, date: note.signatureDate } : undefined}
          registrationAgreementUrl={"about:blank"}
          couponPaymentFrequency={"Custom"}
          couponPaymentAmount={new Decimal(note.coupon).div(2).toNumber()}
          structuredNote={note.structuredProductDetails}
        />
      </Section>
      <Box display="grid" flex="1 1 auto" gridTemplateColumns="repeat(12, 1fr)" gap={6}>
        <Box gridColumn={{ xs: "span 12", xl: "span 8" }}></Box>
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
                v={formatDecimal(underlyingAssetValue)}
              />
            </Stack>
            {/*{note.structuredProductDetails.type === StructuredProductType.BRC && (*/}
            {/*    <>*/}
            {/*      <Divider />*/}
            {/*      <BRC*/}
            {/*          type={values.brcDetails.type}*/}
            {/*          barrier={values.brcDetails.level}*/}
            {/*          coupon={quote.absoluteCouponRate * 100}*/}
            {/*          underlyingAsset={values.underlyingAsset}*/}
            {/*          currency={values.currency}*/}
            {/*          issuanceAmount={values.totalIssuanceAmount}*/}
            {/*          initialFixingPrice={quote.initialFixingPrice.amount}*/}
            {/*      />*/}
            {/*    </>*/}
            {/*)}*/}
          </Panel>
        </Box>
      </Box>
    </>
  );
}
