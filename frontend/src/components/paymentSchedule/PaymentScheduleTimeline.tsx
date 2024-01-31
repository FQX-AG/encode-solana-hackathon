import { Fragment, useEffect, useMemo, useState } from "react";
import { partition } from "lodash-es";
import { ProgressBar, Bar, Ticker, Dot } from "@/components/ProgressBar";
import { Text } from "@/components/Text";
import { Info } from "@/components/Info";
import { formatDate, formatDateUTC, formatDecimal } from "@/formatters";
import { differenceInMilliseconds, isFuture } from "date-fns";
import { Divider, Stack } from "@mui/material";

type Payment = {
  type: "coupon" | "principal";
  scheduledAt: Date;
  currency?: string;
  amount?: number;
};

type PaymentScheduleTimelineProps = {
  issuanceDate: Date | string;
  maturityDate: Date | string;
  payments: Payment[];
  highlightedPaymentIndex: number;
};

export function PaymentScheduleTimeline(props: PaymentScheduleTimelineProps) {
  const [dotHoverTarget, setDotHoverTarget] = useState<number>();
  const [now, setNow] = useState(new Date());
  const values = useMemo(() => {
    const end = new Date(props.maturityDate);
    const start = new Date(props.issuanceDate);
    const range = differenceInMilliseconds(end, start);
    const payments = props.payments.map((p) => {
      const position = differenceInMilliseconds(p.scheduledAt, start);

      return { ...p, position };
    });
    const [unpaidCouponPayments, unpaidPrincipalPayments] = partition(
      payments.filter((p) => isFuture(p.scheduledAt)),
      { type: "coupon" }
    );
    const nextPayment = unpaidCouponPayments[0];
    const nowPosition = differenceInMilliseconds(now, start);

    return { start, end, range, payments, nowPosition, unpaidCouponPayments, unpaidPrincipalPayments, nextPayment };
  }, [now, props.issuanceDate, props.maturityDate, props.payments]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const labelParts = [];
  if (values.unpaidCouponPayments.length > 0) {
    labelParts.push(
      <Fragment key="coupon">
        <span style={{ color: "#fff" }}>{values.unpaidCouponPayments.length}</span> coupon
      </Fragment>
    );
  }
  if (values.unpaidPrincipalPayments.length > 0) {
    labelParts.push(<Fragment key="principal">principal</Fragment>);
  }

  const bars: Bar[] = [
    {
      start: (100 * values.nowPosition) / values.range,
      stop: 100,
      color: "#3F3F76",
      zIndex: 0,
    },
    values.nextPayment && {
      start: (100 * values.nowPosition) / values.range,
      stop: (100 * values.nextPayment.position) / values.range,
      color: "#00B2FF80",
      zIndex: 0,
    },
  ];
  const tickers: (Ticker | undefined)[] = [
    {
      position: 0,
      color: "#7C7CBA",
      label: "Issuance date",
      labelAlignment: "flex-start",
      value: (
        <Text variant="400|16px|21px">
          <Info tooltip={formatDateUTC(props.issuanceDate, true, true)}>{formatDate(props.issuanceDate, false)}</Info>
        </Text>
      ),
    },
    {
      position: 100,
      color: "#7C7CBA",
      label: "Maturity date",
      value: (
        <Text variant="400|16px|21px">
          <Info tooltip={formatDateUTC(props.maturityDate, true, true)}>{formatDate(props.maturityDate, false)}</Info>
        </Text>
      ),
    },
    {
      position: 50,
      label:
        labelParts.length > 0 ? (
          <>
            {labelParts.map((part, index) => (
              <Fragment key={part.key}>
                {index !== 0 ? " + " : ""}
                {part}
              </Fragment>
            ))}
            {" payments left"}
          </>
        ) : (
          "Payment completed"
        ),
      labelAlignment: "center",
      color: "transparent",
    },
    {
      position: (100 * values.nowPosition) / values.range,
      label: "Today",
      value: <Text variant="400|16px|21px">{formatDate(now, false)}</Text>,
      color: "#00B2FF80",
      isAtBottom: true,
    },
  ];
  const dots: (Dot | undefined)[] = [
    {
      id: -1,
      position: 0,
      variant: "small",
      highlighted: false,
    },
    ...values.payments.map(
      (p, index, array) =>
        ({
          id: index,
          position: (100 * p.position) / values.range,
          variant: "big",
          highlighted: dotHoverTarget === index || props.highlightedPaymentIndex === index,
          popper: (
            <Stack spacing={2} sx={{ background: "#15163A", borderRadius: "10px", padding: "16px", mt: 4 }}>
              <Text variant="400|16px|21px">{formatDate(p.scheduledAt, false)}</Text>
              <Divider />
              <Stack spacing={1}>
                {(p.type === "coupon" || p === array.at(-1)) && (
                  <>
                    {p.currency && p.amount ? (
                      <>
                        <Text variant="500|14px|18px" color="oxfordBlue500">
                          Coupon payment ({p === array.at(-1) ? index : index + 1}/{values.payments.length - 1}):
                        </Text>
                        <Text variant="400|16px|21px">
                          {p.currency} {formatDecimal(p.amount)}
                        </Text>
                      </>
                    ) : (
                      <Text variant="500|14px|18px" color="oxfordBlue500">
                        Coupon payment ({p === array.at(-1) ? index : index + 1}/{values.payments.length - 1})
                      </Text>
                    )}
                  </>
                )}
                {(p.type === "principal" || p === array.at(-2)) && (
                  <>
                    {p.currency && p.amount ? (
                      <>
                        <Text variant="500|14px|18px" color="oxfordBlue500">
                          Principal payment:
                        </Text>
                        <Text variant="400|16px|21px">
                          {p.currency} {formatDecimal(p.amount)}
                        </Text>
                      </>
                    ) : (
                      <Text variant="500|14px|18px" color="oxfordBlue500">
                        Principal payment
                      </Text>
                    )}
                  </>
                )}
              </Stack>
            </Stack>
          ),
        } satisfies Dot)
    ),
  ];

  return (
    <ProgressBar
      bars={bars}
      tickers={tickers}
      dots={dots}
      bottomTickersContainerStyle={{ minHeight: 180 }}
      onDotHoverTargetChange={setDotHoverTarget}
    />
  );
}
