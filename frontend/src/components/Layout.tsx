import { ReactNode } from "react";
import { Box, Container } from "@mui/material";

type LayoutProps = {
  children: ReactNode;
};

export function Layout(props: LayoutProps) {
  return (
    <Box
      sx={{
        py: 3,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      <Container fixed>{props.children}</Container>
    </Box>
  );
}
