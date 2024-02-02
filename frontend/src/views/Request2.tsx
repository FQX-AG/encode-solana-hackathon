import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useReport } from "@/hooks/useReport";
import { useMemo, useState } from "react";
import { Decimal } from "decimal.js";
import { differenceInMonths } from "date-fns";
import * as anchor from "@coral-xyz/anchor";
import { ensure } from "@/utils";
import { StructuredNotesSdk, StructuredProductIDL, TransferSnapshotHookIDL, TreasuryWalletIDL } from "@fqx/programs";
import {
  API_URL,
  COUPON_FREQUENCY_NAMES,
  STRUCTURED_PRODUCT_PROGRAM_ID,
  StructuredProductType,
  TRANSFER_SNAPSHOT_HOOK_PROGRAM_ID,
  TREASURY_WALLET_PROGRAM_ID,
} from "@/constants";
import { Box, Button, Divider, Stack, Theme } from "@mui/material";
import { Section } from "@/components/Section";
import { Property } from "@/components/Property";
import { formatDate, formatDateUTC, formatDecimal, formatPercentage } from "@/formatters";
import { Info } from "@/components/Info";
import { Tooltip } from "@/components/Tooltip";
import { Column, List } from "@/components/list/List";
import { GlowingPanel } from "@/components/GlowingPanel";
import { Text } from "@/components/Text";
import { ArrowForward, ChevronRight } from "@mui/icons-material";
import { SignDialog } from "@/components/SignDialog";
import { Panel } from "@/components/Panel";
import { Values } from "@/schemas/newIssuance";
import { DeploymentInfo } from "@/types";
import { SxProps } from "@mui/material/styles";
import { Flag } from "@/components/Flag";
import { Chip } from "@/components/Chip";
import { BRC } from "@/components/graphs/BRC";
import axios from "axios";
import { useRouter } from "next/router";

const TAG_PROPS: Record<string, { children: string; sx: SxProps<Theme> }> = {
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
  tags?: string[];
};

type QuoteInternalEnhanced = QuoteInternal & {
  totalCouponPayment: number;
  absoluteCouponRate: number;
  totalRepayment: number;
};

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

