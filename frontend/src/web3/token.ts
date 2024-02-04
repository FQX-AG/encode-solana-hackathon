import * as anchor from "@coral-xyz/anchor";
import { createSDK } from "@/web3/sdk";
import * as web3 from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { getPdaWithSeeds } from "@fqx/programs/tests/utils";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getMint,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Payment } from "@/types";
import { BN } from "@coral-xyz/anchor";
import { BrcPriceAuthorityIDL } from "@fqx/programs";
import { IdlAccounts } from "@coral-xyz/anchor";
import { Decimal } from "decimal.js";

export type BRCAccount = {
  initialPrincipal: number;
  initialFixingPrice: number;
  barrier: number; // absolute
  finalPrincipal?: number;
  finalFixingPrice?: number;
  finalFixingDate?: Date;
};

export type TokenInfo = {
  payments: Payment[];
  balance: number;
  supply: number;
  principal: number;
  issuanceDate: Date;
  mint: PublicKey;
  paymentMint: PublicKey;
  currentUnderlyingPrice: number;
  oraclePublicKey: string;
  brcPublicKey: string;
};

async function getTransformedBrcAccount(
  provider: anchor.AnchorProvider,
  brcAccount: IdlAccounts<typeof BrcPriceAuthorityIDL>["barrierReverseConvertible"],
  mintBase58: string
) {
  return {
    initialPrincipal: await amountToUiAmount(provider, mintBase58, brcAccount.initialPrincipal),
    initialFixingPrice: await amountToUiAmount(provider, mintBase58, brcAccount.initialFixingPrice),
    barrier: await amountToUiAmount(provider, mintBase58, brcAccount.barrier),
    finalFixingDate: brcAccount.finalFixingDate ? new Date(brcAccount.finalFixingDate.toNumber() * 1000) : undefined,
    finalFixingPrice: brcAccount.finalUnderlyingFixingPrice
      ? await amountToUiAmount(provider, mintBase58, brcAccount.finalUnderlyingFixingPrice)
      : undefined,
    finalPrincipal: brcAccount.finalPrincipal
      ? await amountToUiAmount(provider, mintBase58, brcAccount.finalPrincipal)
      : undefined,
  };
}

async function amountToUiAmount(
  provider: anchor.AnchorProvider,
  mint: PublicKey | string,
  amount: number | string | BN
) {
  const { decimals } = await getMint(
    provider.connection,
    typeof mint === "string" ? new PublicKey(mint) : mint,
    undefined,
    TOKEN_2022_PROGRAM_ID
  );
  return new Decimal(amount instanceof BN ? amount.toString() : amount).div(10 ** decimals).toNumber();
}

export function watchBRC(
  provider: anchor.AnchorProvider,
  publicKeyBase58: string,
  mintBase58: string,
  fn: (account: BRCAccount) => void
) {
  console.debug(`[${new Date().toISOString()}] BRC watch start`);
  const publicKey = new PublicKey(publicKeyBase58);
  const sdk = createSDK(provider);
  const callback = async (account: any) => fn(await getTransformedBrcAccount(provider, account, mintBase58));
  const accountClient = sdk.brcProgram.account.barrierReverseConvertible;
  const emitter = accountClient.subscribe(publicKey).addListener("change", callback);
  accountClient.fetch(publicKey).then(callback);

  return async () => {
    console.debug(`[${new Date().toISOString()}] BRC watch stop`);
    emitter.removeAllListeners("change");
    sdk.brcProgram.account.barrierReverseConvertible.unsubscribe(publicKey);
  };
}

export function watchCurrentPrice(
  provider: anchor.AnchorProvider,
  publicKeyBase58: string,
  mintBase58: string,
  fn: (currentPrice: number) => void
) {
  console.debug(`[${new Date().toISOString()}] oracle watch start`);
  const publicKey = new PublicKey(publicKeyBase58);
  const sdk = createSDK(provider);
  const callback = async (account: any) => {
    const uiCurrentPrice = await amountToUiAmount(provider, mintBase58, account.currentPrice);
    if (uiCurrentPrice !== null) fn(uiCurrentPrice);
  };
  const accountClient = sdk.dummyOracleProgram.account.dummyOracleAccount;
  const emitter = accountClient.subscribe(publicKey).addListener("change", callback);
  accountClient.fetch(publicKey).then(callback);

  return () => {
    console.debug(`[${new Date().toISOString()}] oracle watch stop`);
    emitter.removeAllListeners("change");
    sdk.dummyOracleProgram.account.dummyOracleAccount.unsubscribe(publicKey);
  };
}

