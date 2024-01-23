import { Box, styled, SxProps, Theme } from "@mui/material";
import { createElement, ElementType, forwardRef, ReactNode } from "react";

const variants = ["600|64px|83px"] as const;

type Variant = (typeof variants)[number];

const components = variants.reduce((acc, key) => {
  const [fontWeight, fontSize, lineHeight] = key.split("|");
  acc[key] = styled(Box)({ fontWeight, fontSize, lineHeight }) as typeof Box;
  return acc;
}, {} as { [Key in Variant]: typeof Box });

type TextProps = {
  variant: Variant;
  children: ReactNode;
  component?: ElementType;
  sx?: SxProps<Theme>;
};

const Text = forwardRef<HTMLElement, TextProps>(({ variant, children, ...rest }, ref) => {
  const component = components[variant] ?? Box;

  return createElement(component, { ref, ...rest }, children);
});

export default Text;
