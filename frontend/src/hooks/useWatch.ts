import { useEffect, useRef, useState } from "react";
import { AnchorProvider } from "@coral-xyz/anchor";

type WatchFn<T, Context> = (
  provider: AnchorProvider,
  publicKeyBase58: string,
  ctx: Context,
  fn: (value: T) => void
) => () => void;

export function useWatch<T, Context>(
  watchFn: WatchFn<T, Context>,
  ctx?: Context,
  provider?: AnchorProvider,
  publicKeyBase58?: string
): T | undefined {
  const [value, setValue] = useState<T>();

  useEffect(() => {
    if (!provider || !publicKeyBase58 || !ctx) return;

    return watchFn(provider, publicKeyBase58, ctx, (value) => {
      console.log(`[${watchFn.name}]`, value);
      setValue(value);
    });
  }, [provider, publicKeyBase58, ctx]);

  return value;
}
