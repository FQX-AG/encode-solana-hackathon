import MUILink from "@mui/material/Link";
import React, { ReactNode } from "react";

export function ExternalLink(props: { href?: string; color?: "inherit"; children: ReactNode }) {
  return (
    <MUILink href={props.href} color={props.color} target="_blank" rel="noopener noreferrer">
      {props.children}
    </MUILink>
  );
}
