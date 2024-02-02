import { GetServerSideProps } from "next";
import React, { useEffect, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { getTokenInfo, TokenInfo } from "@/web3/token";
import { ENoteInfo, Payment } from "@/types";
import { StructuredProductType, StructuredProductUnderlyingAsset } from "@/constants";
import { Decimal } from "decimal.js";
import { Stack } from "@mui/material";
import { Token1 } from "@/sections/Token1";
import { Token2 } from "@/sections/Token2";
import { generateENoteName } from "@/utils";

function PageInner(props: {
  issuanceDate: Date;
  principal: number;
  balance: number;
  investorATA: PublicKey;
  payments: Payment[];
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const coupon = props.payments.reduce((acc, payment) => acc + (payment.type === "coupon" ? payment.amount : 0), 0);
  const interestRate = new Decimal(coupon).div(props.principal).toNumber();
  const maturityDate = props.payments.at(-1)!.scheduledAt;
  const note: ENoteInfo = {
    issuerName: "France Company",
    maturityDate: maturityDate,
    currency: "USDC",
    principal: props.principal,
    coupon: coupon,
    interestRate: interestRate,
    eNoteName: generateENoteName(
      "SWCI",
      StructuredProductType.BRC,
      StructuredProductUnderlyingAsset.BTC,
      "USDC",
      maturityDate,
      interestRate
    ),
    issuanceDate: props.issuanceDate,
    eNoteContractAddress: props.investorATA.toBase58(),
    signatureDate: props.issuanceDate,
    structuredProductDetails: {
      type: StructuredProductType.BRC,
      underlyingAsset: StructuredProductUnderlyingAsset.BTC,
    },
  };
  const signer = { name: "John Doe" };

  return (
    <Stack spacing={6}>
      <Token1 note={note} units={props.balance} signer={signer} />
      <Token2 note={note} payments={props.payments} now={now} balance={props.balance} />
    </Stack>
  );
}

type PageProps = {
  mint: string;
};

export default function Page(props: PageProps) {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>();

  useEffect(() => {
    (async () => {
      if (!anchorWallet) return;

      const provider = new anchor.AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });
      const mint = new web3.PublicKey(props.mint);
      setTokenInfo(await getTokenInfo(provider, mint));
    })();
  }, [anchorWallet]);

  if (!tokenInfo) return null;

  return (
    <PageInner
      issuanceDate={tokenInfo.issuanceDate}
      principal={tokenInfo.principal}
      balance={tokenInfo.balance}
      investorATA={tokenInfo.investorATA}
      payments={tokenInfo.payments}
    />
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  return { props: { mint: ctx.params!.mint as string } };
};
