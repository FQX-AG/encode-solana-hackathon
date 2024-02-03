import { ReactNode } from "react";
import { Box, Stack } from "@mui/material";
import { Navbar } from "@/components/layout/Navbar";

type LayoutProps = {
  children: ReactNode;
};

export function Layout(props: LayoutProps) {
  return (
    <Stack height="100vh">
      <Navbar />
      <Box
        component="main"
        sx={{
          overflow: "auto",
          flex: "1 1 auto",
          py: 6,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {props.children}
      </Box>
    </Stack>
  );
}
