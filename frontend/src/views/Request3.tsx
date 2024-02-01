import { Values } from "@/schemas/newIssuance";
import { DeploymentInfo, Payment, QuoteInfo } from "@/types";
import { useConnection } from "@solana/wallet-adapter-react";
import { useReport } from "@/hooks/useReport";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_2022_PROGRAM_ID, unpackAccount } from "@solana/spl-token";
import { StructuredProductType, StructuredProductUnderlyingAsset } from "@/constants";
import { Stack } from "@mui/material";
import { Token1 } from "@/sections/Token1";
import { Token2 } from "@/sections/Token2";
import { addMilliseconds, differenceInMilliseconds, isAfter } from "date-fns";
import { Decimal } from "decimal.js";

export function getFormattedDate(date: Date) {
  const day = date.getUTCDate().toString().padStart(2, "0");
  const month = date.toLocaleString("default", {
    month: "short",
    timeZone: "UTC",
  });
  const year = date.getFullYear().toString().slice(-2);
  return `${day}${month}${year}`;
}

export function generateENoteName(
  ticker: string,
  type: StructuredProductType,
  underlyingAsset: StructuredProductUnderlyingAsset,
  currency: string,
  maturityDate: Date,
  interestRate: number
): string {
  return [
    ticker,
    `${type} ${underlyingAsset}`,
    `${new Decimal(interestRate).times(100).toFixed(2)}%`,
    getFormattedDate(maturityDate),
    currency,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function Request3(props: {
  values: Values;
  deploymentInfo: DeploymentInfo;
  issuanceDate: Date;
  quote: QuoteInfo;
  investorATA: PublicKey;
}) {
  const report = useReport();
  const { connection } = useConnection();
  const [tokenBalance, setTokenBalance] = useState<bigint>();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const fetchInfo = useCallback(async () => {
    try {
      const investorTokenAccountInfo = await connection.getAccountInfo(props.investorATA);
      const investorTokenAccount = unpackAccount(props.investorATA, investorTokenAccountInfo, TOKEN_2022_PROGRAM_ID);
      setTokenBalance(investorTokenAccount.amount);
    } catch (e) {
      report.error(e);
    }
  }, [connection, props.deploymentInfo.mint]);

  useEffect(() => {
    void fetchInfo();
  }, [fetchInfo]);

  const note = {
    issuerName: props.quote.issuerName,
    maturityDate: props.values.maturityDate,
    currency: props.values.currency,
    principal: props.values.totalIssuanceAmount,
    coupon: props.quote.totalCouponPayment,
    interestRate: props.quote.absoluteCouponRate,
    eNoteName: generateENoteName(
      "SWCI",
      props.values.type,
      props.values.underlyingAsset,
      props.values.currency,
      props.values.maturityDate,
      props.quote.absoluteCouponRate
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
  const payments = useMemo<Payment[]>(() => {
    const timeSpanInMilliseconds = differenceInMilliseconds(note.maturityDate, note.issuanceDate);
    const timeStepInMilliseconds = timeSpanInMilliseconds / 2;
    const items: Payment[] = [];
    for (let i = 0; i < 2; i++) {
      const scheduledAt = addMilliseconds(note.issuanceDate, timeStepInMilliseconds * (i + 1));
      items.push({
        type: "coupon",
        scheduledAt,
        status: isAfter(now, scheduledAt) ? "settled" : "scheduled",
        amount: new Decimal(note.coupon).div(2).toNumber(),
        currency: note.currency,
      });
    }
    items.push({
      type: "principal",
      scheduledAt: note.maturityDate,
      status: isAfter(now, note.maturityDate) ? "settled" : "scheduled",
      amount: note.principal,
      currency: note.currency,
    });
    const nextPayment = items.find((item) => item.status === "scheduled");
    if (nextPayment) nextPayment.status = "open";
    return items;
  }, [note.issuanceDate, note.maturityDate, now]);

  if (tokenBalance === undefined) return null;

  return (
    <Stack spacing={6}>
      <Token1 note={note} units={Number(tokenBalance)} signer={signer} />
      <Token2
        note={note}
        payments={payments}
        values={props.values}
        quote={props.quote}
        underlyingAssetValue={props.quote.initialFixingPrice.amount}
        now={now}
      />
    </Stack>
  );
}
