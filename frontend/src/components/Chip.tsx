import { styled } from "@mui/material";
import { Text } from "@/components/Text";
import { ReactNode } from "react";

const Root = styled(Text)`
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 2px 8px;
  border: 1px solid #7c7cba;
  border-radius: 8px;
  color: #a2a2dc;
  white-space: nowrap;
`;

export function Chip(props: { children: ReactNode }) {
  return <Root variant="400|14px|18px">{props.children}</Root>;
}
