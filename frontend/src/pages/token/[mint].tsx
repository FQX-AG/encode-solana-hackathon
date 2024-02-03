import { GetServerSideProps } from "next";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { BRCAccount, getTokenInfo, TokenInfo } from "@/web3/token";
import { ENoteInfo, Payment } from "@/types";
import { StructuredProductType, StructuredProductUnderlyingAsset } from "@/constants";
import { Decimal } from "decimal.js";
import { Stack } from "@mui/material";
import { Token1 } from "@/sections/Token1";
import { Token2 } from "@/sections/Token2";
import { generateENoteName } from "@/utils";
import { addSeconds, isSameSecond, isWithinInterval } from "date-fns";

function PageInner(props: {
  currentUnderlyingPrice: number;
  brcAccount: BRCAccount;
  issuanceDate: Date;
  principal: number;
  balance: number;
  payments: Payment[];
  mint: PublicKey;
  now: Date;
}) {
  const coupon = props.payments.reduce((acc, payment) => acc + (payment.type === "coupon" ? payment.amount : 0), 0);
  const interestRate = new Decimal(coupon).div(props.principal * props.balance).toNumber();
  const maturityDate = props.payments.at(-1)!.scheduledAt;
  const note: ENoteInfo = {
    issuerName: "France Company",
    maturityDate: maturityDate,
    currency: "USDC",
    principal: props.principal,
    coupon: new Decimal(coupon).div(props.balance).toNumber(),
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
    eNoteContractAddress: props.mint.toBase58(),
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
      <Token2
        note={note}
        payments={props.payments}
        now={props.now}
        balance={props.balance}
        currentUnderlyingPrice={props.currentUnderlyingPrice}
        brcAccount={props.brcAccount}
      />
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
  const upcomingPayment = useMemo(() => tokenInfo?.payments.find((payment) => payment.status === "open"), [tokenInfo]);
  const [now, setNow] = useState<Date>();

  console.log({ tokenInfo });

  useEffect(() => {
    const cb = () => setNow(new Date());
    cb();
    const intervalId = window.setInterval(cb, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const loadTokenInfo = useCallback(async () => {
    if (!anchorWallet) return;

    console.debug(`[${new Date().toISOString()}] loading token info`);
    const provider = new anchor.AnchorProvider(connection, anchorWallet, { commitment: "confirmed" });
    const mint = new web3.PublicKey(props.mint);
    setTokenInfo(await getTokenInfo(provider, mint));
  }, [anchorWallet]);

  useEffect(() => {
    void loadTokenInfo();
  }, [anchorWallet]);

  useEffect(() => {
    if (!now || !upcomingPayment) return;

    const checkpoints = [
      addSeconds(upcomingPayment.scheduledAt, 1),
      addSeconds(upcomingPayment.scheduledAt, 5),
      addSeconds(upcomingPayment.scheduledAt, 9),
    ];
    const shouldUpdate = checkpoints.some((checkpoint) => isSameSecond(now, checkpoint));

    if (shouldUpdate) void loadTokenInfo();
  }, [now, upcomingPayment]);

  if (!now || !tokenInfo) return null;

  return (
    <PageInner
      currentUnderlyingPrice={tokenInfo.currentUnderlyingPrice}
      issuanceDate={tokenInfo.issuanceDate}
      principal={tokenInfo.principal}
      balance={tokenInfo.balance}
      payments={tokenInfo.payments}
      mint={tokenInfo.mint}
      brcAccount={tokenInfo.brcAccount}
      now={now}
    />
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  return { props: { mint: ctx.params!.mint as string } };
};
