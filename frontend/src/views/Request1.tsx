import { useWallet } from "@solana/wallet-adapter-react";
import { useReport } from "@/hooks/useReport";
import { useMemo } from "react";
import { FormValues, getInitialValues, validationSchema, Values } from "@/schemas/newIssuance";
import { useFormikWithLazyValidation } from "@/hooks/useFormikWithLazyValidation";
import { ensure } from "@/utils";
import { API_URL } from "@/constants";
import { DeploymentInfo } from "@/types";
import { Form, FormikProvider } from "formik";
import { Stack } from "@mui/material";
import { NewIssuance1 } from "@/sections/NewIssuance1";
import { NewIssuance2 } from "@/sections/NewIssuance2";
import { ArrowForward } from "@mui/icons-material";
import LoadingButton from "@mui/lab/LoadingButton";
import axios from "axios";

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
        const { data: deploymentInfo } = await axios.post<DeploymentInfo>(`${API_URL}/mock-issuer`, {
          investorPublicKey: walletPublicKey,
        });

        props.onNext({ values, deploymentInfo });
        report.success("Success!");
      } catch (e) {
        report.error(e);
      }
    },
  });

  return (
    <FormikProvider value={formik}>
      <Stack component={Form} spacing={6}>
        <NewIssuance1 />
        <NewIssuance2 />
        <Stack direction="row" justifyContent="end">
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
        </Stack>
      </Stack>
    </FormikProvider>
  );
}
