import { Box, Button, Divider, Stack, Theme } from "@mui/material";
import { Panel } from "@/components/Panel";
import { Section } from "@/components/Section";
import { List, Column } from "@/components/list/List";
import { Flag } from "@/components/Flag";
import { formatDate, formatDateUTC, formatDecimal, formatPercentage } from "@/formatters";
import { Chip } from "@/components/Chip";
import { SxProps } from "@mui/material/styles";
import { validationSchema } from "@/schemas/newIssuance";
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Property } from "@/components/Property";
import {
  COUPON_FREQUENCY_NAMES,
  STRUCTURED_PRODUCT_PROGRAM_ID,
  StructuredProductType,
  TREASURY_WALLET_PROGRAM_ID,
} from "@/constants";
import { Info } from "@/components/Info";
import { GlowingPanel } from "@/components/GlowingPanel";
import { Decimal } from "decimal.js";
import { Text } from "@/components/Text";
import { ArrowForward, ChevronRight } from "@mui/icons-material";
import { differenceInMonths } from "date-fns";
import { useReport } from "@/hooks/useReport";
import { BRC } from "@/components/graphs/BRC";
import { StructuredNotesSdk, StructuredProductIDL, TreasuryWalletIDL } from "@fqx/programs";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { ensure } from "@/utils";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { getPdaWithSeeds, newAccountWithLamports } from "@fqx/programs/tests/utils";
import { Wallet } from "@coral-xyz/anchor";
import { SignDialog } from "@/components/SignDialog";
import { Tooltip } from "@/components/Tooltip";

type Tag = "bestOffer";

const TAG_PROPS: Record<Tag, { children: string; sx: SxProps<Theme> }> = {
  bestOffer: {
    children: "Best offer",
    sx: (theme) => ({ color: theme.palette.warning.main, borderColor: theme.palette.warning.light }),
  },
};

type QuoteInternal = {
  id: string;
  issuerCountryCode: string;
  issuerName: string;
  initialFixingPrice: { currency: string; amount: number };
  yield: number;
  tags?: Tag[];
};

type QuoteInternalEnhanced = QuoteInternal & {
  totalCouponPayment: number;
  absoluteCouponRate: number;
  totalRepayment: number;
};

const data: QuoteInternal[] = [
  {
    id: "1",
    issuerCountryCode: "FR",
    issuerName: "France Company",
    initialFixingPrice: { currency: "USDC", amount: 43000 },
    yield: 0.36,
    tags: ["bestOffer"],
  },
  {
    id: "2",
    issuerCountryCode: "DE",
    issuerName: "Germany Company",
    initialFixingPrice: { currency: "USDC", amount: 40987 },
    yield: 0.3,
  },
  {
    id: "3",
    issuerCountryCode: "AT",
    issuerName: "Austria Company",
    initialFixingPrice: { currency: "USDC", amount: 35321 },
    yield: 0.2,
  },
  {
    id: "4",
    issuerCountryCode: "CH",
    issuerName: "Swiss Company",
    initialFixingPrice: { currency: "USDC", amount: 33345 },
    yield: 0.18,
  },
  {
    id: "5",
    issuerCountryCode: "PL",
    issuerName: "Web 3 Company",
    initialFixingPrice: { currency: "USDC", amount: 20765 },
    yield: 0.05,
  },
  {
    id: "6",
    issuerCountryCode: "JM",
    issuerName: "Waganda Company",
    initialFixingPrice: { currency: "USDC", amount: 15456 },
    yield: 0.05,
  },
];

const columns: Column<QuoteInternal>[] = [
  {
    id: "issuer",
    title: "Issuer",
    component: (quote) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Flag code={quote.issuerCountryCode} />
        <Box>{quote.issuerName}</Box>
      </Stack>
    ),
  },
  {
    id: "initialFixingPrice",
    title: "Initial fixing price",
    component: (quote) => `${quote.initialFixingPrice.currency} ${formatDecimal(quote.initialFixingPrice.amount)}`,
  },
  {
    id: "yield",
    title: "Yield (p.a.)",
    component: (quote) => formatPercentage(quote.yield),
  },
  {
    id: "tags",
    component: (quote) =>
      quote.tags && (
        <Stack direction="row" alignItems="center" spacing={1}>
          {quote.tags.map((tag) => {
            const { children, ...rest } = TAG_PROPS[tag];
            return (
              <Chip key={tag} {...rest}>
                {children}
              </Chip>
            );
          })}
        </Stack>
      ),
  },
  {
    id: "chevron",
    component: () => <ChevronRight sx={{ fontSize: "20px", color: "#A2A2DC", verticalAlign: "middle" }} />,
    style: { textAlign: "end" },
  },
];

