import { Section } from "@/components/Section";
import { Panel } from "@/components/Panel";
import { differenceInMilliseconds, addMilliseconds } from "date-fns";
import { useMemo } from "react";
import { Divider } from "@mui/material";
import { Text } from "@/components/Text";
import { useFormikContext } from "formik";
import { FormValues } from "@/schemas/newIssuance";
import { PaymentSchedule } from "@/components/paymentSchedule/PaymentSchedule";

type Item = {
  type: "coupon" | "principal";
  scheduledAt: Date;
};

type NewIssuance2InnerProps = {
  couponsCount: number;
  maturityDate: Date;
};

function NewIssuance2Inner(props: NewIssuance2InnerProps) {
  const issuanceDate = useMemo(() => new Date(), []);
  const paymentsPreview = useMemo<Item[]>(() => {
    const timeSpanInMilliseconds = differenceInMilliseconds(props.maturityDate, issuanceDate);
    const timeStepInMilliseconds = timeSpanInMilliseconds / props.couponsCount;
    const items: Item[] = [];
    for (let i = 0; i < props.couponsCount; i++) {
      items.push({
        type: "coupon",
        scheduledAt: addMilliseconds(issuanceDate, timeStepInMilliseconds),
      });
    }
    items.push({ type: "principal", scheduledAt: props.maturityDate });
    return items;
  }, [issuanceDate, props.couponsCount, props.maturityDate]);

  return <PaymentSchedule issuanceDate={issuanceDate} maturityDate={props.maturityDate} payments={paymentsPreview} />;
}

export function NewIssuance2() {
  const formik = useFormikContext<FormValues>();

  return (
    <Section title="Payment schedule" description="Preview your issuance program payment schedule.">
      <Panel spacing={3} divider={<Divider />}>
        {formik.isValid && formik.values.maturityDate ? (
          <NewIssuance2Inner couponsCount={2} maturityDate={formik.values.maturityDate} />
        ) : (
          <Text variant="400|16px|21px" color="oxfordBlue600">
            To view the payment schedule, correct the input errors.
          </Text>
        )}
      </Panel>
    </Section>
  );
}
