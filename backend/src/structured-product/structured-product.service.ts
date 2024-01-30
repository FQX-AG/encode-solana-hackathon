import * as anchor from '@coral-xyz/anchor';
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
import * as BN from 'bn.js';
import { randomInt } from 'crypto';
import { SdkFactory } from 'src/solana-client/sdk-factory';
import { SOLANA_PROVIDER } from '../solana-client/contants';
import { StructuredProductDeployDto } from './dtos/structured-product-deploy.dto';

@Injectable()
export class StructuredProductService {
  constructor(
    @Inject(SOLANA_PROVIDER)
    private readonly provider: AnchorProvider,
    private configService: ConfigService,
    private sdkFactory: SdkFactory,
  ) {}

  async deploy(structuredProductDeployDto: StructuredProductDeployDto) {
    const { investorPublicKey } = structuredProductDeployDto;

    const treasuryWallet = anchor.web3.Keypair.generate();

    const issuerSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('ISSUER_SECRET_KEY')),
    );
    const issuer = Keypair.fromSecretKey(issuerSecretKey);

    const issuerSdk = this.sdkFactory.getSdkForSigner(issuer);

    const mint = Keypair.generate();
    const yieldValue = randomInt(1, 400000);
    const paymentMintAddress = new PublicKey(
      this.configService.get<string>('PAYMENT_TOKEN_MINT_ADDRESS'),
    );
    const encodedInitSPTx = await issuerSdk.signStructuredProductInitOffline(
      {
        investor: new PublicKey(investorPublicKey),
        issuer: issuer.publicKey,
        issuerTreasuryWallet: treasuryWallet.publicKey,
        payments: [
          {
            principal: false,
            amount: new BN(1000),
            paymentDateOffsetSeconds: new BN(1),
            paymentMint: paymentMintAddress,
          },
          {
            principal: true,
            paymentDateOffsetSeconds: new BN(1),
            paymentMint: paymentMintAddress,
            priceAuthority: this.provider.publicKey,
          },
        ],
      },
      mint,
    );

    const encodedIssueSPTx = await issuerSdk.signStructuredProductIssueOffline(
      {
        investor: new PublicKey(investorPublicKey),
        issuer: issuer.publicKey,
        issuerTreasuryWallet: treasuryWallet.publicKey,
        mint: mint.publicKey,
      },
      new BN(1000),
    );

    return {
      initStructuredProductTx: encodedInitSPTx,
      issueStructuredProductTx: encodedIssueSPTx,
      mint,
      ...structuredProductDeployDto,
      yieldValue,
    };
  }

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

    const createOwnerATAIx = createAssociatedTokenAccountInstruction(
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