const itemKey = (item: QuoteInternal) => item.id;

export default function Page() {
  const wallet = useWallet();
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const report = useReport();
  const issuanceDate = useMemo(() => new Date(), []);
  const [selection, setSelection] = useState<string>(data[0].id);
  const [confirmationPayload, setConfirmationPayload] = useState<QuoteInternalEnhanced>();
  const router = useRouter();
  const values = useMemo(
    () => (router.query.payload ? validationSchema.cast(JSON.parse(atob(router.query.payload as string))) : undefined),
    [router.query.payload]
  );

  const quote = useMemo<QuoteInternalEnhanced | undefined>(() => {
    if (!values) return undefined;

    const quote = selection ? data.find((item) => item.id === selection) : undefined;
    if (quote) {
      const totalCouponPayment = new Decimal(values.totalIssuanceAmount).times(quote.yield).toNumber();
      const maturity = differenceInMonths(values.maturityDate, issuanceDate);
      const absoluteCouponRate = new Decimal(quote.yield).times(maturity).div(12).toNumber();
      const totalRepayment = new Decimal(totalCouponPayment).plus(values.totalIssuanceAmount).toNumber();

      return { ...quote, totalCouponPayment, absoluteCouponRate, totalRepayment };
    }

    return undefined;
  }, [values, selection]);

  if (values === undefined) return null;

  const handleAcceptance = async (quote: QuoteInternalEnhanced) => {
    try {
      const wallet = ensure(anchorWallet, "Wallet is unavailable. Is it connected?");
      const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
      const program = new anchor.Program(StructuredProductIDL, STRUCTURED_PRODUCT_PROGRAM_ID, provider);
      const treasuryWalletProgram = new anchor.Program(TreasuryWalletIDL, TREASURY_WALLET_PROGRAM_ID, provider);
      const sdk = new StructuredNotesSdk(provider.connection, provider.wallet, program, treasuryWalletProgram);
      // await sdk.signAndBroadcastInitialize(issuerSignedInit);
      report.success("Success!");
    } catch (e) {
      report.error(e);
    }
  };

  const content = (
    <Box display="grid" flex="1 1 auto" gridTemplateColumns="repeat(12, 1fr)" gap={6}>
      <Stack spacing={6} gridColumn={{ xs: "span 12", xl: "span 8" }}>
        <Section title="Your request" sx={{ flex: "0 0 auto" }}>
          <Stack
            sx={{
              overflow: "auto",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              whiteSpace: "nowrap",
              gap: 2,
            }}
          >
            <Property k="Type" v={`${values.type}-${values.underlyingAsset}`} />
            {values.type === StructuredProductType.BRC && (
              <Property
                k="Barrier"
                v={`${formatPercentage(values.brcDetails.level / 100)} ${values.brcDetails.type}`}
              />
            )}
            <Property k="Issuance amount" v={`${values.currency} ${formatDecimal(values.totalIssuanceAmount)}`} />
            <Property
              k="Maturity date"
              v={
                <Info tooltip={formatDateUTC(values.maturityDate, true, true)}>
                  {formatDate(values.maturityDate, false)}
                </Info>
              }
            />
            <Property
              k="Coupon payment"
              v={
                <Tooltip title="For demonstration purposes, the coupon frequency is set to 2 payments in this issuance.">
                  <Box sx={{ display: "inline-block", borderBottom: "1px solid #fff", cursor: "help" }}>
                    {COUPON_FREQUENCY_NAMES[values.couponFrequency]}
                  </Box>
                </Tooltip>
              }
            />
          </Stack>
          <Divider />
        </Section>
        <Section title="Received quotes" sx={{ flex: "1 0 auto" }}>
          <Box sx={{ flex: "1 1 auto", overflow: "auto" }}>
            <List
              data={data}
              columns={columns}
              itemKey={itemKey}
              onItemClick={(item) => setSelection(item.id)}
              selectedKey={selection}
            />
          </Box>
        </Section>
      </Stack>
      <Box gridColumn={{ xs: "span 12", xl: "span 4" }}>
        {quote && (
          <GlowingPanel spacing={3} sx={{ position: "sticky", top: 0 }}>
            <Stack spacing={2}>
              <Property
                horizontal
                k="Coupon rate"
                v={
                  <>
                    <Text variant="500|32px|35px">{formatPercentage(quote.yield)}</Text>{" "}
                    <Text variant="400|12px|16px" color="oxfordBlue500">{`(${formatPercentage(
                      quote.absoluteCouponRate
                    )} absolute)`}</Text>
                  </>
                }
              />
              <Property
                horizontal
                k="Total coupon payment"
                v={`${values.currency} ${formatDecimal(quote.totalCouponPayment)}`}
              />
              <Property
                horizontal
                k="Total repayment"
                v={
                  <Tooltip title="The payment amount will be update by the final fixing date ... ">
                    <Box sx={{ display: "inline-block", borderBottom: "1px solid #fff", cursor: "help" }}>
                      <Text component="span" variant="400|12px|16px" color="oxfordBlue500" sx={{ mr: "1ch" }}>
                        Up to
                      </Text>{" "}
                      {`${values.currency} ${formatDecimal(quote.totalRepayment)}`}
                    </Box>
                  </Tooltip>
                }
              />
            </Stack>
            {values.type === StructuredProductType.BRC && (
              <>
                <Divider />
                <BRC
                  type={values.brcDetails.type}
                  barrier={values.brcDetails.level}
                  coupon={quote.absoluteCouponRate * 100}
                  underlyingAsset={values.underlyingAsset}
                  currency={values.currency}
                  issuanceAmount={values.totalIssuanceAmount}
                  initialFixingPrice={quote.initialFixingPrice.amount}
                />
              </>
            )}
            <Button type="button" endIcon={<ArrowForward />} onClick={() => setConfirmationPayload(quote)}>
              Accept & pay
            </Button>
          </GlowingPanel>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {content}
      {confirmationPayload && (
        <SignDialog
          title="Sign and pay"
          description="Your signature indicates acceptance of the quoted terms, and confirms your commitment to pay the investment amount for the creation of this issuance."
          confirmText="Sign and pay"
          onClose={() => setConfirmationPayload(undefined)}
          onSign={async () => {
            const signMessage = ensure(wallet?.signMessage, "Wallet signing is unavailable. Is your wallet connected?");
            const message = JSON.stringify(confirmationPayload);
            const signature = await signMessage(new TextEncoder().encode(message));

            return signature;
          }}
          onContinue={async (payload) => {
            console.log(new TextDecoder().decode(payload));
            setConfirmationPayload(undefined);
            report.success("Done!");
          }}
        >
          <Panel spacing={2}>
            <Property
              horizontal
              k="Investment amount"
              v={
                <>
                  {values.currency}{" "}
                  <Text component="span" variant="500|18px|23px">
                    {formatDecimal(values.totalIssuanceAmount)}
                  </Text>
                </>
              }
            />
            <Divider />
            <Property horizontal k="Issuer" v={confirmationPayload.issuerName} />
            <Property horizontal k="Coupon rate" v={formatPercentage(confirmationPayload.yield)} />
            <Property
              horizontal
              k="Total coupon payment"
              v={`${values.currency} ${formatDecimal(confirmationPayload.totalCouponPayment)}`}
            />
            <Property
              horizontal
              k="Total repayment"
              v={
                <>
                  <Text component="span" variant="400|12px|16px" color="oxfordBlue500" sx={{ mr: "1ch" }}>
                    Up to
                  </Text>{" "}
                  {`${values.currency} ${formatDecimal(confirmationPayload.totalRepayment)}`}
                </>
              }
            />
          </Panel>
        </SignDialog>
      )}
    </>
  );
}
