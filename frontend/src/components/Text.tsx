import { Box, styled, SxProps, Theme } from "@mui/material";
import { createElement, ElementType, forwardRef, ReactNode } from "react";

const variants = [
  "400|10px|11px",
  "400|12px|16px",
  "400|14px|16px",
  "400|14px|18px",
  "400|16px|21px",
  "500|12px|13px",
  "500|14px|18px",
  "500|18px|23px",
  "500|20px|26px",
  "500|22px|29px",
  "500|32px|35px",
  "600|24px|31px",
] as const;

type Variant = (typeof variants)[number];

const components = variants.reduce((acc, key) => {
  const [fontWeight, fontSize, lineHeight] = key.split("|");
  acc[key] = styled(Box)({ fontWeight, fontSize, lineHeight }) as typeof Box;
  return acc;
}, {} as { [Key in Variant]: typeof Box });

type TextProps = {
  variant: Variant;
  children: ReactNode;
  color?: keyof Theme["customColors"];
  component?: ElementType;
  sx?: SxProps<Theme>;
  className?: string;
};

export const Text = forwardRef<HTMLElement, TextProps>((props, ref) => {
  const Component = components[props.variant] ?? Box;
  const { color } = props;
  const sx: SxProps<Theme> | undefined = color
    ? { ...props.sx, color: (theme) => theme.customColors[color] }
    : props.sx;

  return createElement(Component, { ref, component: props.component, sx, className: props.className }, props.children);
});
Text.displayName = "Text";
