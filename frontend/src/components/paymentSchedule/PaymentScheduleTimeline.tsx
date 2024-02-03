import { Fragment, useMemo, useState } from "react";
import { partition } from "lodash-es";
import { ProgressBar, Bar, Ticker, Dot } from "@/components/ProgressBar";
import { Text } from "@/components/Text";
import { Info } from "@/components/Info";
import { formatDate, formatDateUTC, formatDecimal } from "@/formatters";
import { differenceInMilliseconds, isFuture } from "date-fns";
import { Divider, Stack } from "@mui/material";
import * as _ from "lodash-es";
import React from "react";

type Payment = {
  type: "coupon" | "principal";
  scheduledAt: Date;
  status: "scheduled" | "open" | "settled";
  currency?: string;
  amount?: number;
};

type PaymentScheduleTimelineProps = {
  issuanceDate: Date | string;
  maturityDate: Date | string;
  payments: Payment[];
  highlightedPaymentIndex: number;
  now: Date | null;
};

export function PaymentScheduleTimeline(props: PaymentScheduleTimelineProps) {
  const [dotHoverTarget, setDotHoverTarget] = useState<number>();
  const values = useMemo(() => {
    const end = new Date(props.maturityDate);
    const start = new Date(props.issuanceDate);
    const range = differenceInMilliseconds(end, start);
    const payments = props.payments.map((p) => {
      const position = differenceInMilliseconds(p.scheduledAt, start);

      return { ...p, position };
    });
    const groupedPayments = _.groupBy(payments, (payment) => payment.position);
    const [couponPayments, principalPayments] = partition(payments, { type: "coupon" });
    const unpaidCouponPayments = couponPayments.filter((p) => isFuture(p.scheduledAt));
    const unpaidPrincipalPayments = principalPayments.filter((p) => isFuture(p.scheduledAt));
    const nextPayment = unpaidCouponPayments[0];
    const nowPosition = props.now ? differenceInMilliseconds(props.now, start) : undefined;

    return {
      start,
      end,
      range,
      payments,
      groupedPayments,
      nowPosition,
      couponPayments,
      unpaidCouponPayments,
      unpaidPrincipalPayments,
      nextPayment,
    };
  }, [props.now, props.issuanceDate, props.maturityDate, props.payments]);

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

  const bars: Bar[] = values.nowPosition
    ? [
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
      ]
    : [];
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
    props.now && values.nowPosition
      ? {
          position: (100 * values.nowPosition) / values.range,
          color: "#00B2FF80",
          tooltip: `Today, ${formatDate(props.now, false)}`,
        }
      : undefined,
  ];
  const dots: (Dot | undefined)[] = [
    {
      id: -1,
      position: 0,
      variant: "small",
      highlighted: false,
    },
    ...Object.entries(values.groupedPayments).map(([position, payments], groupIndex) => {
      return {
        id: groupIndex,
        position: (100 * Number(position)) / values.range,
        variant: payments.every((payment) => payment.status === "settled") ? "done" : "big",
        highlighted:
          dotHoverTarget === groupIndex ||
          payments.some((p) => values.payments.indexOf(p) === props.highlightedPaymentIndex),
        popper: (
          <Stack spacing={2} sx={{ background: "#15163A", borderRadius: "10px", padding: "16px", mt: 4 }}>
            <Text variant="400|16px|21px">{formatDate(payments[0].scheduledAt, false)}</Text>
            <Divider sx={{ borderColor: (theme) => theme.customColors.oxfordBlue800 }} />
            <Stack spacing={1}>
              {payments.map((p, paymentIndex) => {
                if (p.type === "coupon") {
                  return (
                    <React.Fragment key={paymentIndex}>
                      {p.currency && p.amount ? (
                        <>
                          <Text variant="500|14px|18px" color="oxfordBlue500">
                            Coupon payment ({values.payments.indexOf(p) + 1}/{values.payments.length - 1}):
                          </Text>
                          <Text variant="400|16px|21px">
                            {p.currency} {formatDecimal(p.amount)}
                          </Text>
                        </>
                      ) : (
                        <Text variant="500|14px|18px" color="oxfordBlue500">
                          Coupon payment ({values.payments.indexOf(p) + 1}/{values.payments.length - 1})
                        </Text>
                      )}
                    </React.Fragment>
                  );
                }
                if (p.type === "principal") {
                  return (
                    <React.Fragment key={paymentIndex}>
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
                    </React.Fragment>
                  );
                }
              })}
            </Stack>
          </Stack>
        ),
      } satisfies Dot;
    }),
  ];

  return (
    <ProgressBar
      bars={bars}
      tickers={tickers}
      dots={dots}
      bottomTickersContainerStyle={{ minHeight: 220 }}
      onDotHoverTargetChange={setDotHoverTarget}
    />
  );
}
