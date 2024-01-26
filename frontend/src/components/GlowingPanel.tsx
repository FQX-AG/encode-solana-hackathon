import { styled } from "@mui/material";
import { Panel } from "@/components/Panel";

export const GlowingPanel = styled(Panel)`
  border-radius: 10px;
  border: 2px solid var(--FQX-oxford-blue-900, #272754);
  background: var(--Platform-Side-bar, rgba(14, 15, 50, 0.5));
  box-shadow: -1px 0px 4px 10px rgba(23, 23, 72, 0.64);
`;
