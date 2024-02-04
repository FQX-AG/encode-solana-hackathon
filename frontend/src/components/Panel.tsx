import { Stack, styled } from "@mui/material";

export const Panel = styled(Stack)`
  background: #0c0c29;
  border: 2px solid ${({ theme }) => theme.palette.background.paper};
  border-radius: 10px;
  padding: 32px;
`;
