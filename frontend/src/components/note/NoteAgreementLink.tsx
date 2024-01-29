import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { styled, SxProps, Theme } from "@mui/material/styles";
import { Text } from "@/components/Text";

type NoteAgreementLinkProps = {
  href: string;
  label: string;
  sx?: SxProps<Theme>;
};

const Root = styled("a")({
  textDecoration: "none",
  color: "#7F74D2",
  display: "flex",
  alignItems: "center",
});

export function NoteAgreementLink({ href, label, sx }: NoteAgreementLinkProps) {
  if (!href) {
    return null;
  }

  return (
    <Root href={href} target="_blank" rel="noopener noreferrer" sx={sx}>
      <Text variant="500|14px|18px" component="span">
        {label}
      </Text>
      <FileDownloadOutlinedIcon fontSize="small" color="inherit" sx={{ ml: 0.5, mr: -0.5 }} />
    </Root>
  );
}
