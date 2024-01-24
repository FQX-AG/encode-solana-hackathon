import { ReactNode } from "react";
import { Box, Container } from "@mui/material";
import Navbar from "@/components/layout/Navbar";

type LayoutProps = {
  children: ReactNode;
};

export function Layout(props: LayoutProps) {
  return (
    <>
      <Navbar />
      <Box
        sx={{
          py: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "center",
        }}
      >
        <Container>{props.children}</Container>
      </Box>
    </>
  );
}
