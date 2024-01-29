import Note from "@/components/note/Note";
import { Decimal } from "decimal.js";
import { StructuredProductType, StructuredProductUnderlyingAsset } from "@/constants";
import { Section } from "@/components/Section";
import { Chip } from "@/components/Chip";
import { Stack } from "@mui/material";

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

  return (
    <Section
      title={
        <Stack direction="row" alignItems="center" spacing={2}>
          eNote <Chip>Draft</Chip>
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
