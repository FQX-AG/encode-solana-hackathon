import { Section } from "@/components/Section";
import { Panel } from "@/components/Panel";
import { differenceInMilliseconds, addMilliseconds } from "date-fns";
import { useMemo } from "react";
import { Divider } from "@mui/material";
import { Text } from "@/components/Text";
import { useFormikContext } from "formik";
import { FormValues, validationSchema } from "@/schemas/issuanceForm";
import { PaymentSchedule } from "@/components/paymentSchedule/PaymentSchedule";

type Item = {
  type: "coupon" | "principal";
  scheduledAt: Date;
  status: "scheduled" | "open" | "settled";
};

type IssuanceForm2InnerProps = {
  couponsCount: number;
  maturityDate: Date;
};

function IssuanceForm2Inner(props: IssuanceForm2InnerProps) {
  const issuanceDate = useMemo(() => new Date(), []);
  const paymentsPreview = useMemo<Item[]>(() => {
    const timeSpanInMilliseconds = differenceInMilliseconds(props.maturityDate, issuanceDate);
    const timeStepInMilliseconds = timeSpanInMilliseconds / props.couponsCount;
    const items: Item[] = [];
    for (let i = 0; i < props.couponsCount; i++) {
      items.push({
        type: "coupon",
        scheduledAt: addMilliseconds(issuanceDate, timeStepInMilliseconds * (i + 1)),
        status: "scheduled",
      });
    }
    items.push({ type: "principal", scheduledAt: props.maturityDate, status: "scheduled" });
    return items;
  }, [issuanceDate, props.couponsCount, props.maturityDate]);

  return (
    <PaymentSchedule
      issuanceDate={issuanceDate}
      maturityDate={props.maturityDate}
      payments={paymentsPreview}
      now={null}
    />
  );
}

export function IssuanceForm2() {
  const formik = useFormikContext<FormValues>();
  let maturityDate;
  try {
    maturityDate = validationSchema.validateSyncAt("maturityDate", formik.values);
  } catch {}

  return (
    <Section title="Payment schedule" description="Preview your issuance program payment schedule.">
      <Panel spacing={3} divider={<Divider />}>
        {maturityDate ? (
          <IssuanceForm2Inner couponsCount={2} maturityDate={maturityDate} />
        ) : (
          <Text variant="400|16px|21px" color="oxfordBlue600">
            To view the payment schedule, correct the input errors.
          </Text>
        )}
      </Panel>
    </Section>
  );
}
