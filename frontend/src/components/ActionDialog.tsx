import React, { ReactNode, useState } from "react";
import { useIsMounted } from "usehooks-ts";

import { Dialog } from "@/components/dialog/Dialog";

type ActionDialogChildrenProps = {
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

type ActionDialogProps = {
  children: (props: ActionDialogChildrenProps) => ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ActionDialog({ isOpen, onClose, onConfirm, children }: ActionDialogProps) {
  const isMounted = useIsMounted();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;

    onClose();
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onConfirm();
    } finally {
      if (isMounted()) setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={isSubmitting ? undefined : handleClose}>
      {children({
        isSubmitting,
        onClose: handleClose,
        onConfirm: handleConfirm,
      })}
    </Dialog>
  );
}
