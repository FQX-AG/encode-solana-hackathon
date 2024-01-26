import localFont from "next/font/local";
// noinspection ES6UnusedImports
import {} from "@mui/lab/themeAugmentation";
import { alpha, createTheme } from "@mui/material";

const font = localFont({
  src: [
    {
      path: "font/MatterSQ-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "font/MatterSQ-LightItalic.ttf",
      weight: "300",
      style: "italic",
    },
    {
      path: "font/MatterSQ-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "font/MatterSQ-RegularItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "font/MatterSQ-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "font/MatterSQ-MediumItalic.ttf",
      weight: "500",
      style: "italic",
    },
    {
      path: "font/MatterSQ-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "font/MatterSQ-SemiBoldItalic.ttf",
      weight: "600",
      style: "italic",
    },
    {
      path: "font/MatterSQ-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "font/MatterSQ-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
});

declare module "@mui/material/styles" {
  interface Theme {
    customColors: {
      oxfordBlue500: string;
      oxfordBlue600: string;
      oxfordBlue700: string;
      oxfordBlue800: string;
      oxfordBlue900: string;
    };
  }
  // allow configuration using `createTheme`
  interface ThemeOptions {
    customColors?: {
      oxfordBlue500?: string;
      oxfordBlue600?: string;
      oxfordBlue700?: string;
      oxfordBlue800?: string;
      oxfordBlue900?: string;
    };
  }
}

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "::-webkit-scrollbar": {
          background: "transparent",
          width: "8px",
          height: "8px",
        },
        "::-webkit-scrollbar-track": {
          borderRadius: "10px",
        },
        "::-webkit-scrollbar-thumb": {
          background: "#A2A2DC",
          padding: "1px",
          borderRadius: "10px",
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          fontWeight: 400,
          fontSize: "12px",
          lineHeight: "16px",
          padding: "8px",
          textAlign: "center",
        }),
        arrow: ({ theme }) => ({
          color: theme.palette.background.paper,
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&.Mui-selected": {
            color: `#fff`,
          },
          fontSize: "13px",
          fontWeight: 500,
          lineHeight: "17px",
          color: theme.customColors.oxfordBlue500,
          minWidth: "auto",
          minHeight: "24px",
          boxSizing: "content-box",
          padding: "0 0 8px",
          "&:not(:last-child)": {
            marginRight: "24px",
          },
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: "24px",
        },
        indicator: ({ theme }) => ({
          backgroundColor: theme.customColors.oxfordBlue700,
        }),
      },
    },
    MuiTabPanel: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: "none",
          borderRadius: "4px",
          padding: "16px",
          backgroundColor: theme.palette.background.paper,
        }),
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: "separate",
          borderSpacing: "0 16px",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "tbody.clickable-rows &": {
            cursor: "pointer",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontWeight: 400,
          fontSize: "14px",
          lineHeight: "18px",
          "&:last-of-type": {
            paddingRight: "16px",
          },
          "&:first-of-type": {
            paddingLeft: "16px",
          },
        },
        head: ({ theme }) => ({
          verticalAlign: "top",
          borderBottom: `1px solid ${theme.customColors.oxfordBlue700}`,
          position: "relative",
          padding: "0 8px 12px",
        }),
        body: ({ theme }) => ({
          padding: "16px 8px",
          borderBottom: `1px solid ${theme.customColors.oxfordBlue800}`,
        }),
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiCheckbox: {
      defaultProps: {
        disableRipple: false,
        disableFocusRipple: false,
        disableTouchRipple: true,
      },
    },
    MuiSwitch: {
      defaultProps: {
        disableRipple: false,
        disableFocusRipple: false,
        disableTouchRipple: true,
      },
    },
    MuiLink: {
      styleOverrides: {
        button: {
          fontSize: "inherit",
          fontWeight: "inherit",
          lineHeight: "inherit",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        size: "large",
      },
      styleOverrides: {
        root: {
          fontWeight: 500,
          border: `1px solid transparent`,
          borderRadius: 5,
        },
        sizeLarge: {
          fontSize: "15px",
          lineHeight: "26px",
          padding: "7px 22px",
        },
        sizeMedium: {
          fontSize: "14px",
          lineHeight: "24px",
          padding: "5px 16px",
        },
        sizeSmall: {
          fontSize: "13px",
          lineHeight: "22px",
          padding: "3px 10px",
        },
        iconSizeLarge: {
          position: "relative",
          top: "-1px",
        },
        iconSizeMedium: {
          position: "relative",
          top: "-1px",
        },
        iconSizeSmall: {
          position: "relative",
          top: "-1px",
        },
        text: {
          "&:focus:not(:active)": {
            color: "#fff",
          },
        },
        textSecondary: ({ theme }) => ({
          color: theme.customColors.oxfordBlue600,
        }),
        outlined: ({ theme, ownerState }) => ({
          borderColor: "currentColor",
          "&:focus,&:active": {
            background: alpha(
              ownerState.color !== "inherit" ? theme.palette[ownerState.color ?? "primary"].main : "#FFF",
              0.3
            ),
          },
          "&.MuiButton-outlinedPrimary": {
            borderColor: "#0085FF",
            color: "#FFF",
            "&:hover:not(:focus)": { color: "#0085FF" },
            "&:focus,&:active": { background: "rgba(0, 178, 255, 0.3)" },
          },
          "&.MuiButton-outlinedSecondary": {
            borderColor: theme.customColors.oxfordBlue600,
            color: theme.customColors.oxfordBlue600,
            "&:hover:not(:focus)": { color: "#FFF" },
            "&:focus,&:active": {
              color: "#FFF",
              background: "rgba(39, 39, 84, 0.3)",
            },
          },
          ".MuiLoadingButton-loadingIndicator": { color: theme.palette.action.disabledBackground },
          "&:disabled": {
            color: theme.palette.action.disabledBackground,
            borderColor: theme.palette.action.disabledBackground,
          },
        }),
        contained: ({ theme, ownerState }) => ({
          "&:focus:not(:active)": {
            color: "#fff",
            borderColor:
              ownerState.color === "inherit" ? "currentColor" : theme.palette[ownerState.color ?? "primary"].main,
            backgroundColor: "transparent",
          },
        }),
      },
    },
    MuiAlert: {
      defaultProps: {
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          margin: 0,
          borderRadius: 4,
          fontSize: 14,
          border: "1px solid",
        },
        message: {
          wordBreak: "break-word",
        },
        outlinedWarning: ({ theme }) => ({
          borderColor: theme.palette.warning.main,
          backgroundColor: alpha(theme.palette.warning.dark, 0.12),
          color: theme.palette.warning.light,
          ".MuiAlert-icon": {
            color: theme.palette.warning.main,
          },
        }),
        outlinedError: ({ theme }) => ({
          borderColor: theme.palette.error.main,
          backgroundColor: alpha(theme.palette.error.dark, 0.12),
          color: theme.palette.error.light,
          ".MuiAlert-icon": {
            color: theme.palette.error.main,
          },
        }),
        outlinedSuccess: ({ theme }) => ({
          borderColor: theme.palette.success.main,
          backgroundColor: alpha(theme.palette.success.dark, 0.12),
          color: theme.palette.success.light,
          ".MuiAlert-icon": {
            color: theme.palette.success.main,
          },
        }),
        outlinedInfo: ({ theme }) => ({
          borderColor: theme.palette.info.main,
          backgroundColor: alpha(theme.palette.info.dark, 0.12),
          color: theme.palette.info.light,
          ".MuiAlert-icon": {
            color: theme.palette.info.main,
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          color: "#fff",
          background: "#3B3C58",
        },
        rounded: {
          borderRadius: "24px",
          border: "16px solid transparent",
          "> .MuiList-root": {
            margin: "0 -16px!important",
            width: "auto!important",
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: ({ theme }) => ({
          fontSize: "16px",
          "::placeholder": {
            color: theme.customColors.oxfordBlue600,
          },
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "16px",
          color: "#fff !important",
          maxWidth: "calc(100% - 50px)",
        },
        shrink: {
          maxWidth: "initial",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: "16px",
          "&.Mui-disabled": {
            color: theme.customColors.oxfordBlue700,
          },
        }),
        input: ({ theme }) => ({
          "&:-webkit-autofill": {
            WebkitBoxShadow: `0 0 0 62px ${theme.palette.background.default} inset`,
            WebkitTextFillColor: theme.palette.text.primary,
          },
        }),
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: "16px",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          backgroundColor: "transparent",
          color: "#fff",
          "&.Mui-disabled": {
            WebkitTextFillColor: "unset",
          },
          "&:hover:not(.Mui-disabled):not(:focus) .placeholder": {
            color: "#fff",
          },
          "&.Mui-disabled .placeholder": {
            color: "#454B66",
          },
          "&:focus .placeholder": {
            color: "#454B66",
          },
          "& .placeholder": {
            color: "#A1A3CA",
          },
        },
        iconOpen: {
          transform: `scaleY(-1)`,
        },
        icon: {
          color: "#fff",
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: "#00000066",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#ffffff14",
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        listbox: {
          fontSize: "16px",
        },
        paper: ({ theme }) => ({
          background: theme.palette.background.paper,
          borderRadius: "4px",
          border: 0,
        }),
      },
    },
    MuiAccordion: {
      variants: [
        {
          props: { variant: "outlined" },
          style: {
            color: "red",
            background: "transparent",
            padding: 0,
            margin: "8px 0",
            border: 0,
          },
        },
      ],
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: "10px",
          boxShadow: "none",
          marginBottom: "8px",
          background: theme.palette.background.default,
          "&:before": {
            display: "none",
          },
        }),
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.palette.text.primary,
          paddingTop: 10,
          paddingBottom: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
        }),
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: ({ theme }) => ({
          whiteSpace: "pre-line",
          color: theme.customColors.oxfordBlue600,
        }),
      },
    },
    MuiStack: {
      defaultProps: {
        useFlexGap: true,
      },
    },
  },
  palette: {
    mode: "dark",
    primary: {
      main: "#0085FF",
    },
    secondary: {
      main: "#1C1B45",
    },
    background: {
      default: "#090A21",
      paper: "#1C1B45",
    },
    error: {
      main: "#FF005C",
      light: "#FF8AB4",
      dark: "#CC004A",
    },
    warning: {
      main: "#FFCC1F",
      light: "#FFE384",
      dark: "#FFA726",
    },
    success: {
      main: "#ABC606",
      light: "#F0FF97",
      dark: "#66BB6A",
    },
    info: {
      main: "#00B2FF",
      dark: "#0288D1",
    },
    divider: "#1C1B45",
    action: {
      disabled: "#1C1B45",
      disabledBackground: "#3F3F76",
    },
  },
  typography: font.style,
  customColors: {
    oxfordBlue500: "#A2A2DC",
    oxfordBlue600: "#7C7CBA",
    oxfordBlue700: "#5B5B98",
    oxfordBlue800: "#3F3F76",
    oxfordBlue900: "#272754",
  },
});
