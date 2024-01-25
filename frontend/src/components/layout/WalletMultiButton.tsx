import { WalletMultiButton as WalletMultiButtonBase } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";

export function WalletMultiButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  return show ? <WalletMultiButtonBase /> : null;
}
