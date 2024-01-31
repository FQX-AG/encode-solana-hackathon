import { styled } from "@mui/material/styles";

export const Table = styled("table")({
  borderCollapse: "separate",
  borderSpacing: 0,
  margin: "0 -8px",
  "thead > tr > td": {
    padding: "0 8px",
  },
  "tbody > tr > td": {
    backgroundClip: "padding-box",
    boxSizing: "content-box",
    height: "32px",
    verticalAlign: "middle",
    padding: "8px",
    borderTop: "8px solid transparent",
  },
});
