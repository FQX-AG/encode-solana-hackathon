import { styled, Theme } from "@mui/material";
import { Text } from "@/components/Text";
import { ReactNode } from "react";
import { SxProps } from "@mui/material/styles";

const Root = styled(Text)`
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  margin-block: -1px;
  padding: 2px 8px;
  border: 1px solid #7c7cba;
  border-radius: 4px;
  color: #a2a2dc;
  white-space: nowrap;
`;

export function Chip(props: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Root variant="400|14px|16px" sx={props.sx}>
      {props.children}
    </Root>
  );
}
