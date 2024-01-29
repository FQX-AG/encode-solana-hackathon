import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput, { OutlinedInputProps } from "@mui/material/OutlinedInput";
import { SxProps } from "@mui/material/styles";
import { useField } from "formik";
import * as React from "react";
import { ReactNode } from "react";
import { NumericFormat } from "react-number-format";

import { Tooltip } from "@/components/Tooltip";

type NumericFieldProps = {
  tooltip?: string;
  name: string;
  label: ReactNode;
  id: string;
  decimalScale?: number;
  hasFixedDecimalScale?: boolean;
  sx?: SxProps;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  size?: "medium" | "small";
};

const CustomInput = (props: OutlinedInputProps) => <OutlinedInput {...props} />;

export const NumericField = (props: NumericFieldProps) => {
  const [, { value, error }, { setValue }] = useField<string>(props.name);

  return (
    <Tooltip title={props.tooltip ?? ""} error={error}>
      <FormControl variant="outlined" error={!!error} data-error={!!error} sx={props.sx} size={props.size}>
        <InputLabel htmlFor={props.id}>{props.label}</InputLabel>
        <NumericFormat
          allowNegative={false}
          decimalScale={props.decimalScale ?? 2}
          fixedDecimalScale={props.hasFixedDecimalScale}
          thousandsGroupStyle="thousand"
          thousandSeparator=","
          name={props.name}
          value={value}
          valueIsNumericString
          onValueChange={(values) => setValue(values.value)}
          onBlur={props.onBlur}
          customInput={CustomInput}
          id={props.id}
          startAdornment={props.startAdornment}
          endAdornment={props.endAdornment}
          label={props.label}
        />
      </FormControl>
    </Tooltip>
  );
};
