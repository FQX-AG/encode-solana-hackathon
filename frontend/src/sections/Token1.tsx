import { Section } from "@/components/Section";
import { Box, Stack } from "@mui/material";
import { Text } from "@/components/Text";
import MUILink from "@mui/material/Link";
import OpenInNew from "@mui/icons-material/OpenInNew";
import Note from "@/components/note/Note";
import { Decimal } from "decimal.js";
import React from "react";
import { ENoteInfo, SignerInfo } from "@/types";

export function Token1({ note, units, signer }: { note: ENoteInfo; units: number; signer: SignerInfo }) {
  return (
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
              href={`https://solscan.io/account/${note.eNoteContractAddress}?cluster=devnet`}
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
  );
}
