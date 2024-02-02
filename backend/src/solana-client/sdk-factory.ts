import { AnchorProvider, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import {
  DummyOracleIDL,
  StructuredNotesSdk,
  StructuredProductIDL,
  TransferSnapshotHookIDL,
  TreasuryWalletIDL,
} from '@fqx/programs';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SOLANA_PROVIDER } from './contants';

@Injectable()
export class SdkFactory {
  constructor(
    @Inject(SOLANA_PROVIDER)
    private readonly provider: AnchorProvider,
    private configService: ConfigService,
  ) {}

  getSdkForSigner = (signer: Keypair) => {
    const structuredProductProgramId = new PublicKey(
      this.configService.get<string>('STRUCTURED_PRODUCT_PROGRAM_ID'),
    );

    const treasuryWalletProgramId = new PublicKey(
      this.configService.get<string>('TREASURY_WALLET_PROGRAM_ID'),
    );

    const transferSnapshotHookProgramId = new PublicKey(
      this.configService.get<string>('TRANSFER_HOOK_PROGRAM_ID'),
    );

    const dummyOracleProgramId = new PublicKey(
      this.configService.get<string>('DUMMY_ORACLE_PROGRAM_ID'),
    );

    const structuredProductProgram = new Program(
      StructuredProductIDL,
      structuredProductProgramId,
      this.provider,
    );

    const treasuryWalletProgram = new Program(
      TreasuryWalletIDL,
      treasuryWalletProgramId,
      this.provider,
    );

    const transferSnapshotHookProgram = new Program(
      TransferSnapshotHookIDL,
      transferSnapshotHookProgramId,
      this.provider,
    );

    const dummyOracleProgram = new Program(
      DummyOracleIDL,
      dummyOracleProgramId,
      this.provider,
    );

    return new StructuredNotesSdk(
      this.provider,
      structuredProductProgram,
      treasuryWalletProgram,
      transferSnapshotHookProgram,
      dummyOracleProgram,
    );
  };
}
