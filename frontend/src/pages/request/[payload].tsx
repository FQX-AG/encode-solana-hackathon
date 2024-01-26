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
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import { ensure } from "@/utils";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { getPdaWithSeeds, newAccountWithLamports } from "@fqx/programs/tests/utils";
import { Wallet } from "@coral-xyz/anchor";

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
  yield: number;
  tags?: Tag[];
};

const data: QuoteInternal[] = [
  { id: "1", issuerCountryCode: "FR", issuerName: "France Company", yield: 0.36, tags: ["bestOffer"] },
  { id: "2", issuerCountryCode: "DE", issuerName: "Germany Company", yield: 0.3 },
  { id: "3", issuerCountryCode: "AT", issuerName: "Austria Company", yield: 0.2 },
  { id: "4", issuerCountryCode: "CH", issuerName: "Swiss Company", yield: 0.18 },
  { id: "5", issuerCountryCode: "PL", issuerName: "Web 3 Company", yield: 0.05 },
  { id: "6", issuerCountryCode: "JM", issuerName: "Waganda Company", yield: 0.05 },
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
    id: "yield",
    title: "Yield",
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
  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const report = useReport();
  const issuanceDate = useMemo(() => new Date(), []);
  const [selection, setSelection] = useState<string>(data[0].id);
  const router = useRouter();
  const values = useMemo(
    () => (router.query.payload ? validationSchema.cast(JSON.parse(atob(router.query.payload as string))) : undefined),
    [router.query.payload]
  );

  const quote = useMemo(() => {
    if (!values) return undefined;

    const quote = selection ? data.find((item) => item.id === selection) : undefined;
    if (quote) {
      const totalCouponPayment = new Decimal(values.totalIssuanceAmount).times(quote.yield).toNumber();
      const maturity = differenceInMonths(values.maturityDate, issuanceDate);
      const absoluteCouponRate = new Decimal(quote.yield).times(maturity).div(12).toNumber();
      const repaymentPerENote = new Decimal(totalCouponPayment).div(2).toNumber();
      const totalRepayment = new Decimal(totalCouponPayment).plus(values.totalIssuanceAmount).toNumber();

      return { ...quote, totalCouponPayment, absoluteCouponRate, repaymentPerENote, totalRepayment };
    }

    return undefined;
  }, [values, selection]);

  if (values === undefined) return null;

  const handleAcceptance = async (quote: QuoteInternal) => {
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

  return (
    <Box display="grid" flex="1 1 auto" gridTemplateColumns="repeat(12, 1fr)" gap={6}>
      <Stack spacing={6} gridColumn={{ xs: "span 12", xl: "span 8" }}>
        <Section title="Your request" sx={{ flex: "0 0 auto" }}>
          <Panel
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
            <Property k="Issuance amount" v={`${values.currency} ${formatDecimal(values.totalIssuanceAmount)}`} />
            {values.type === StructuredProductType.BRC && (
              <Property k="Barrier" v={`${formatPercentage(values.brcDetails.level)} ${values.brcDetails.type}`} />
            )}
            <Property
              k="Maturity date"
              v={
                <Info tooltip={formatDateUTC(values.maturityDate, true, true)}>
                  {formatDate(values.maturityDate, false)}
                </Info>
              }
            />
            <Property k="Coupon" v={COUPON_FREQUENCY_NAMES[values.couponFrequency]} />
          </Panel>
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
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
              <Property k="Total coupon payment" v={`${values.currency} ${formatDecimal(quote.totalCouponPayment)}`} />
              <Property
                k="Coupon rate"
                v={
                  <>
                    {`${formatPercentage(quote.yield)} p.a.`}{" "}
                    <Text component="span" variant="400|12px|16px" color="oxfordBlue500">{`(${formatPercentage(
                      quote.absoluteCouponRate
                    )} absolute)`}</Text>
                  </>
                }
              />
              <Property
                k="Repayment per eNote"
                v={
                  <>
                    {`${values.currency} ${formatDecimal(quote.repaymentPerENote)}`}{" "}
                    <Text component="span" variant="400|12px|16px" color="oxfordBlue500">
                      (Up to)
                    </Text>
                  </>
                }
              />
              <Property k="Total repayment" v={`${values.currency} ${formatDecimal(quote.totalRepayment)}`} />
            </Box>
            <Button type="button" endIcon={<ArrowForward />} onClick={() => handleAcceptance(quote)}>
              Accept
            </Button>
            {values.type === StructuredProductType.BRC && (
              <>
                <Divider />
                <BRC type={values.brcDetails.type} barrier={values.brcDetails.level} coupon={quote.yield * 100} />
              </>
            )}
          </GlowingPanel>
        )}
      </Box>
    </Box>
  );
}
