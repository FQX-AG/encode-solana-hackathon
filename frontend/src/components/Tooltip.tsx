import { Tooltip as TooltipBase, TooltipProps as TooltipBaseProps, tooltipClasses, styled } from "@mui/material";

type TooltipProps = Pick<TooltipBaseProps, "title" | "slotProps" | "children" | "className" | "placement" | "arrow"> & {
  error?: string;
};

const PopperProps = { container: () => document.querySelector("#__next") };

export const Tooltip = styled(({ error, title, children, ...props }: TooltipProps) => {
  return (
    <TooltipBase
      placement="top"
      PopperProps={PopperProps}
      title={error ?? title}
      classes={{ popper: [props.className, error ? "error" : undefined].filter(Boolean).join(" ") }}
      {...props}
    >
      {children}
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
