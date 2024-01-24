import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import SelectBase from "@mui/material/Select";
import { styled, SxProps, Theme } from "@mui/material/styles";
import { useField } from "formik";
import { ReactNode, FocusEventHandler } from "react";

import { Tooltip } from "@/components/Tooltip";
import { Info } from "@/components/Info";

const Select = styled(SelectBase)(({ endAdornment }) => ({
  ".MuiSelect-icon": {
    right: endAdornment ? "32px" : undefined,
  },
}));

const MenuProps = {
  PaperProps: {
    sx: {
      background: "#3f3f76",
      boxShadow:
        "0 8px 11px -5px rgba(0, 0, 0, 0.2), 0px 17px 26px 2px rgba(0, 0, 0, 0.14), 0px 6px 32px 5px rgba(0, 0, 0, 0.12)",
      borderRadius: "4px",
      border: "none",
      ".MuiList-root": {
        margin: "0 !important",
      },
    },
  },
};

export type SelectFieldProps<T extends string | number> = {
  name: string;
  label?: string;
  id: string;
  options: ([T, string] | [T, string, boolean])[];
  isDisabled?: boolean;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  sx?: SxProps<Theme>;
  "aria-labelledby"?: string;
  renderValue?: (value: T) => ReactNode;
  tooltip?: string;
};

export function SelectField<T extends string | number>(props: SelectFieldProps<T>) {
  const [, { value, error }, { setValue }] = useField<T>(props.name);

  return (
    <Tooltip title={props.tooltip ?? ""} error={error}>
      <FormControl variant="outlined" error={!!error} data-error={!!error} disabled={props.isDisabled} sx={props.sx}>
        {props.label && <InputLabel htmlFor={props.id}>{props.label}</InputLabel>}
        <Select
          MenuProps={MenuProps}
          name={props.name}
          id={props.id}
          label={props.label}
          aria-labelledby={props["aria-labelledby"]}
          value={value}
          onChange={(e) => setValue(e.target.value as T)}
          onBlur={props.onBlur}
          // @ts-ignore
          renderValue={props.renderValue}
          endAdornment={
            props.tooltip ? (
              <InputAdornment position="end">
                <Info />
              </InputAdornment>
            ) : undefined
          }
        >
          {props.options.map(([value, label, enabled]) => (
            <MenuItem key={value} value={value} disabled={enabled === false}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Tooltip>
  );
}
