import React, { ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { Adapter, WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

// The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
const network = WalletAdapterNetwork.Devnet;
// You can also provide a custom RPC endpoint.
const endpoint = clusterApiUrl(network);
const wallets: Adapter[] = [
  /**
   * Wallets that implement either of these standards will be available automatically.
   *
   *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
   *     (https://github.com/solana-mobile/mobile-wallet-adapter)
   *   - Solana Wallet Standard
   *     (https://github.com/solana-labs/wallet-standard)
   *
   * If you wish to support a wallet that supports neither of those standards,
   * instantiate its legacy wallet adapter here. Common legacy adapters can be found
   * in the npm package `@solana/wallet-adapter-wallets`.
   */
];

export const Web3Provider = (props: { children: ReactNode }) => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{props.children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
