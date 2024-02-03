import Image from "next/image";
import Link from "next/link";
import { Box, Container, Stack, styled } from "@mui/material";
import React from "react";

import { WalletMultiButton } from "./WalletMultiButton";
import { useWallet } from "@solana/wallet-adapter-react";
import Alert from "@mui/material/Alert";

const Root = styled("div")(({ theme }) => ({
  flex: "0 0 auto",
  borderBottom: `1px solid ${theme.customColors.oxfordBlue600}`,
  backgroundColor: theme.palette.background.default,
  zIndex: 2,
}));

export const Navbar = () => {
  const wallet = useWallet();

  return (
    <Root>
      <Container maxWidth="xl">
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" minHeight={80}>
          <Link href="/">
            <Image
              priority
              src="/obligate-logo-dark.svg"
              alt="Obligate.com"
              width={180}
              height={31}
              style={{ display: "block" }}
            />
          </Link>
          <Stack direction="row" spacing={2} alignItems="center">
            {!wallet.publicKey && <Alert severity="info">Make sure to connect your wallet to Devnet.</Alert>}
            <WalletMultiButton />
          </Stack>
        </Stack>
      </Container>
    </Root>
  );
};
