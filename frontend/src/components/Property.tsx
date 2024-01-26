import { Text } from "@/components/Text";
import { ReactNode } from "react";
import { Stack } from "@mui/material";

export function Property(props: { k: string; v: ReactNode }) {
  return (
    <Stack spacing={1}>
      <Text variant="500|14px|18px" color="oxfordBlue500">
        {props.k}
      </Text>
      <Text variant="400|16px|21px">{props.v}</Text>
    </Stack>
  );
}
