import { useWallet } from "@solana/wallet-adapter-react";
import { useReport } from "@/hooks/useReport";
import React, { useMemo } from "react";
import { FormValues, getInitialValues, validationSchema, Values } from "@/schemas/newIssuance";
import { useFormikWithLazyValidation } from "@/hooks/useFormikWithLazyValidation";
import { ensure } from "@/utils";
import { API_URL, StructuredProductType } from "@/constants";
import { DeploymentInfo } from "@/types";
import { Form, FormikProvider } from "formik";
import { Button, Container, Stack } from "@mui/material";
import { NewIssuance1 } from "@/sections/NewIssuance1";
import { NewIssuance2 } from "@/sections/NewIssuance2";
import { ArrowForward } from "@mui/icons-material";
import LoadingButton from "@mui/lab/LoadingButton";
import axios from "axios";
import Alert from "@mui/material/Alert";
import { WalletMultiButton } from "@/components/layout/WalletMultiButton";
import { ExternalLink } from "@/components/ExternalLink";

export default function Request1(props: {
  onNext: (payload: { values: Values; deploymentInfo: DeploymentInfo }) => void;
}) {
  const wallet = useWallet();
  const report = useReport();
  const initialValues = useMemo(() => getInitialValues(), []);
  const formik = useFormikWithLazyValidation<FormValues>({
    initialValues,
    validationSchema,
    onSubmit: async (formValues) => {
      try {
        const values = await validationSchema.validate(formValues, { stripUnknown: true });
        const walletPublicKey = ensure(wallet.publicKey, "Wallet public key is unavailable. Is your wallet connected?");

        if (values.type == StructuredProductType.BRC) {
          const { data: deploymentInfo } = await axios.post<DeploymentInfo>(`${API_URL}/mock-issuer`, {
            investorPublicKey: walletPublicKey,
            maturityDate: values.maturityDate,
            principal: values.principal,
            totalIssuanceAmount: values.totalIssuanceAmount,
            barrierLevel: values.brcDetails.level,
          });
          props.onNext({ values, deploymentInfo });
          report.success("Success!");
        } else {
          throw new Error("Unsupported structured product type");
        }
      } catch (e) {
        report.error(e);
      }
    },
  });

  return (
    <FormikProvider value={formik}>
      <Container maxWidth="md" sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column" }}>
        <Stack component={Form} spacing={6}>
          <NewIssuance1 />
          <NewIssuance2 />
          <Stack direction="row" justifyContent="end">
            <Stack direction="row" spacing={3} alignItems="center">
              {wallet.publicKey && (
                <Alert severity="info">
                  If you don’t have any SOL. Use the{" "}
                  <ExternalLink href="https://faucet.solana.com/" color="inherit">
                    faucet
                  </ExternalLink>
                  .
                </Alert>
              )}
              {wallet.publicKey && (
                <LoadingButton
                  size="medium"
                  color="primary"
                  variant="contained"
                  type="submit"
                  loading={formik.isSubmitting}
                  endIcon={<ArrowForward />}
                >
                  Request for quote
                </LoadingButton>
              )}
              {!wallet.publicKey && <Alert severity="info">Make sure to connect your wallet to Devnet.</Alert>}
              {!wallet.publicKey && (
                <Button
                  type="button"
                  onClick={() => document.getElementById("wallet-connect")?.click()}
                  endIcon={<ArrowForward />}
                >
                  Connect wallet
                </Button>
              )}
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </FormikProvider>
  );
}
