import { Button, Stack } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { Text } from "@/components/Text";
import { ReactNode } from "react";

type PaymentScheduleControlsProps = {
  children: ReactNode;
  onPrev: () => void;
  onNext: () => void;
};

export function PaymentScheduleControls(props: PaymentScheduleControlsProps) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={3}>
      <Button variant="outlined" color="secondary" sx={{ p: 1, minWidth: 0 }} onClick={props.onPrev}>
        <KeyboardArrowLeft color="primary" />
      </Button>
      <Text variant="400|16px|21px">{props.children}</Text>
      <Button variant="outlined" color="secondary" sx={{ p: 1, minWidth: 0 }} onClick={props.onNext}>
        <KeyboardArrowRight color="primary" />
      </Button>
    </Stack>
  );
}
