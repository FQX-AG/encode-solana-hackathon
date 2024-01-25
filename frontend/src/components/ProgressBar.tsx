import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { styled, SxProps, Theme } from "@mui/material/styles";
import { clamp, inRange } from "lodash-es";
import * as React from "react";
import { ReactNode, useMemo } from "react";

import { Tooltip } from "@/components/Tooltip";
import { Text } from "@/components/Text";

export type Ticker = {
  position: number;
  value?: ReactNode;
  label?: ReactNode;
  labelAlignment?: "flex-start" | "flex-end" | "center";
  color?: string | ((theme: Theme) => string);
  isAtBottom?: boolean;
  tooltip?: string;
};

export type Bar = {
  start: number;
  stop: number;
  color?: string | ((theme: Theme) => string);
  opacity?: number;
  zIndex?: number;
  label?: ReactNode;
  secondaryLabel?: ReactNode;
};

const BAR_HEIGHT = 10;
const DEFAULT_COLOR = "#A2A2DC";

const VerticalBar = styled("div")`
  height: 26px;
  width: 2px;
  position: relative;
  left: -1px;
`;

const TopVerticalBar = styled(VerticalBar, {
  shouldForwardProp: (name: any) => !["hasDot"].includes(name),
})<{ hasDot?: boolean }>`
  margin-bottom: -${BAR_HEIGHT}px;

  ::before {
    content: "";
    display: ${({ hasDot }) => (hasDot ? "block" : "none")};
    position: absolute;
    inset: -11px auto 0 -11px;
    border: 12px solid transparent;
  }

  ::after {
    content: "";
    display: ${({ hasDot }) => (hasDot ? "block" : "none")};
    position: absolute;
    inset: -2px auto auto -2px;
    border: 3px solid transparent;
    border-radius: 3px;
    background-color: inherit;
  }
`;

const BottomVerticalBar = styled(VerticalBar, {
  shouldForwardProp: (name: any) => !["hasDot"].includes(name),
})<{ hasDot?: boolean }>`
  margin-top: -${BAR_HEIGHT}px;

  ::after {
    content: "";
    display: ${({ hasDot }) => (hasDot ? "block" : "none")};
    position: absolute;
    inset: auto auto -2px -2px;
    border: 3px solid transparent;
    border-radius: 3px;
    background-color: inherit;
  }
`;

const TopTicker = (props: Ticker & { marginBottom: number }) => {
  return (
    <Box
      sx={{
        zIndex: "1",
        position: "relative",
        width: 0,
        whiteSpace: "nowrap",
        left: `${props.position}%`,
      }}
    >
      <Stack
        spacing={1}
        sx={{
          marginTop: 0,
          marginBottom: `${BAR_HEIGHT + props.marginBottom}px`,
          alignItems: props.labelAlignment ?? (props.position >= 50 ? "flex-end" : "flex-start"),
        }}
      >
        {props.label && (
          <Text variant="500|14px|18px" color="oxfordBlue500">
            {props.label}
          </Text>
        )}
        {props.value}
      </Stack>
      <Tooltip title={props.tooltip}>
        <TopVerticalBar hasDot={!!props.tooltip} sx={{ backgroundColor: props.color ?? DEFAULT_COLOR }} />
      </Tooltip>
    </Box>
  );
};

const BottomTicker = (props: Ticker) => {
  return (
    <Box
      sx={{
        position: "relative",
        width: 0,
        whiteSpace: "nowrap",
        left: `${props.position}%`,
      }}
    >
      <BottomVerticalBar hasDot={!!props.tooltip} sx={{ backgroundColor: props.color ?? DEFAULT_COLOR }} />
      <Stack
        spacing={1}
        sx={{
          marginBottom: 0,
          marginTop: `${BAR_HEIGHT}px`,
          alignItems: props.labelAlignment ?? (props.position >= 50 ? "flex-end" : "flex-start"),
        }}
      >
        {props.label && (
          <Text variant="500|14px|18px" color="oxfordBlue500">
            {props.label}
          </Text>
        )}
        {props.value}
      </Stack>
    </Box>
  );
};

