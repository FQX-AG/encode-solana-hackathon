import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import { SxProps } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import addMinutes from "date-fns/addMinutes";
import subMinutes from "date-fns/subMinutes";
import { useField } from "formik";
import * as React from "react";
import { ReactNode, useCallback, useRef, useState } from "react";

import { Tooltip } from "@/components/Tooltip";
import { formatDateUTC, DATE_AND_TIME_FORMAT, formatDate, formatUtcOffset } from "@/formatters";
import { isValidDate } from "@/utils";
import { InfoAdornment } from "@/components/form/InfoAdornment";

export type DateTimeFieldProps = {
  name: string;
  label: ReactNode;
  id: string;
  sx?: SxProps;
  mode?: "input" | "icon";
  isDisabled?: boolean;
  isUTC?: boolean;
  size?: "medium" | "small";
};

export const DateTimeField = ({ mode = "input", isUTC, ...props }: DateTimeFieldProps) => {
  const [, meta, { setValue }] = useField<Date | null | undefined>(props.name);
  const pickerRef = useRef(null);
  const iconRef = useRef(null);
  const [opened, setOpened] = useState<boolean>(false);

  let value = meta.value;
  if (isUTC && value && isValidDate(value)) value = addMinutes(value, value.getTimezoneOffset());
  const suffix = isUTC ? "UTC" : "Select local time";
  const tooltip =
    meta.value && isValidDate(meta.value) && !opened
      ? isUTC
        ? `${formatDate(meta.value, true)} (${formatUtcOffset(meta.value)})`
        : formatDateUTC(meta.value, true)
      : "";

  const handleClose = useCallback(() => setOpened(false), []);
  const handleOpen = useCallback(() => setOpened(true), []);
  const handleChange = useCallback(
    (value: Date | null) => {
      if (isUTC && value && isValidDate(value)) {
        setValue(subMinutes(value, value.getTimezoneOffset()));
      } else {
        setValue(value);
      }
    },
    [isUTC, setValue]
  );

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
        value={value ?? null}
        disabled={props.isDisabled}
        onChange={handleChange}
        OpenPickerButtonProps={{
          tabIndex: -1,
        }}
        components={{
          OpenPickerIcon: CalendarTodayOutlinedIcon,
        }}
        renderInput={({ InputProps, ...params }) =>
          mode === "input" ? (
            <Tooltip title={tooltip} error={meta.error}>
              <TextField
                data-error={!!meta.error}
                size={props.size}
                id={props.id}
                sx={props.sx}
                {...params}
                InputLabelProps={{
                  error: !!meta.error,
                }}
                InputProps={{
                  ...InputProps,
                  endAdornment: (
                    <>
                      {InputProps?.endAdornment}
                      <InfoAdornment sx={{ ml: 2 }}>({suffix})</InfoAdornment>
                    </>
                  ),
                }}
              />
            </Tooltip>
          ) : mode === "icon" ? (
            <IconButton
              ref={iconRef}
              color="primary"
              onClick={() => setOpened(true)}
              id={props.id}
              disabled={props.isDisabled}
            >
              <CalendarTodayOutlinedIcon />
            </IconButton>
          ) : (
            <></>
          )
        }
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
