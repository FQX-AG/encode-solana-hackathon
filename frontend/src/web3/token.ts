import * as anchor from "@coral-xyz/anchor";
import { createSDK } from "@/web3/sdk";
import * as web3 from "@solana/web3.js";
import { ParsedAccountData, PublicKey } from "@solana/web3.js";
import { getPdaWithSeeds } from "@fqx/programs/tests/utils";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Payment } from "@/types";

export type TokenInfo = {
  payments: Payment[];
  balance: number;
  supply: number;
  principal: number;
  issuanceDate: Date;
  investorATA: PublicKey;
};

export async function getTokenInfo(provider: anchor.AnchorProvider, mint: web3.PublicKey): Promise<TokenInfo> {
  const sdk = createSDK(provider);

  // structuredProduct
  const { value: mintAccountInfo } = await sdk.provider.connection.getParsedAccountInfo(mint);
  const mintAuthority = new PublicKey((mintAccountInfo!.data as ParsedAccountData).parsed.info.mintAuthority);
  const structuredProduct = await sdk.program.account.structuredProduct.fetch(mintAuthority);

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
  for (let i = 0; i < snapshots.length; i++) {
    const snapshot = snapshots[i];
    const scheduledAt = new Date(activatedDate!.add(snapshot).toNumber() * 1000);
    const paymentPDA = await sdk.getPaymentPda(mint, false, activatedDate!.add(snapshot));
    const paymentPaidPDA = await getPdaWithSeeds(
      [paymentPDA.publicKey.toBuffer(), beneficiarySPATA.toBuffer()],
      sdk.program.programId
    );
    const { data } = await sdk.program.account.paymentPaid.fetchNullableAndContext(paymentPaidPDA.publicKey);

    payments.push({
      type: "coupon",
      status: data ? "settled" : "scheduled",
      scheduledAt,
      amount: snapshotBalances[i]!.toNumber(),
      currency: "USDC",
    });

    if (i === snapshots.length - 1) {
      payments.push({
        type: "principal",
        status: data ? "settled" : "scheduled",
        scheduledAt,
        amount: structuredProduct.issuancePaymentAmountPerUnit.muln(balance!).toNumber(),
        currency: "USDC",
      });
    }
  }

  return {
    payments,
    balance: balance!,
    supply: structuredProduct.supply.toNumber(),
    principal: structuredProduct.issuancePaymentAmountPerUnit.toNumber(),
    issuanceDate: new Date(structuredProduct.issuanceDate!.toNumber() * 1000),
    investorATA: investorATA,
  };
}
