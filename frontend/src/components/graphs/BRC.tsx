import { ChartData, ChartDataset, Point, Scale } from "chart.js";
import numeral from "numeral";
import { useMemo } from "react";

import SPChart, { SPChartOptions } from "./partials/SPChart";
import { brcPayoff } from "./calculations";
import { getBackgroundGradient } from "./common";
import {
  TEXT_COLOR,
  LINE_COLOR_A,
  LINE_COLOR_B,
  LINE_COLOR_C,
  OFFSET,
  POINT_RADIUS,
  POINT_BORDER_COLOR,
  POINT_COLOR_A,
  POINT_COLOR_B,
  LABEL_BORDER_COLOR,
} from "./constants";
import crosshair from "./plugins/crosshair";
import { BRCType } from "@/constants";

function getGraphData(
  barrier: number,
  coupon: number,
  type: BRCType,
  initialFixingPrice: number
): ChartData<"scatter"> {
  const xMin = Math.min(barrier - 0.1, 1 - OFFSET);
  const xBreak = barrier;
  const xMiddle = 1;
  const xMax = 1 + (1 - xMin);
  const datasets: ChartDataset<"scatter", Point[]>[] = [];

  datasets.push({
    showLine: true,
    data: [
      { x: xMin, y: xMin - 1 },
      { x: xMax, y: xMax - 1 },
    ],
    pointStyle: false,
    borderWidth: 1,
    borderColor: LINE_COLOR_B,
    borderJoinStyle: "round",
    borderDash: [5, 5],
  });
  datasets.push({
    showLine: true,
    data: [
      { x: xMin, y: brcPayoff(xMin, barrier, coupon, true) },
      { x: xBreak, y: brcPayoff(xBreak, barrier, coupon, true) },
    ],
    fill: true,
    pointStyle: (ctx) => (ctx.dataIndex === 1 ? "circle" : false),
    pointRadius: POINT_RADIUS,
    pointBorderWidth: 1,
    pointBorderColor: POINT_BORDER_COLOR,
    pointBackgroundColor: POINT_COLOR_A,
    backgroundColor: getBackgroundGradient(coupon),
    borderColor: LINE_COLOR_C,
    borderWidth: 3,
  });
  if (type !== BRCType.European)
    datasets.push({
      showLine: true,
      data: [
        { x: xBreak, y: brcPayoff(xBreak, barrier, coupon, true) },
        { x: xMiddle, y: brcPayoff(xMiddle, barrier, coupon, true) },
      ],
      pointStyle: (ctx) => (ctx.dataIndex === 1 ? "circle" : false),
      pointRadius: POINT_RADIUS,
      pointBorderWidth: 1,
      pointBorderColor: POINT_BORDER_COLOR,
      pointBackgroundColor: POINT_COLOR_A,
      borderColor: LINE_COLOR_C,
      borderDash: [3, 2],
      borderWidth: 2,
    });
  datasets.push({
    showLine: true,
    data: [
      { x: xBreak, y: brcPayoff(xBreak, barrier, coupon, false) },
      { x: xMax, y: brcPayoff(xMax, barrier, coupon, false) },
    ],
    fill: true,
    borderWidth: 3,
    borderColor: LINE_COLOR_C,
    pointStyle: (ctx) => (ctx.dataIndex === 0 ? "circle" : false),
    pointRadius: POINT_RADIUS,
    pointBorderWidth: 1,
    pointBorderColor: POINT_BORDER_COLOR,
    pointBackgroundColor: POINT_COLOR_B,
    backgroundColor: getBackgroundGradient(coupon),
  });
  datasets.push({
    data: [{ x: xBreak, y: brcPayoff(xBreak, barrier, coupon, false) }],
    pointStyle: false,
    crosshair: { display: true },
    datalabels: {
      display: true,
      font: {
        weight: 500,
        size: 10,
        family: "MatterSQ",
      },
      padding: { left: 4, right: 4 },
      borderWidth: 1,
      borderColor: LABEL_BORDER_COLOR,
      borderRadius: 2,
      formatter: () => `Barrier = ${numeral(initialFixingPrice).multiply(barrier).format("0,0")}`,
      align: "top",
      anchor: "end",
      color: TEXT_COLOR,
    },
  });
  datasets.push({
    data: [{ x: 1, y: brcPayoff(1, barrier, coupon, false) }],
    pointStyle: false,
    crosshair: { display: true, dash: false, h: false },
  });

  return { datasets };
}

function getGraphOptions(
  barrier: number,
  coupon: number,
  issuanceAmount: number,
  initialFixingPrice: number
): SPChartOptions {
  const xMin = Math.min(barrier - 0.1, 1 - OFFSET);
  const xMax = 1 + (1 - xMin);
  const yMin = -OFFSET;
  const yMax = OFFSET;

  return {
    scales: {
      x: {
        min: xMin,
        max: xMax,
        ticks: {
          count: 3,
          color: TEXT_COLOR,
          callback: (value) => {
            return numeral(initialFixingPrice).multiply(value).format("0[.]0a");
          },
        },
        grid: {
          drawOnChartArea: false,
          drawTicks: true,
          tickColor: LINE_COLOR_A,
        },
        border: {
          color: LINE_COLOR_A,
        },
      },
      y: {
        min: yMin,
        max: yMax,
        ticks: {
          count: 3,
          color: TEXT_COLOR,
          callback: (value) => {
            return value === 0 ? "0" : numeral(issuanceAmount).multiply(value).format("0[.]0a");
          },
        },
        grid: {
          color: (ctx) => {
            if (ctx.tick.value === 0) return LINE_COLOR_A;

            return "transparent";
          },
          drawTicks: false,
        },
        border: {
          color: LINE_COLOR_A,
        },
        afterBuildTicks(axis: Scale) {
          axis.ticks.push({ value: coupon });
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };
}

type BRCProps = {
  barrier: number;
  coupon: number;
  type: BRCType;
  underlyingAsset: string;
  currency: string;
  issuanceAmount: number;
  initialFixingPrice: number;
};

export function BRC(props: BRCProps) {
  const { data, options, plugins } = useMemo(() => {
    const normalizedBarrier = props.barrier / 100;
    const normalizedCoupon = props.coupon / 100;

    return {
      data: getGraphData(normalizedBarrier, normalizedCoupon, props.type, props.initialFixingPrice),
      options: getGraphOptions(normalizedBarrier, normalizedCoupon, props.issuanceAmount, props.initialFixingPrice),
      plugins: [crosshair],
    };
  }, [props.barrier, props.coupon, props.type]);

  return (
    <SPChart data={data} options={options} plugins={plugins} xLabel={`${props.underlyingAsset}${props.currency}`} />
  );
}
