import { Text } from "@/components/Text";
import { ReactNode } from "react";
import { Stack } from "@mui/material";

export function Property(props: { k: ReactNode; v: ReactNode; horizontal?: boolean }) {
  return (
    <Stack
      spacing={1}
      sx={
        props.horizontal ? { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" } : undefined
      }
    >
      <Text variant="500|14px|18px" color="oxfordBlue500">
        {props.k}
      </Text>
      <Text variant="400|16px|21px" sx={props.horizontal ? { textAlign: "end" } : undefined}>
        {props.v}
      </Text>
    </Stack>
  );
}
