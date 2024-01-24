import { Stack, styled } from "@mui/material";

export const Panel = styled(Stack)`
  background: rgba(14, 15, 50, 0.5);
  border: 2px solid ${({ theme }) => theme.palette.background.paper};
  border-radius: 10px;
  padding: 32px;
`;
