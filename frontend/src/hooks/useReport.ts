import { useSnackbar } from "notistack";
import { useMemo } from "react";

export function useReport() {
  const { enqueueSnackbar } = useSnackbar();

  return useMemo(
    () => ({
      success: (message: string) => {
        enqueueSnackbar(message, { variant: "success" });
      },
      error: (err: unknown) => {
        console.error(err);
        enqueueSnackbar(err instanceof Error ? err.message : String(err), { variant: "error" });
      },
    }),
    [enqueueSnackbar]
  );
}
