import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import TextField from "@mui/material/TextField";
import { SxProps } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useField } from "formik";
import * as React from "react";
import { ReactNode, useCallback, useRef, useState } from "react";

import { Tooltip } from "@/components/Tooltip";
import { DATE_AND_TIME_FORMAT } from "@/formatters";

type DateTimeFieldProps = {
  name: string;
  label: ReactNode;
  id: string;
  sx?: SxProps;
  disabled?: boolean;
};

export const DateTimeField = (props: DateTimeFieldProps) => {
  const [, meta, { setValue }] = useField<Date | null | undefined>(props.name);
  const pickerRef = useRef(null);
  const iconRef = useRef(null);
  const [opened, setOpened] = useState<boolean>(false);

  const handleClose = useCallback(() => setOpened(false), []);
  const handleOpen = useCallback(() => setOpened(true), []);
  const handleChange = useCallback((value: Date | null) => setValue(value), [setValue]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DateTimePicker
        ref={pickerRef}
        InputProps={{ error: !!meta.error }}
        disableMaskedInput
        inputFormat={DATE_AND_TIME_FORMAT}
        open={opened}
        onOpen={handleOpen}
        onClose={handleClose}
        ampm={false}
        label={props.label}
        value={meta.value}
        disabled={props.disabled}
        onChange={handleChange}
        OpenPickerButtonProps={{
          tabIndex: -1,
        }}
        components={{
          OpenPickerIcon: CalendarTodayOutlinedIcon,
        }}
        renderInput={({ InputProps, ...params }) => (
          <Tooltip title="" error={meta.error}>
            <TextField
              data-error={!!meta.error}
              id={props.id}
              sx={{ ".MuiInputBase-root": { paddingRight: "24px" }, ...props.sx }}
              {...params}
              InputLabelProps={{ error: !!meta.error }}
              InputProps={InputProps}
            />
          </Tooltip>
        )}
        disablePast
        PopperProps={{
          anchorEl: pickerRef.current ?? iconRef.current,
        }}
        PaperProps={{
          sx: (theme) => ({
            background: "#3f3f76",
            boxShadow:
              "0 8px 11px -5px rgba(0, 0, 0, 0.2), 0px 17px 26px 2px rgba(0, 0, 0, 0.14), 0px 6px 32px 5px rgba(0, 0, 0, 0.12)",
            borderRadius: "4px",
            border: "none",

            ".MuiTypography-root": {
              fontFamily: "inherit",
            },
            ".MuiButtonBase-root, .PrivatePickersYear-yearButton": {
              fontFamily: "inherit",
              backgroundColor: "transparent",
              transition: theme.transitions.create(["color", "background-color"], {
                duration: theme.transitions.duration.shortest,
              }),

              "&:hover": {
                backgroundColor: theme.palette.action.disabled,
              },

              "&.Mui-selected": {
                backgroundColor: "#0085FF",
                color: theme.palette.background.default,

                "&:hover": {
                  backgroundColor: "#0085FF",
                },
              },
            },
            ".MuiPickersDay-today": {
              border: "none",
            },
            ".MuiIconButton-root": {
              color: "#a2a2dc",
              background: "none",

              "&:hover": {
                color: "#fff",
                background: "none",
              },
            },
          }),
        }}
      />
    </LocalizationProvider>
  );
};
