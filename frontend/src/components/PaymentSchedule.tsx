import { Divider, Stack } from "@mui/material";
import { Button } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { Text } from "@/components/Text";
import { useState } from "react";
import { PaymentScheduleList } from "@/components/PaymentScheduleList";
import { PaymentScheduleTimeline } from "@/components/PaymentScheduleTimeline";

type Payment = {
  type: "coupon" | "principal";
  scheduledAt: Date;
};

type PaymentScheduleProps = {
  issuanceDate: Date | string;
  maturityDate: Date | string;
  payments: Payment[];
};

export function PaymentSchedule(props: PaymentScheduleProps) {
  const [paymentIndex, setPaymentIndex] = useState<number>(0);

  return (
    <Stack spacing={5}>
      <PaymentScheduleTimeline
        issuanceDate={props.issuanceDate}
        maturityDate={props.maturityDate}
        payments={props.payments}
      />
      <Divider />
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={3}>
        <Button
          variant="outlined"
          color="secondary"
          sx={{ p: 1, minWidth: 0 }}
          onClick={() => setPaymentIndex((s) => (s > 0 ? s - 1 : s))}
        >
          <KeyboardArrowLeft color="primary" />
        </Button>
        <Text variant="400|16px|21px">
          Payments {paymentIndex + 1} / {props.payments.length}
        </Text>
        <Button
          variant="outlined"
          color="secondary"
          sx={{ p: 1, minWidth: 0 }}
          onClick={() => setPaymentIndex((s) => (s + 1 < props.payments.length ? s + 1 : s))}
        >
          <KeyboardArrowRight color="primary" />
        </Button>
      </Stack>
      <Stack spacing={4}>
        <Text variant="500|20px|26px">Payment schedule</Text>
        <PaymentScheduleList payments={props.payments} />
      </Stack>
    </Stack>
  );
}
