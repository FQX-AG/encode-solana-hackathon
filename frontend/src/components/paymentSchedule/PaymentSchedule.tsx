import { Divider, Stack } from "@mui/material";
import { useState } from "react";
import { PaymentScheduleList } from "./PaymentScheduleList";
import { PaymentScheduleTimeline } from "./PaymentScheduleTimeline";
import { PaymentScheduleControls } from "@/components/paymentSchedule/PaymentScheduleControls";

type Payment = {
  type: "coupon" | "principal";
  scheduledAt: Date;
  currency?: string;
  amount?: number;
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
        highlightedPaymentIndex={paymentIndex}
      />
      <Divider />
      <PaymentScheduleControls
        onPrev={() => setPaymentIndex((s) => (s > 0 ? s - 1 : s))}
        onNext={() => setPaymentIndex((s) => (s + 1 < props.payments.length ? s + 1 : s))}
      >
        Payments {paymentIndex + 1} / {props.payments.length}
      </PaymentScheduleControls>
      <PaymentScheduleList payments={props.payments} highlightedPaymentIndex={paymentIndex} />
    </Stack>
  );
}
