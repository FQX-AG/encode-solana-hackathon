import Stack from "@mui/material/Stack";
import React, { ReactNode } from "react";

import { Text } from "@/components/Text";

type DialogHeadProps = {
  title: ReactNode;
  description?: ReactNode;
};

export function DialogHead(props: DialogHeadProps) {
  return (
    <Stack spacing={5} sx={{ textAlign: "center" }}>
      <Text variant="600|24px|31px">{props.title}</Text>
      {props.description && <Text variant="400|16px|21px">{props.description}</Text>}
    </Stack>
  );
}
