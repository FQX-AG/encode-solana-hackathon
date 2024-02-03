import { Box, Stack } from "@mui/material";
import { ReactNode } from "react";
import { Text } from "@/components/Text";
import { Asterisk } from "@/components/Asterisk";

type WithSideContentProps = {
  side: ReactNode;
  children: ReactNode;
};

export const WithSideContent = (props: WithSideContentProps) => {
  return (
    <Stack spacing={3} direction="row" alignItems="flex-start">
      <Box sx={{ flex: `0 0 ${170 - 24}px`, display: "flex", minHeight: "56px", alignItems: "center" }}>
        {props.side}
      </Box>
      <Box sx={{ flex: "1 1 auto" }}>{props.children}</Box>
    </Stack>
  );
};

WithSideContent.Side = function Side(props: { children: ReactNode; asterisk?: boolean }) {
  return (
    <Text variant="500|14px|18px" color="oxfordBlue500">
      {props.children} {props.asterisk && <Asterisk />}
    </Text>
  );
};
