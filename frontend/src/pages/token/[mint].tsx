import { GetServerSideProps } from "next";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { TokenInfo, getTokenInfo, watchBRC, watchCurrentPrice } from "@/web3/token";
import { useTicker } from "@/hooks/useTicker";
import { useWatch } from "@/hooks/useWatch";
import { addSeconds, isSameSecond } from "date-fns";
import { useReport } from "@/hooks/useReport";
import Token from "@/views/Token";

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
  const currentUnderlyingPrice = useWatch(
    watchCurrentPrice,
    tokenInfo?.paymentMint.toBase58(),
    provider,
    tokenInfo?.oraclePublicKey
  );
  const brcAccount = useWatch(watchBRC, tokenInfo?.paymentMint.toBase58(), provider, tokenInfo?.brcPublicKey);
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
    <Token
      currentUnderlyingPrice={currentUnderlyingPrice}
      issuanceDate={tokenInfo.issuanceDate}
      principal={tokenInfo.principal}
      balance={tokenInfo.balance}
      payments={tokenInfo.payments}
      mint={tokenInfo.mint}
      brcAccount={brcAccount}
      now={now}
    />
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  return { props: { mint: ctx.params!.mint as string } };
};
