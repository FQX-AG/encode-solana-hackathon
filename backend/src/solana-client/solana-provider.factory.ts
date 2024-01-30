import { Connection, Keypair } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider } from '@coral-xyz/anchor';
import { SOLANA_PROVIDER } from './contants';

export const solanaProviderFactory = {
  provide: SOLANA_PROVIDER,
  useFactory: async (): Promise<AnchorProvider> => {
    const providerRpcUrl = process.env.PROVIDER_RPC_URL;
    const connection = new Connection(providerRpcUrl, 'processed');
    const wallet = Keypair.generate();

    const provider = new AnchorProvider(connection, new anchor.Wallet(wallet), {
      preflightCommitment: 'processed',
    });
    return provider;
  },
};
