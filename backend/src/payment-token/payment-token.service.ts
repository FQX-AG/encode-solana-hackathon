import { AnchorProvider } from '@coral-xyz/anchor';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { Keypair, PublicKey } from '@solana/web3.js';
import { SdkFactory } from 'src/solana-client/sdk-factory';
import { SOLANA_PROVIDER } from '../solana-client/contants';

@Injectable()
export class PaymentTokenService {
  constructor(
    @Inject(SOLANA_PROVIDER)
    private readonly provider: AnchorProvider,
    private configService: ConfigService,
    private sdkFactory: SdkFactory,
  ) {}

  async mintPaymentToken(owner: string, amountToMint: bigint) {
    const ownerPublicKey = new PublicKey(owner);
    const serverSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
    );
    const mintAuthority = Keypair.fromSecretKey(serverSecretKey);

    const mintAddress = new PublicKey(
      this.configService.get<string>('PAYMENT_TOKEN_MINT_ADDRESS'),
    );

    const ownerATA = getAssociatedTokenAddressSync(
      mintAddress,
      ownerPublicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const createOwnerATAIx = await createAssociatedTokenAccountInstruction(
      mintAuthority.publicKey,
      ownerATA,
      ownerPublicKey,
      mintAddress,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    const mintToIx = createMintToInstruction(
      mintAddress,
      ownerATA,
      mintAuthority.publicKey,
      amountToMint,
      [],
      TOKEN_2022_PROGRAM_ID,
    );

    const mintAuthoritySdk = this.sdkFactory.getSdkForSigner(mintAuthority);

    return await mintAuthoritySdk.sendAndConfirmV0Tx([
      createOwnerATAIx,
      mintToIx,
    ]);
  }
}
