import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { QrCode } from "@/components/QrCode";
import { Text } from "@/components/Text";

type NoteQrCodeProps = {
  explorerName: string;
  explorerUrl: string;
  address: string;
};

export function NoteQrCode(props: NoteQrCodeProps) {
  const url = `${props.explorerUrl}/address/${props.address}`;

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
      <Box>
        <Text variant="400|14px|18px" component="span" color="oxfordBlue500">
          See on {props.explorerName}
        </Text>{" "}
        <OpenInNewOutlined color="primary" sx={{ verticalAlign: "middle", fontSize: "18px" }} />
      </Box>
    </Stack>
  );
}
