import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import { ReactNode } from "react";

type DialogProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  dialogWidth?: number | string;
};

export function Dialog({ children, isOpen, onClose, dialogWidth }: DialogProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      slotProps={{
        backdrop: { sx: { background: "#5B5B9898" } },
      }}
    >
      <Box
        sx={{
          pointerEvents: "none",
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            pointerEvents: "all",
            position: "relative",
            background: (theme) => theme.palette.background.default,
            borderRadius: "10px",
            width: dialogWidth || 530,
            maxWidth: "calc(100% - 32px * 2)",
            m: "32px",
            p: "40px",
          }}
        >
          {children}
          {onClose && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: "absolute",
                right: "16px",
                top: "16px",
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>
    </Modal>
  );
}
