import * as anchor from "@coral-xyz/anchor";
import {
  BrcPriceAuthorityIDL,
  DummyOracleIDL,
  StructuredNotesSdk,
  StructuredProduct,
  StructuredProductIDL,
  TransferSnapshotHookIDL,
  TreasuryWalletIDL,
} from "@fqx/programs";
import {
  BRC_PRICE_AUTHORITY_PROGRAM_ID,
  DUMMY_ORACLE_PROGRAM_ID,
  STRUCTURED_PRODUCT_PROGRAM_ID,
  TRANSFER_SNAPSHOT_HOOK_PROGRAM_ID,
  TREASURY_WALLET_PROGRAM_ID,
} from "@/constants";
import { Program } from "@coral-xyz/anchor";

export function createSDK(provider: anchor.AnchorProvider) {
  const program = new anchor.Program(
    StructuredProductIDL,
    STRUCTURED_PRODUCT_PROGRAM_ID,
    provider
  ) as Program<StructuredProduct>;
  const treasuryWalletProgram = new anchor.Program(TreasuryWalletIDL, TREASURY_WALLET_PROGRAM_ID, provider);
  const transferSnapshotHookProgram = new anchor.Program(
    TransferSnapshotHookIDL,
    TRANSFER_SNAPSHOT_HOOK_PROGRAM_ID,
    provider
  );
  const dummyOracleProgram = new anchor.Program(DummyOracleIDL, DUMMY_ORACLE_PROGRAM_ID, provider);
  const brcPriceAuthorityProgram = new anchor.Program(BrcPriceAuthorityIDL, BRC_PRICE_AUTHORITY_PROGRAM_ID, provider);

  return new StructuredNotesSdk(
    provider,
    program,
    treasuryWalletProgram,
    transferSnapshotHookProgram,
    dummyOracleProgram,
    brcPriceAuthorityProgram
  );
}
