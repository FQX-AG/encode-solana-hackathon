import Stack from "@mui/material/Stack";

import { QrCode } from "@/components/QrCode";

type NoteQrCodeProps = {
  address: string;
};

export function NoteQrCode(props: NoteQrCodeProps) {
  const url = `https://solscan.io/account/${props.address}?cluster=devnet`;

  return (
    <Stack
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      alignItems="flex-end"
      sx={{ color: "inherit", textDecoration: "none" }}
    >
      <QrCode value={url} size={120} />
    </Stack>
  );
}
