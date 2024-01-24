import TextFieldBase from "@mui/material/TextField";
import { SxProps } from "@mui/material/styles";
import { useField } from "formik";
import { ReactNode, ClipboardEventHandler } from "react";

import { Tooltip } from "@/components/Tooltip";

export type TextFieldProps = {
  name: string;
  label?: ReactNode;
  placeholder?: string;
  id: string;
  sx?: SxProps;
  multiline?: boolean;
  hasErrorState?: boolean;
  hasTooltipError?: boolean;
  helperText?: string | ((value: string) => string);
  ["data-private"]?: boolean;
  endAdornment?: ReactNode;
  size?: "small" | "medium";
  minRows?: number;
  onPaste?: ClipboardEventHandler<HTMLDivElement>;
};

export function TextField({
  hasErrorState = true,
  hasTooltipError = true,
  helperText,
  endAdornment,
  ...props
}: TextFieldProps) {
  const [, { value, error }, { setValue }] = useField<string>(props.name);

  return (
    <Tooltip title={""} error={hasErrorState && hasTooltipError ? error : undefined}>
      <TextFieldBase
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={hasErrorState && !!error}
        data-error={hasErrorState && !!error}
        helperText={typeof helperText === "function" ? helperText(value) : helperText}
        InputProps={{ endAdornment }}
        {...props}
      />
    </Tooltip>
  );
}
