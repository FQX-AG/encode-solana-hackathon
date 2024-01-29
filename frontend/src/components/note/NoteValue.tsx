import Box from "@mui/material/Box";
import { SxProps } from "@mui/material/styles";
import { ReactElement } from "react";
import { Text } from "@/components/Text";

type NoteValueProps = {
  sx?: SxProps;
  label: string;
  value: string;
  valueSuffix?: ReactElement;
  ["data-private"]?: boolean;
};

export function NoteValue(props: NoteValueProps) {
  return (
    <Box sx={{ whiteSpace: "nowrap", lineHeight: 1, ...props.sx }}>
      <Text variant="400|14px|18px" color="oxfordBlue500" sx={{ mb: -0.5 }}>
        {props.label}
      </Text>
      <Box data-private={props["data-private"]}>
        <Text variant="500|16px|21px" component="span">
          {props.value}
        </Text>{" "}
        {props.valueSuffix}
      </Box>
    </Box>
  );
}
