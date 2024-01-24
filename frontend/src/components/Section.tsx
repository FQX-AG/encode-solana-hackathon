import { Stack } from "@mui/material";
import { ReactElement, ReactNode } from "react";
import { Text } from "@/components/Text";

type SectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

export const Section = (props: SectionProps): ReactElement => {
  return (
    <Stack component="section" spacing={2}>
      {(props.title || props.description) && (
        <Stack spacing={0.5}>
          {props.title && <Text variant="500|22px|29px">{props.title}</Text>}
          {props.description && (
            <Text variant="400|14px|18px" color="oxfordBlue500">
              {props.description}
            </Text>
          )}
        </Stack>
      )}
      {props.children}
    </Stack>
  );
};
