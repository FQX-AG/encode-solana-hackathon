import { styled } from "@mui/material/styles";

export const Table = styled("table")({
  width: "100%",
  borderCollapse: "collapse",
  td: { verticalAlign: "baseline", boxSizing: "content-box" },
  "tfoot > tr:first-of-type > td": { borderTop: "32px solid transparent" },
  "td:not(:last-of-type)": { borderRight: "32px solid transparent" },
  "thead > tr:last-of-type > td": { borderBottom: "8px solid transparent" },
  "tr:not(:last-of-type) > td": { borderBottom: "8px solid transparent" },
});
