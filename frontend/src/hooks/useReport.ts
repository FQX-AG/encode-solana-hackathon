import { useSnackbar } from "notistack";
import { useMemo } from "react";

export function useReport() {
  const { enqueueSnackbar } = useSnackbar();

  return useMemo(
    () => ({
      success: (message: string) => {
        enqueueSnackbar(message, { variant: "success" });
      },
      error: (e: unknown) => {
        console.error(e);
        enqueueSnackbar(e instanceof Error ? e.message : String(e), { variant: "error" });
      },
    }),
    [enqueueSnackbar]
  );
}
