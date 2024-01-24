import { Box } from "@mui/material";

export function Asterisk() {
  return (
    <Box component="span" sx={{ color: (theme) => theme.palette.error.main }}>
      *
    </Box>
  );
}
