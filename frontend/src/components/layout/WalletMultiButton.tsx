import React, { KeyboardEventHandler, useCallback, useEffect, useState } from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWalletMultiButton } from "@solana/wallet-adapter-base-ui";
import { Box, MenuList as MenuListBase, Popover, Stack, styled } from "@mui/material";
import { Text } from "@/components/Text";
import { formatPublicKey } from "@/formatters";
import { KeyboardArrowDown } from "@mui/icons-material";
import MenuItem from "@mui/material/MenuItem";

const MenuList = styled(MenuListBase)({
  padding: 0,
  ".MuiMenuItem-root": { py: 1, minHeight: 40 },
});

const Button = styled("button")`
  position: relative;
  min-width: 36px;
  min-height: 36px;
  padding: 4px;
  border-radius: 8px;
  border: none;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  background: ${({ theme }) => theme.palette.background.paper};

  &:hover {
    background: ${({ theme }) => theme.customColors.oxfordBlue900};
  }
`;

function WalletMultiButtonInner() {
  const { setVisible: setModalVisible } = useWalletModal();
  const { buttonState, onConnect, onDisconnect, publicKey, walletName } = useWalletMultiButton({
    onSelectWallet() {
      setModalVisible(true);
    },
  });
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleMenuListKeyDown = useCallback<KeyboardEventHandler>((event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      setMenuAnchor(null);
    }
  }, []);

  return (
    <>
      <Button
        id="wallet-connect"
        type="button"
        sx={{ padding: "4px 16px" }}
        onClick={(event) => {
          switch (buttonState) {
            case "no-wallet":
              setModalVisible(true);
              break;
            case "has-wallet":
              if (onConnect) onConnect();
              break;
            case "connected":
              setMenuAnchor(event.currentTarget);
              break;
          }
        }}
        disabled={buttonState === "connecting" || buttonState === "disconnecting"}
      >
        {buttonState === "connected" ? (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 0, mr: -1 }}>
            <Box sx={{ textAlign: "start" }}>
              {walletName && <Text variant="500|12px|13px">{walletName}</Text>}
              <Text variant="400|10px|11px" color="oxfordBlue600">
                {formatPublicKey(publicKey!.toBase58())}
              </Text>
            </Box>
            <KeyboardArrowDown sx={{ color: (theme) => theme.customColors.oxfordBlue600 }} />
          </Stack>
        ) : (
          <Text variant="500|12px|13px">Connect wallet</Text>
        )}
      </Button>
      <Popover
        id="wallet-menu"
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1,
              color: "#7C7CBA",
              borderRadius: "10px",
              backgroundColor: "#272754",
              minWidth: 256,
              border: "none",
              p: 2,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <MenuList onKeyDown={handleMenuListKeyDown}>
          <MenuItem
            onClick={() => {
              setModalVisible(true);
              setMenuAnchor(null);
            }}
          >
            <Text variant="500|14px|18px">Change wallet</Text>
          </MenuItem>
          <MenuItem
            onClick={async () => {
              onDisconnect?.();
              setMenuAnchor(null);
            }}
          >
            <Text variant="500|14px|18px">Disconnect</Text>
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}

export function WalletMultiButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return show ? <WalletMultiButtonInner /> : null;
}
