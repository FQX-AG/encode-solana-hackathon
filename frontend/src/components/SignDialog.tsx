import LoadingButton from "@mui/lab/LoadingButton";
import Alert from "@mui/material/Alert";
import React, { ReactNode, useState } from "react";

import { ActionDialog } from "@/components/ActionDialog";
import { DialogHead } from "@/components/dialog/DialogHead";
import { Stack } from "@mui/material";
import { useReport } from "@/hooks/useReport";
import { useIsMounted } from "usehooks-ts";

type SignDialogProps<PayloadA, PayloadB> = {
  title: string;
  description: string;
  confirmText: string;
  children?: ReactNode;
  onClose: () => void;
  onBeforeSign: () => Promise<PayloadA>;
  onSign: (payload: PayloadA) => Promise<PayloadB>;
  onAfterSign: (payload: PayloadB) => Promise<void>;
};

export function SignDialog<PayloadA, PayloadB>(props: SignDialogProps<PayloadA, PayloadB>) {
  const report = useReport();
  const isMounted = useIsMounted();
  const [isSigning, setIsSigning] = useState(false);

  const handleConfirm = async () => {
    if (isSigning) return;

    const payloadA = await props.onBeforeSign();

    let payloadB: PayloadB;
    try {
      setIsSigning(true);
      payloadB = await props.onSign(payloadA);
    } catch (err: unknown) {
      report.error(err);
      return;
    } finally {
      if (isMounted()) setIsSigning(false);
    }

    await props.onAfterSign(payloadB);
  };

  return (
    <ActionDialog isOpen onClose={props.onClose} onConfirm={handleConfirm}>
      {({ isSubmitting, onConfirm }) => (
        <Stack spacing={4}>
          <DialogHead title={props.title} description={props.description} />
          {props.children}
          {isSigning && <Alert severity="info">Waiting for signature</Alert>}
          <LoadingButton size="large" variant="contained" loading={isSubmitting} onClick={onConfirm}>
            {props.confirmText}
          </LoadingButton>
        </Stack>
      )}
    </ActionDialog>
  );
}