export default function Request2(props: { values: Values; deploymentInfo: DeploymentInfo }) {
  const anchorWallet = useAnchorWallet();
  const { connection }: { connection: Connection } = useConnection();
  const router = useRouter();
  const report = useReport();
  const issuanceDate = useMemo(() => new Date(), []);
  const [confirmationPayload, setConfirmationPayload] = useState<QuoteInternalEnhanced>();
  const data = useMemo<QuoteInternal[]>(() => {
    const y = new Decimal(props.deploymentInfo.yieldValue).div(props.values.totalIssuanceAmount).times(12).div(2);
    const rand = () => new Decimal(Math.random()).clamp(0.1, 0.9).toNumber();

    return [
      {
        id: "1",
        issuerCountryCode: "FR",
        issuerName: "France Company",
        initialFixingPrice: { currency: "USDC", amount: 43000 },
        yield: y.toNumber(),
        tags: ["bestOffer"],
      },
      {
        id: "2",
        issuerCountryCode: "DE",
        issuerName: "Germany Company",
        initialFixingPrice: { currency: "USDC", amount: 40987 },
        yield: y.times(rand()).toNumber(),
      },
      {
        id: "3",
        issuerCountryCode: "AT",
        issuerName: "Austria Company",
        initialFixingPrice: { currency: "USDC", amount: 35321 },
        yield: y.times(rand()).toNumber(),
      },
      {
        id: "4",
        issuerCountryCode: "CH",
        issuerName: "Swiss Company",
        initialFixingPrice: { currency: "USDC", amount: 33345 },
        yield: y.times(rand()).toNumber(),
      },
      {
        id: "5",
        issuerCountryCode: "PL",
        issuerName: "Web 3 Company",
        initialFixingPrice: { currency: "USDC", amount: 20765 },
        yield: y.times(rand()).toNumber(),
      },
      {
        id: "6",
        issuerCountryCode: "JM",
        issuerName: "Waganda Company",
        initialFixingPrice: { currency: "USDC", amount: 15456 },
        yield: y.times(rand()).toNumber(),
      },
    ].sort((a, b) => {
      if (a.yield === b.yield) return 0;
      return a.yield > b.yield ? -1 : 1;
    });
  }, [props.values, props.deploymentInfo]);
  const [selection, setSelection] = useState<string>(data[0].id);
  const quote = useMemo<QuoteInternalEnhanced | undefined>(() => {
    const quote = selection ? data.find((item) => item.id === selection) : undefined;
    if (quote) {
      const totalCouponPayment = new Decimal(props.values.totalIssuanceAmount).times(quote.yield).toNumber();
      const maturity = differenceInMonths(props.values.maturityDate, issuanceDate);
      const absoluteCouponRate = new Decimal(quote.yield).times(maturity).div(12).toNumber();
      const totalRepayment = new Decimal(totalCouponPayment).plus(props.values.totalIssuanceAmount).toNumber();
      return { ...quote, totalCouponPayment, absoluteCouponRate, totalRepayment };
    }

    return undefined;
  }, [props.values, data, selection]);

  const handleClose = () => setConfirmationPayload(undefined);

  const handleBeforeSign = async (): Promise<void> => {
    // Nothing to do here.
  };

  const handleSign = async (): Promise<PublicKey> => {
    const wallet = ensure(anchorWallet, "Wallet is unavailable. Is it connected?");
    const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
    const program = new anchor.Program(StructuredProductIDL, STRUCTURED_PRODUCT_PROGRAM_ID, provider);
    const treasuryWalletProgram = new anchor.Program(TreasuryWalletIDL, TREASURY_WALLET_PROGRAM_ID, provider);
    const transferSnapshotHookProgram = new anchor.Program(
      TransferSnapshotHookIDL,
      TRANSFER_SNAPSHOT_HOOK_PROGRAM_ID,
      provider
    );
    const sdk = new StructuredNotesSdk(provider, program, treasuryWalletProgram, transferSnapshotHookProgram);

    // Sign
    const [finalInitTx, finalIssueTx] = await provider.wallet.signAllTransactions(
      props.deploymentInfo.transactions.map(sdk.decodeV0Tx)
    );

    // Send "init" transaction
    await sdk.provider.connection.simulateTransaction(finalInitTx, {
      sigVerify: false,
      replaceRecentBlockhash: true,
    });
    const finalInitTxId = await provider.connection.sendTransaction(finalInitTx);
    await sdk.confirmTx(finalInitTxId);

    console.log(
      "Simulation: ",
      await sdk.provider.connection.simulateTransaction(finalIssueTx, {
        sigVerify: false,
        replaceRecentBlockhash: true,
      })
    );
    const issueTxid = await provider.connection.sendTransaction(finalIssueTx);
    await sdk.confirmTx(issueTxid);
    const mintPublicKey = new PublicKey(props.deploymentInfo.mint);

    await axios.post(`${API_URL}/confirm-issuance`, {
      mint: mintPublicKey.toBase58(),
      txId: issueTxid,
      investor: provider.publicKey.toBase58(),
    });

    return mintPublicKey;
  };

  const handleAfterSign = async (mint: PublicKey) => {
    await router.push(`/token/${mint.toBase58()}`);
    report.success("Success!");
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
            <Property k="Type" v={`${props.values.type}-${props.values.underlyingAsset}`} />
            {props.values.type === StructuredProductType.BRC && (
              <Property
                k="Barrier"
                v={`${formatPercentage(props.values.brcDetails.level / 100)} ${props.values.brcDetails.type}`}
              />
            )}
            <Property
              k="Issuance amount"
              v={`${props.values.currency} ${formatDecimal(props.values.totalIssuanceAmount)}`}
            />
            <Property
              k="Maturity date"
              v={
                <Info tooltip={formatDateUTC(props.values.maturityDate, true, true)}>
                  {formatDate(props.values.maturityDate, false)}
                </Info>
              }
            />
            <Property
              k="Coupon payment"
              v={
                <Tooltip title="For demonstration purposes, the coupon frequency is set to 2 payments in this issuance.">
                  <Box sx={{ display: "inline-block", borderBottom: "1px solid #fff", cursor: "help" }}>
                    {COUPON_FREQUENCY_NAMES[props.values.couponFrequency]}
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
                v={`${props.values.currency} ${formatDecimal(quote.totalCouponPayment)}`}
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
                      {`${props.values.currency} ${formatDecimal(quote.totalRepayment)}`}
                    </Box>
                  </Tooltip>
                }
              />
            </Stack>
            {props.values.type === StructuredProductType.BRC && (
              <>
                <Divider />
                <BRC
                  type={props.values.brcDetails.type}
                  barrier={props.values.brcDetails.level}
                  coupon={quote.absoluteCouponRate * 100}
                  underlyingAsset={props.values.underlyingAsset}
                  currency={props.values.currency}
                  issuanceAmount={props.values.totalIssuanceAmount}
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
          onClose={handleClose}
          onBeforeSign={handleBeforeSign}
          onSign={handleSign}
          onAfterSign={handleAfterSign}
        >
          <Panel spacing={2}>
            <Property
              horizontal
              k="Investment amount"
              v={
                <>
                  {props.values.currency}{" "}
                  <Text component="span" variant="500|18px|23px">
                    {formatDecimal(props.values.totalIssuanceAmount)}
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
              v={`${props.values.currency} ${formatDecimal(confirmationPayload.totalCouponPayment)}`}
            />
            <Property
              horizontal
              k="Total repayment"
              v={
                <>
                  <Text component="span" variant="400|12px|16px" color="oxfordBlue500" sx={{ mr: "1ch" }}>
                    Up to
                  </Text>{" "}
                  {`${props.values.currency} ${formatDecimal(confirmationPayload.totalRepayment)}`}
                </>
              }
            />
          </Panel>
        </SignDialog>
      )}
    </>
  );
}