type ProgressBarProps = {
  bars?: (Bar | null | undefined)[];
  tickers?: (Ticker | null | undefined)[];
  sx?: SxProps;
};

export function ProgressBar(props: ProgressBarProps) {
  const bars = useMemo(() => {
    return props.bars
      ?.filter<Bar>((bar): bar is Bar => !!bar)
      .map((bar) => ({
        ...bar,
        position: {
          left: clamp(bar.start, 0, 100).toFixed(3) + "%",
          right: (100 - clamp(bar.stop, 0, 100)).toFixed(3) + "%",
        },
      }));
  }, [props.bars]);
  const { topTickers, bottomTickers } = useMemo(() => {
    const tickers: Ticker[] | undefined = props.tickers?.filter<Ticker>(
      (ticker): ticker is Ticker => !!ticker && (ticker.position === 100 || inRange(ticker.position, 0, 100))
    );

    return {
      topTickers: tickers?.filter((ticker) => !ticker.isAtBottom),
      bottomTickers: tickers?.filter((ticker) => ticker.isAtBottom),
    };
  }, [props.tickers]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", ...props.sx }}>
      <Box sx={{ display: "flex", alignItems: "flex-end" }}>
        {topTickers?.map((ticker, index) => (
          <TopTicker key={index} marginBottom={bars?.some((bar) => bar.secondaryLabel) ? 10 : 0} {...ticker} />
        ))}
      </Box>

      <Box sx={{ position: "relative" }}>
        {bars
          ?.filter((bar) => bar.secondaryLabel)
          .map((bar, index) => {
            return (
              <Text
                variant="500|14px|18px"
                key={index}
                sx={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: bar.position.left,
                  right: bar.position.right,
                  color: "#7C7CBA",
                  textAlign: "center",
                  px: 2,
                }}
              >
                {bar.secondaryLabel}
              </Text>
            );
          })}
      </Box>

      <Box
        sx={{
          height: `${BAR_HEIGHT}px`,
          position: "relative",
        }}
      >
        <Box
          sx={{
            height: "100%",
            width: "100%",
            backgroundColor: "#53607E",
            opacity: 0.4,
          }}
        />
        {bars?.map((bar, index) => (
          <Box
            key={index}
            sx={{
              height: "100%",
              width: "auto",
              position: "absolute",
              top: 0,
              left: bar.position.left,
              right: bar.position.right,
              backgroundColor: bar.color ?? DEFAULT_COLOR,
              opacity: bar.opacity ?? 1,
              zIndex: bar.zIndex ?? 1,
            }}
          />
        ))}
      </Box>

      {bars && bars.some((bar) => bar.label) && (
        <Box sx={{ height: `32px`, position: "relative" }}>
          {bars
            .filter((bar) => bar.label)
            .map((bar, index) => {
              return (
                <Box
                  key={index}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: bar.position.left,
                    right: bar.position.right,
                    color: "#7C7CBA",
                    display: "flex",
                    alignItems: "flex-end",
                    margin: "0 -1px",
                    borderLeft: `2px solid currentColor`,
                    borderRight: `2px solid currentColor`,
                    "&::before, &::after": {
                      content: '""',
                      display: "block",
                      borderBottom: `2px solid currentColor`,
                      flex: "1",
                    },
                  }}
                >
                  <Text
                    variant="500|14px|18px"
                    sx={{
                      flex: "0 0 auto",
                      position: "relative",
                      top: "8px",
                      px: 2,
                      textAlign: "center",
                    }}
                  >
                    {bar.label}
                  </Text>
                </Box>
              );
            })}
        </Box>
      )}

      <Box sx={{ display: "flex", alignItems: "flex-start" }}>
        {bottomTickers?.map((ticker, index) => (
          <BottomTicker key={index} {...ticker} />
        ))}
      </Box>
    </Box>
  );
}
