import { GetServerSideProps } from "next";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BRCAccount, TokenInfo, getTokenInfo, watchBRC, watchCurrentPrice } from "@/web3/token";
import { ENoteInfo, Payment } from "@/types";
import { StructuredProductType, StructuredProductUnderlyingAsset } from "@/constants";
import { Decimal } from "decimal.js";
import { Container, Stack } from "@mui/material";
import { Token1 } from "@/sections/Token1";
import { Token2 } from "@/sections/Token2";
import { generateENoteName } from "@/utils";
import { useTicker } from "@/hooks/useTicker";
import { useWatch } from "@/hooks/useWatch";
import { addSeconds, isSameSecond } from "date-fns";
import { useReport } from "@/hooks/useReport";

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
    <Stack spacing={6}>
      <Token2
        note={note}
        payments={props.payments}
        now={props.now}
        balance={props.balance}
        currentUnderlyingPrice={props.currentUnderlyingPrice}
        brcAccount={props.brcAccount}
      />
      <Token1 note={note} units={props.balance} signer={signer} />
    </Stack>
  );
}

type PageProps = {
  mint: string;
};

export default function Page(props: PageProps) {
  const report = useReport();
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const provider = useMemo(
    () => anchorWallet && new anchor.AnchorProvider(connection, anchorWallet, { commitment: "confirmed" }),
    [connection, anchorWallet]
  );
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>();
  const tokenInfoRef = useRef(tokenInfo);
  tokenInfoRef.current = tokenInfo;
  const currentUnderlyingPrice = useWatch(watchCurrentPrice, provider, tokenInfo?.oraclePublicKey);
  const brcAccount = useWatch(watchBRC, provider, tokenInfo?.brcPublicKey);
  const now = useTicker(1000);

  const loadTokenInfo = useCallback(async () => {
    if (provider) {
      const value = await getTokenInfo(provider, props.mint);
      setTokenInfo(value);
      return value;
    }
  }, [provider, props.mint]);

  useEffect(() => {
    void loadTokenInfo();
  }, [anchorWallet]);

  const upcomingPayment = useMemo(() => tokenInfo?.payments.find((payment) => payment.status === "open"), [tokenInfo]);
  useEffect(() => {
    if (!now || !upcomingPayment) return;

    const checkpoints = [
      addSeconds(upcomingPayment.scheduledAt, 1),
      addSeconds(upcomingPayment.scheduledAt, 5),
      addSeconds(upcomingPayment.scheduledAt, 9),
    ];
    const shouldUpdate = checkpoints.some((checkpoint) => isSameSecond(now, checkpoint));

    if (shouldUpdate) {
      const before = tokenInfoRef.current?.payments.map((payment) => payment.status);
      void loadTokenInfo().then((tokenInfo) => {
        const after = tokenInfo?.payments.map((payment) => payment.status);
        if (before && after) {
          for (let i = 0; i < after.length; i++) {
            if (before[i] !== "settled" && after[i] === "settled") {
              report.success(
                tokenInfoRef.current?.payments[i].type === "coupon"
                  ? `You have received coupon payment (${i + 1}/2).`
                  : "You have received principal payment."
              );
            }
          }
        }
      });
    }
  }, [now, upcomingPayment]);

  if (!now || !tokenInfo || currentUnderlyingPrice === undefined || brcAccount === undefined) return null;

  return (
    <Container maxWidth="lg" sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
      <PageInner
        currentUnderlyingPrice={currentUnderlyingPrice}
        issuanceDate={tokenInfo.issuanceDate}
        principal={tokenInfo.principal}
        balance={tokenInfo.balance}
        payments={tokenInfo.payments}
        mint={tokenInfo.mint}
        brcAccount={brcAccount}
        now={now}
      />
    </Container>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  return { props: { mint: ctx.params!.mint as string } };
};
