import LoadingButton from "@mui/lab/LoadingButton";
import Alert from "@mui/material/Alert";
import React, { ReactNode, useState } from "react";

import { ActionDialog } from "@/components/ActionDialog";
import { DialogHead } from "@/components/dialog/DialogHead";
import { Stack } from "@mui/material";
import { useReport } from "@/hooks/useReport";
import { useIsMounted } from "usehooks-ts";

type SignDialogProps<Payload> = {
  title: string;
  description: string;
  confirmText: string;
  children?: ReactNode;
  onClose: () => void;
  onSign: () => Promise<Payload>;
  onContinue?: (payload: Payload) => Promise<void>;
};

export function SignDialog<Payload>(props: SignDialogProps<Payload>) {
  const report = useReport();
  const isMounted = useIsMounted();
  const [isSigning, setIsSigning] = useState(false);

  const handleConfirm = async () => {
    if (isSigning) return;

    let payload: Payload;
    try {
      setIsSigning(true);
      payload = await props.onSign();
    } catch (err: unknown) {
      report.error(err);
      return;
    } finally {
      if (isMounted()) setIsSigning(false);
    }

    await props.onContinue?.(payload);
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
