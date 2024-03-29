import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useReport } from "@/hooks/useReport";
import { useMemo, useState } from "react";
import { Decimal } from "decimal.js";
import * as anchor from "@coral-xyz/anchor";
import { ensure } from "@/utils";
import {
  BrcPriceAuthorityIDL,
  DummyOracleIDL,
  StructuredNotesSdk,
  StructuredProductIDL,
  TransferSnapshotHookIDL,
  TreasuryWalletIDL,
} from "@fqx/programs";
import {
  API_URL,
  BRC_PRICE_AUTHORITY_PROGRAM_ID,
  COUPON_FREQUENCY_NAMES,
  DUMMY_ORACLE_PROGRAM_ID,
  STRUCTURED_PRODUCT_PROGRAM_ID,
  StructuredProductType,
  TRANSFER_SNAPSHOT_HOOK_PROGRAM_ID,
  TREASURY_WALLET_PROGRAM_ID,
} from "@/constants";
import { Box, Button, Container, Divider, Stack, Theme } from "@mui/material";
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
import { Values } from "@/schemas/issuanceForm";
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

export default function Quotes(props: { values: Values; deploymentInfo: DeploymentInfo }) {
  const anchorWallet = useAnchorWallet();
  const { connection }: { connection: Connection } = useConnection();
  const router = useRouter();
  const report = useReport();
  const [confirmationPayload, setConfirmationPayload] = useState<QuoteInternalEnhanced>();
  const data = useMemo<QuoteInternal[]>(() => {
    const initialFixingPrice = new Decimal(props.deploymentInfo.initialFixingPrice);
    const y = new Decimal(props.deploymentInfo.coupon).div(props.deploymentInfo.principal);
    const rand = (min = 0.75, max = 0.9) =>
      new Decimal(Math.random())
        .mul(max - min)
        .plus(min)
        .toNumber();

    return [
      {
        id: "1",
        issuerCountryCode: "FR",
        issuerName: "France Company",
        initialFixingPrice: { currency: "USDC", amount: initialFixingPrice.toNumber() },
        yield: y.toNumber(),
        tags: ["bestOffer"],
      },
      {
        id: "2",
        issuerCountryCode: "DE",
        issuerName: "Germany Company",
        initialFixingPrice: { currency: "USDC", amount: initialFixingPrice.times(rand(0.3)).toNumber() },
        yield: y.times(rand()).toNumber(),
      },
      {
        id: "3",
        issuerCountryCode: "AT",
        issuerName: "Austria Company",
        initialFixingPrice: { currency: "USDC", amount: initialFixingPrice.times(rand(0.3)).toNumber() },
        yield: y.times(rand()).toNumber(),
      },
      {
        id: "4",
        issuerCountryCode: "CH",
        issuerName: "Swiss Company",
        initialFixingPrice: { currency: "USDC", amount: initialFixingPrice.times(rand(0.3)).toNumber() },
        yield: y.times(rand()).toNumber(),
      },
      {
        id: "5",
        issuerCountryCode: "PL",
        issuerName: "Web 3 Company",
        initialFixingPrice: { currency: "USDC", amount: initialFixingPrice.times(rand(0.3)).toNumber() },
        yield: y.times(rand()).toNumber(),
      },
      {
        id: "6",
        issuerCountryCode: "JM",
        issuerName: "Waganda Company",
        initialFixingPrice: { currency: "USDC", amount: initialFixingPrice.times(rand(0.3)).toNumber() },
        yield: y.times(rand()).toNumber(),
      },
    ].sort((a, b) => {
      if (a.yield === b.yield) return 0;
      return a.yield > b.yield ? -1 : 1;
    });
  }, [props.deploymentInfo]);
  const [selection, setSelection] = useState<string>(data[0].id);
  const quote = useMemo<QuoteInternalEnhanced | undefined>(() => {
    const quote = selection ? data.find((item) => item.id === selection) : undefined;
    if (quote) {
      const totalIssuanceAmount = new Decimal(props.deploymentInfo.totalIssuanceAmount);
      const totalCouponPayment = totalIssuanceAmount.times(quote.yield).toNumber();
      const totalRepayment = totalIssuanceAmount.plus(totalCouponPayment).toNumber();
      return { ...quote, totalCouponPayment, totalRepayment };
    }

    return undefined;
  }, [props.deploymentInfo, data, selection]);

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

    const dummyOracleProgram = new anchor.Program(DummyOracleIDL, DUMMY_ORACLE_PROGRAM_ID, provider);
    const brcPriceAuthority = new anchor.Program(BrcPriceAuthorityIDL, BRC_PRICE_AUTHORITY_PROGRAM_ID, provider);
    const sdk = new StructuredNotesSdk(
      provider,
      program,
      treasuryWalletProgram,
      transferSnapshotHookProgram,
      dummyOracleProgram,
      brcPriceAuthority
    );

    console.log("SIGNING");
    // Sign
    const [finalInitTx, finalIssueTx] = await provider.wallet.signAllTransactions(
      props.deploymentInfo.transactions.map(sdk.decodeV0Tx)
    );

    console.log("Simulation", await provider.connection.simulateTransaction(finalInitTx));
    console.log("Simulation", await provider.connection.simulateTransaction(finalIssueTx));

    // Send "init" transaction
    const finalInitTxId = await provider.connection.sendTransaction(finalInitTx);
    await sdk.confirmTx(finalInitTxId);

    console.log("SENDING ISSUE");
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
    <Box display="grid" flex="1 1 auto" gridTemplateColumns="1fr 430px" gap={6}>
      <Stack spacing={6} gridColumn={{ xs: "span 2", lg: "1" }}>
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
              v={`${props.values.currency} ${formatDecimal(
                new Decimal(props.deploymentInfo.totalIssuanceAmount).toNumber()
              )}`}
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
      <Box marginInline="auto" maxWidth="430px" gridColumn={{ xs: "span 2", lg: "2" }}>
        {quote && (
          <GlowingPanel spacing={3} sx={{ position: "sticky", top: 0 }}>
            <Stack spacing={2}>
              <Property
                horizontal
                k="Coupon rate"
                v={
                  <>
                    <Text variant="500|32px|35px">{formatPercentage(quote.yield)}</Text>{" "}
                    <Text variant="400|12px|16px" color="oxfordBlue500">
                      ({formatPercentage(quote.yield)} absolute)
                    </Text>
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
                  coupon={quote.yield * 100}
                  underlyingAsset={props.values.underlyingAsset}
                  currency={props.values.currency}
                  issuanceAmount={new Decimal(props.deploymentInfo.totalIssuanceAmount).toNumber()}
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
    <Container maxWidth="lg" sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
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
                    {formatDecimal(new Decimal(props.deploymentInfo.totalIssuanceAmount).toNumber())}
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
    </Container>
  );
}
