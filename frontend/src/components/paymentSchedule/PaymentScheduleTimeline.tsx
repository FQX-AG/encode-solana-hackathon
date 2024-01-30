import { Fragment, useState } from "react";
import { partition } from "lodash-es";
import { ProgressBar, Bar, Ticker, Dot } from "@/components/ProgressBar";
import { Text } from "@/components/Text";
import { Info } from "@/components/Info";
import { formatDate, formatDateUTC } from "@/formatters";

type Payment = {
  type: "coupon" | "principal";
  scheduledAt: Date;
};

type PaymentScheduleTimelineProps = {
  issuanceDate?: Date | string;
  maturityDate?: Date | string;
  payments: Payment[];
  highlightedPaymentIndex: number;
};

export function PaymentScheduleTimeline(props: PaymentScheduleTimelineProps) {
  const [dotHoverTarget, setDotHoverTarget] = useState<number>();

  const bars: Bar[] = [
    {
      start: 0,
      stop: 100,
      color: "#3F3F76",
      zIndex: 0,
    },
  ];
  let summaryTicker: Ticker;
  const [unpaidCouponPayments, unpaidPrincipalPayments] = partition(props.payments, { type: "coupon" });
  const labelParts = [];
  labelParts.push(
    <Fragment key="coupon">
      <span style={{ color: "#fff" }}>{unpaidCouponPayments.length}</span> coupon
    </Fragment>
  );
  if (unpaidPrincipalPayments.length > 0) labelParts.push(<Fragment key="principal">principal</Fragment>);
  summaryTicker = {
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
  };
  let nextPaymentTicker: Ticker = {
    position: 100 / unpaidCouponPayments.length,
    label: "Next coupon payment",
    value: (
      <Text variant="400|16px|21px">
        <Info tooltip={formatDateUTC(unpaidCouponPayments[0].scheduledAt, true, true)}>
          {formatDate(unpaidCouponPayments[0].scheduledAt, false)}
        </Info>
      </Text>
    ),
    color: (theme) => theme.palette.success.main,
    labelAlignment: "center",
    isAtBottom: true,
    hidden: props.highlightedPaymentIndex !== 0 && dotHoverTarget !== 1,
  };
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
    summaryTicker,
    nextPaymentTicker,
  ];
  const dots: (Dot | undefined)[] = [
    {
      position: 0,
      variant: "small",
      highlighted: false,
    },
    {
      position: 50,
      variant: "big",
      highlighted: dotHoverTarget === 1 || props.highlightedPaymentIndex === 0,
    },
    {
      position: 100,
      variant: "big",
      highlighted: props.highlightedPaymentIndex === 1,
    },
    {
      position: 100,
      variant: "big",
      highlighted: props.highlightedPaymentIndex === 2,
    },
  ];

  return <ProgressBar bars={bars} tickers={tickers} dots={dots} onDotHoverTargetChange={setDotHoverTarget} />;
}
