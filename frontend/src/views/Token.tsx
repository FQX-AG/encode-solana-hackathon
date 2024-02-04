import { BRCAccount } from "@/web3/token";
import { ENoteInfo, Payment } from "@/types";
import { PublicKey } from "@solana/web3.js";
import { Decimal } from "decimal.js";
import { generateENoteName } from "@/utils";
import { StructuredProductType, StructuredProductUnderlyingAsset } from "@/constants";
import { Container, Stack } from "@mui/material";
import { Token2 } from "@/sections/Token2";
import { Token1 } from "@/sections/Token1";
import React from "react";

export default function Token(props: {
  currentUnderlyingPrice: number;
  brcAccount: BRCAccount;
  issuanceDate: Date;
  principal: number;
  balance: number;
  payments: Payment[];
  mint: PublicKey;
  now: Date;
}) {
  const payments = props.payments.map((payment) =>
    payment.type === "principal"
      ? { ...payment, amount: (props.brcAccount.finalPrincipal ?? props.brcAccount.initialPrincipal) * props.balance }
      : payment
  );
  const coupon = payments.reduce((acc, payment) => acc + (payment.type === "coupon" ? payment.amount : 0), 0);
  const interestRate = new Decimal(coupon).div(props.principal * props.balance).toNumber();
  const maturityDate = payments.at(-1)!.scheduledAt;
  const note: ENoteInfo = {
    issuerName: "France Company",
    maturityDate: maturityDate,
    currency: "USDC",
    principal: props.principal,
    coupon: new Decimal(coupon).div(props.balance).toNumber(),
    interestRate: interestRate,
    eNoteName: generateENoteName(
      "DEMO",
      StructuredProductType.BRC,
      StructuredProductUnderlyingAsset.BTC,
      "USDC",
      maturityDate,
      interestRate
    ),
    issuanceDate: props.issuanceDate,
    eNoteContractAddress: props.mint.toBase58(),
    signatureDate: props.issuanceDate,
    structuredProductDetails: {
      type: StructuredProductType.BRC,
      underlyingAsset: StructuredProductUnderlyingAsset.BTC,
    },
  };
  const signer = { name: "John Doe" };

  return (
    <Container maxWidth="lg" sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
      <Stack spacing={6}>
        <Token2
          note={note}
          payments={payments}
          now={props.now}
          balance={props.balance}
          currentUnderlyingPrice={props.currentUnderlyingPrice}
          brcAccount={props.brcAccount}
        />
        <Token1 note={note} units={props.balance} signer={signer} />
      </Stack>
    </Container>
  );
}
