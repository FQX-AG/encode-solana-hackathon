import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { styled, SxProps, Theme } from "@mui/material/styles";
import { clamp, inRange } from "lodash-es";
import * as React from "react";
import { ReactNode, useMemo, useState } from "react";

import { Tooltip } from "@/components/Tooltip";
import { Text } from "@/components/Text";

export type Dot = {
  position: number;
  variant: "small" | "big";
  highlighted: boolean;
};

export type Ticker = {
  position: number;
  value?: ReactNode;
  label?: ReactNode;
  labelAlignment?: "flex-start" | "flex-end" | "center";
  color?: string | ((theme: Theme) => string);
  isAtBottom?: boolean;
  tooltip?: string;
  hidden?: boolean;
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

const BAR_HEIGHT = 9;
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
  margin-bottom: 8px;

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
  margin-top: 8px;

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
        visibility: props.hidden ? "hidden" : undefined,
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
        visibility: props.hidden ? "hidden" : undefined,
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

const DotComponent = (
  props: Dot & {
    onMouseEnter?: React.MouseEventHandler<SVGSVGElement>;
    onMouseLeave?: React.MouseEventHandler<SVGSVGElement>;
  }
) => {
  let size, strokeWidth;
  switch (props.variant) {
    case "small":
      size = 14;
      strokeWidth = 3;
      break;
    case "big":
      size = 24;
      strokeWidth = 4;
      break;
  }
  const highlightSize = size * 2;

  return (
    <Box
      sx={{
        position: "absolute",
        width: 0,
        whiteSpace: "nowrap",
        left: `${props.position}%`,
        top: "50%",
        zIndex: props.highlighted ? 1 : 0,
      }}
    >
      {props.highlighted && (
        <svg
          style={{ position: "absolute", top: -highlightSize / 2, left: -highlightSize / 2, pointerEvents: "none" }}
          xmlns="http://www.w3.org/2000/svg"
          width={highlightSize}
          height={highlightSize}
          viewBox={`0 0 ${highlightSize} ${highlightSize}`}
          fill="none"
        >
          <circle
            cx={highlightSize / 2}
            cy={highlightSize / 2}
            r={highlightSize / 2}
            fill="#00B2FF"
            fill-opacity="0.2"
          />
        </svg>
      )}
      <svg
        style={{ position: "absolute", top: -size / 2, left: -size / 2 }}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - strokeWidth}
          fill={props.highlighted ? "#00B2FF" : "#3F3F76"}
          stroke="white"
          strokeWidth={strokeWidth}
        />
      </svg>
    </Box>
  );
};

type ProgressBarProps = {
  bars?: (Bar | null | undefined)[];
  tickers?: (Ticker | null | undefined)[];
  dots?: (Dot | null | undefined)[];
  sx?: SxProps;
  onDotHoverTargetChange?: (index?: number) => void;
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
  const dots = useMemo(() => {
    return props.dots?.filter<Dot>((dot): dot is Dot => !!dot);
  }, [props.dots]);

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
        {dots?.map((dot, index) => (
          <DotComponent
            key={index}
            {...dot}
            onMouseEnter={props.onDotHoverTargetChange && (() => props.onDotHoverTargetChange?.(index))}
            onMouseLeave={props.onDotHoverTargetChange && (() => props.onDotHoverTargetChange?.(undefined))}
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