export async function getTokenInfo(provider: anchor.AnchorProvider, mintBase58: string): Promise<TokenInfo> {
  console.debug(`[${new Date().toISOString()}] loading token info`);
  const mint = new web3.PublicKey(mintBase58);
  const sdk = createSDK(provider);

  // structuredProduct
  const structuredProductPda = await getPdaWithSeeds([mint.toBuffer()], sdk.program.programId);
  const structuredProductPubKey = structuredProductPda.publicKey;
  const { supply, issuancePaymentMint, issuancePaymentAmountPerUnit, issuanceDate } =
    await sdk.program.account.structuredProductConfig.fetch(structuredProductPubKey);

  // payments
  const snapshotConfigPDA = await getPdaWithSeeds(
    [Buffer.from("snapshots"), mint.toBuffer()],
    sdk.transferSnapshotHookProgram.programId
  );
  const beneficiarySPATA = getAssociatedTokenAddressSync(
    mint,
    sdk.provider.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const snapshotConfig = await sdk.transferSnapshotHookProgram.account.snapshotConfig.fetch(
    snapshotConfigPDA.publicKey
  );
  const investorATA = getAssociatedTokenAddressSync(
    mint,
    provider.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  const {
    value: { uiAmount: balance },
  } = await sdk.provider.connection.getTokenAccountBalance(investorATA);
  const investorTokenSnapshotBalancesPDA = await getPdaWithSeeds(
    [mint.toBuffer(), investorATA.toBuffer()],
    sdk.transferSnapshotHookProgram.programId
  );
  const { snapshotBalances } = await sdk.transferSnapshotHookProgram.account.snapshotTokenAccountBalances.fetch(
    investorTokenSnapshotBalancesPDA.publicKey
  );
  const { activatedDate, snapshots } = snapshotConfig;
  let payments: Payment[] = [];
  let lastKnownBalance = new BN(0);
  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    const scheduledAt = new Date(activatedDate!.add(snapshot).toNumber() * 1000);
    const paymentPDA = await sdk.getPaymentPda(mint, false, snapshot);
    const paymentPaidPDA = await getPdaWithSeeds(
      [paymentPDA.publicKey.toBuffer(), beneficiarySPATA.toBuffer()],
      sdk.program.programId
    );
    const { data } = await sdk.program.account.paymentPaid.fetchNullableAndContext(paymentPaidPDA.publicKey);
    const { pricePerUnit } = await sdk.program.account.payment.fetch(paymentPDA.publicKey);

    const balance = (lastKnownBalance = snapshotBalances[i] ?? lastKnownBalance).toNumber();

    payments.push({
      type: "coupon",
      status: data ? "settled" : "scheduled",
      scheduledAt,
      amount: balance * (await amountToUiAmount(provider, issuancePaymentMint, pricePerUnit!)),
      currency: "USDC",
    });

    if (i === snapshots.length - 1) {
      payments.push({
        type: "principal",
        status: data ? "settled" : "scheduled",
        scheduledAt,
        amount: balance * (await amountToUiAmount(provider, issuancePaymentMint, issuancePaymentAmountPerUnit)),
        currency: "USDC",
      });
    }
  }
  const firstScheduledPayment = payments.find((payment) => payment.status === "scheduled");
  if (firstScheduledPayment) firstScheduledPayment.status = "open";

  const dummyOraclePda = await getPdaWithSeeds(
    [new PublicKey("HTDGotJ2EukPM8HsTgRroFXPStkUgszDB8MJf5Paf4c8").toBuffer(), Buffer.from("CRZYBTC")],
    sdk.dummyOracleProgram.programId
  );
  const { currentPrice } = await sdk.dummyOracleProgram.account.dummyOracleAccount.fetch(dummyOraclePda.publicKey);
  const brcPDA = await getPdaWithSeeds([structuredProductPubKey.toBuffer()], sdk.brcProgram.programId);

  return {
    payments,
    balance: balance!,
    supply: supply.toNumber(),
    principal: await amountToUiAmount(provider, issuancePaymentMint, issuancePaymentAmountPerUnit),
    issuanceDate: new Date(issuanceDate!.toNumber() * 1000),
    mint: mint,
    paymentMint: issuancePaymentMint,
    currentUnderlyingPrice: currentPrice.toNumber(),
    oraclePublicKey: dummyOraclePda.publicKey.toBase58(),
    brcPublicKey: brcPDA.publicKey.toBase58(),
  };
}
