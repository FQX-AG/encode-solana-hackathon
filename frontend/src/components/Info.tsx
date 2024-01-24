import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import * as React from "react";
import { ReactNode, forwardRef } from "react";

import { Tooltip } from "@/components/Tooltip";

export type InfoProps = {
  children?: ReactNode;
  tooltip?: ReactNode;
  tooltipError?: string;
};

const icon = <InfoOutlinedIcon sx={{ fontSize: "16px", color: "#A2A2DC" }} />;

export const Info = forwardRef<HTMLSpanElement, InfoProps>(({ children, tooltip, tooltipError, ...rest }, ref) => {
  return (
    <Stack ref={ref} component="span" display="inline-flex" direction="row" alignItems="center" spacing={1} {...rest}>
      {children && (
        <Box component="span" sx={{ flex: "1 1 0" }}>
          {children}
        </Box>
      )}
      {tooltip ? (
        <Tooltip title={tooltip} error={tooltipError}>
          {icon}
        </Tooltip>
      ) : (
        icon
      )}
    </Stack>
  );
});
Info.displayName = "Info";
