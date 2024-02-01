import { AnchorProvider } from '@coral-xyz/anchor';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
} from '@solana/spl-token';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import * as BN from 'bn.js';
import { randomInt } from 'crypto';
import { SdkFactory } from 'src/solana-client/sdk-factory';
import { SOLANA_PROVIDER } from '../solana-client/contants';
import { StructuredProductDeployDto } from './dtos/structured-product-deploy.dto';
import { getPdaWithSeeds } from '@fqx/programs';

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

    const issuerSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('ISSUER_SECRET_KEY')),
    );
    const issuer = Keypair.fromSecretKey(issuerSecretKey);

    const issuerSdk = this.sdkFactory.getSdkForSigner(issuer);

    const paymentMint = new PublicKey(
      this.configService.get<string>('PAYMENT_TOKEN_MINT_ADDRESS'),
    );

    console.log('Investor public key', investorPublicKey);

    const investorATA = getAssociatedTokenAddressSync(
      paymentMint,
      new PublicKey(investorPublicKey),
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    console.log('Investor ATA', investorATA.toBase58());

    const investorTokenAccountInfo =
      await issuerSdk.provider.connection.getAccountInfo(investorATA);

    const ixs: TransactionInstruction[] = [];
    let investorTokenAccount = null;

    if (investorTokenAccountInfo !== null) {
      investorTokenAccount = unpackAccount(
        investorATA,
        investorTokenAccountInfo,
        TOKEN_2022_PROGRAM_ID,
      );
    }

    const signers = [];
    if (
      investorTokenAccountInfo === null ||
      (investorTokenAccount && investorTokenAccount.amount === 0n)
    ) {
      if (investorTokenAccountInfo === null) {
        console.log('Creating investor ATA');
        const createInvestorATAIx = createAssociatedTokenAccountInstruction(
          issuer.publicKey,
          investorATA,
          new PublicKey(investorPublicKey),
          paymentMint,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        );
        ixs.push(createInvestorATAIx);
      }
      console.log('Minting payment token to investor');
      ixs.push(this.createMintPaymentTokenIx(investorATA, 1000000000000000n));
      const serverSecretKey = Uint8Array.from(
        JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
      );

      const mintAuthority = Keypair.fromSecretKey(serverSecretKey);
      signers.push(mintAuthority);
    }

    const treasuryWalletPublicKey = new PublicKey(
      this.configService.get<string>('TREASURY_WALLET_PUBLIC_KEY'),
    );

    console.log(
      'Treasury wallet public key',
      treasuryWalletPublicKey.toBase58(),
    );

    const treasuryWalletAuthorityPDA = getPdaWithSeeds(
      [treasuryWalletPublicKey.toBuffer()],
      issuerSdk.treasuryWalletProgram.programId,
    );

    console.log(
      'Treasury wallet authority PDA',
      treasuryWalletAuthorityPDA.publicKey.toBase58(),
    );

    const treasuryWalletATA = getAssociatedTokenAddressSync(
      paymentMint,
      treasuryWalletAuthorityPDA.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    console.log('Treasury wallet ATA', treasuryWalletATA.toBase58());

    const mint = Keypair.generate();
    const yieldValue = randomInt(1, 400000);

    const nonce1 = Keypair.generate();
    const nonce2 = Keypair.generate();

    const [nonce1Ixs, nonce2Ixs] = await Promise.all([
      issuerSdk.createDurableNonceAccountInstructions(nonce1),
      issuerSdk.createDurableNonceAccountInstructions(nonce2),
    ]);

    ixs.push(...nonce1Ixs, ...nonce2Ixs);
    signers.push(nonce1, nonce2);

    console.log(
      'Signers',
      signers.map((s) => s.publicKey.toBase58()),
    );

    await issuerSdk.sendAndConfirmV0Tx(ixs, signers);

    const encodedInitSPTx = await issuerSdk.signStructuredProductInitOffline(
      {
        investor: new PublicKey(investorPublicKey),
        issuer: issuer.publicKey,
        issuerTreasuryWallet: treasuryWalletPublicKey,
        paymentMint: paymentMint,
        issuancePricePerUnit: new BN(1000),
        supply: new BN(1000),
        payments: [
          {
            principal: false,
            amount: new BN(1000),
            paymentDateOffsetSeconds: new BN(1),
            paymentMint: paymentMint,
          },
          {
            principal: true,
            paymentDateOffsetSeconds: new BN(1),
            paymentMint: paymentMint,
            priceAuthority: this.provider.publicKey,
          },
        ],
      },
      mint,
      nonce1.publicKey,
    );
    const encodedIssueSPTx = await issuerSdk.signStructuredProductIssueOffline(
      {
        investor: new PublicKey(investorPublicKey),
        issuer: issuer.publicKey,
        issuerTreasuryWallet: treasuryWalletPublicKey,
        mint: mint.publicKey,
        paymentMint: paymentMint,
        issuanceProceedsBeneficiary: treasuryWalletATA,
      },
      nonce2.publicKey,
    );

    return {
      transactions: [encodedInitSPTx, encodedIssueSPTx],
      mint: mint.publicKey,
      ...structuredProductDeployDto,
      yieldValue,
    };
  }

  createMintPaymentTokenIx(tokenAccount: PublicKey, amountToMint: bigint) {
    const serverSecretKey = Uint8Array.from(
      JSON.parse(this.configService.get<string>('SERVER_SECRET_KEY')),
    );
    const mintAuthority = Keypair.fromSecretKey(serverSecretKey);

    const mintAddress = new PublicKey(
      this.configService.get<string>('PAYMENT_TOKEN_MINT_ADDRESS'),
    );

    return createMintToCheckedInstruction(
      mintAddress,
      tokenAccount,
      mintAuthority.publicKey,
      amountToMint,
      9,
      [],
      TOKEN_2022_PROGRAM_ID,
    );
  }
}
