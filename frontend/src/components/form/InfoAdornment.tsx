import InputAdornment from "@mui/material/InputAdornment";
import { SxProps } from "@mui/material/styles";
import * as React from "react";
import { ReactNode } from "react";

import { Info } from "@/components/Info";

export type InfoAdornmentProps = {
  children?: ReactNode;
  sx?: SxProps;
};

export const InfoAdornment = (props: InfoAdornmentProps) => {
  return (
    <InputAdornment position="end" sx={{ userSelect: "none", color: "#7C7CBA", ...props.sx }} disableTypography>
      <Info>{props.children}</Info>
    </InputAdornment>
  );
};
