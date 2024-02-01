import { Table } from "@/components/Table";
import { Box, Stack, SxProps, Theme } from "@mui/material";
import { Children, ReactNode } from "react";
import { Text } from "@/components/Text";
import { formatDate, formatDateUTC, formatDecimal } from "@/formatters";
import { Info } from "@/components/Info";
import { Chip } from "@/components/Chip";

type Payment = {
  type: "coupon" | "principal";
  scheduledAt: Date;
  status: "scheduled" | "open" | "settled";
  amount?: number;
  currency?: string;
};

type RowProps = {
  sx?: SxProps<Theme>;
  highlighted: boolean;
  children: ReactNode;
  onClick?: () => void;
};

const Row = ({ children, sx, highlighted, onClick, ...rest }: RowProps) => {
  return (
    <Box {...rest} component="tr" sx={{ cursor: onClick ? "pointer" : undefined, ...sx }} onClick={onClick}>
      {Children.map(
        children,
        (child, index) =>
          child && (
            <Box component="td" key={index} sx={highlighted ? { background: "#15163A" } : undefined}>
              {child}
            </Box>
          )
      )}
    </Box>
  );
};

type PaymentScheduleListProps = {
  payments: Payment[];
  highlightedPaymentIndex: number;
};

export function PaymentScheduleList(props: PaymentScheduleListProps) {
  return (
    <Stack spacing={4}>
      <Text variant="500|20px|26px">Payment schedule</Text>
      <Table>
        <thead>
          <Row sx={{ color: (theme) => theme.customColors.oxfordBlue500 }} highlighted={false}>
            <Text variant="500|14px|18px">Payment deadline</Text>
            <Text variant="500|14px|18px">Payment details</Text>
            {props.payments.some((p) => p.amount && p.currency) && <Text variant="500|14px|18px">Payment amount</Text>}
            <Text variant="500|14px|18px">Status</Text>
          </Row>
        </thead>
        <tbody>
          {props.payments.map((payment, index, payments) => (
            <Row key={index} highlighted={index === props.highlightedPaymentIndex}>
              <Text variant="400|16px|21px">
                <Info tooltip={formatDateUTC(payment.scheduledAt, true, true)}>
                  {formatDate(payment.scheduledAt, true)}
                </Info>
              </Text>
              <Text variant="400|16px|21px">
                {payment.type === "coupon" && `Coupon payment (${index + 1}/${payments.length - 1})`}
                {payment.type === "principal" && "Principal payment"}
              </Text>
              {props.payments.some((p) => p.amount && p.currency) && (
                <Text variant="400|16px|21px">
                  {payment.currency && payment.amount
                    ? `${payment.currency} ${formatDecimal(payment.amount)}`
                    : "\u200b"}
                </Text>
              )}
              <>
                {payment.status === "scheduled" && <Chip>Scheduled</Chip>}
                {payment.status === "open" && <Chip sx={{ color: (theme) => theme.palette.success.main }}>Open</Chip>}
                {payment.status === "settled" && (
                  <Chip sx={{ color: (theme) => theme.palette.info.main }}>Settled</Chip>
                )}
              </>
            </Row>
          ))}
        </tbody>
      </Table>
    </Stack>
  );
}
