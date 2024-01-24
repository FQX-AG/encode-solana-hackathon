import Image from "next/image";
import Link from "next/link";
import { Container, Stack, styled } from "@mui/material";
import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Root = styled("div")(({ theme }) => ({
  position: "sticky",
  inset: "0 0 auto",
  py: 2,
  borderBottom: `1px solid ${theme.customColors.oxfordBlue600}`,
  backgroundColor: theme.palette.background.default,
  zIndex: 2,
}));

const Navbar = () => {
  return (
    <Root>
      <Container>
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
          <WalletMultiButton />
        </Stack>
      </Container>
    </Root>
  );
};

export default Navbar;
