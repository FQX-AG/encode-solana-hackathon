import * as anchor from "@coral-xyz/anchor";
import { StructuredNotesSdk, StructuredProductIDL, TransferSnapshotHookIDL, TreasuryWalletIDL } from "@fqx/programs";
import {
  STRUCTURED_PRODUCT_PROGRAM_ID,
  TRANSFER_SNAPSHOT_HOOK_PROGRAM_ID,
  TREASURY_WALLET_PROGRAM_ID,
} from "@/constants";

export function createSDK(provider: anchor.AnchorProvider) {
  const program = new anchor.Program(StructuredProductIDL, STRUCTURED_PRODUCT_PROGRAM_ID, provider);
  const treasuryWalletProgram = new anchor.Program(TreasuryWalletIDL, TREASURY_WALLET_PROGRAM_ID, provider);
  const transferSnapshotHookProgram = new anchor.Program(
    TransferSnapshotHookIDL,
    TRANSFER_SNAPSHOT_HOOK_PROGRAM_ID,
    provider
  );

  return new StructuredNotesSdk(provider, program, treasuryWalletProgram, transferSnapshotHookProgram);
}
