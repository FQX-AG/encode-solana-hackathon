import { useEffect, useState } from "react";
import { AnchorProvider } from "@coral-xyz/anchor";

type WatchFn<T> = (provider: AnchorProvider, publicKeyBase58: string, fn: (value: T) => void) => () => void;

export function useWatch<T>(watchFn: WatchFn<T>, provider?: AnchorProvider, publicKeyBase58?: string): T | undefined {
  const [value, setValue] = useState<T>();

  useEffect(() => {
    if (!provider || !publicKeyBase58) return;

    return watchFn(provider, publicKeyBase58, (value) => {
      console.log(`[${watchFn.name}]`, value);
      setValue(value);
    });
  }, [provider, publicKeyBase58]);

  return value;
}
