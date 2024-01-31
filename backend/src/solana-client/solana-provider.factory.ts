import { Connection, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider } from '@coral-xyz/anchor';
import { SOLANA_PROVIDER } from './contants';

export const solanaProviderFactory = {
  provide: SOLANA_PROVIDER,
  useFactory: async (): Promise<AnchorProvider> => {
    const providerRpcUrl = process.env.PROVIDER_RPC_URL;
    const connection = new Connection(providerRpcUrl, 'confirmed');
    const issuerKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.ISSUER_SECRET_KEY)),
    );

    const provider = new AnchorProvider(
      connection,
      new anchor.Wallet(issuerKeypair),
      {
        commitment: 'confirmed',
      },
    );
    return provider;
  },
};
