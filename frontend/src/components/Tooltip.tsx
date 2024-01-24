import { Tooltip as TooltipBase, tooltipClasses, styled } from "@mui/material";
import { ReactElement, ReactNode } from "react";

type TooltipProps = { title: ReactNode; children: ReactElement; className?: string; error?: string };

const PopperProps = { container: () => document.querySelector("#__next") };

export const Tooltip = styled((props: TooltipProps) => {
  return (
    <TooltipBase
      placement="top"
      PopperProps={PopperProps}
      title={props.error ? props.error : props.title}
      classes={{ popper: [props.className, props.error ? "error" : undefined].filter(Boolean).join(" ") }}
    >
      {props.children}
    </TooltipBase>
  );
})(({ theme }) => ({
  [`.${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.customColors.oxfordBlue500,
    color: "#1A1757",
  },
  [`.${tooltipClasses.arrow}`]: {
    color: theme.customColors.oxfordBlue500,
  },
  "&.error": {
    [`.${tooltipClasses.arrow}`]: {
      color: theme.palette.error.main,
    },
    [`.${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.error.main,
      color: "#fff",
      fontWeight: 600,
    },
  },
}));
