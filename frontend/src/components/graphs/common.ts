import { Color, Scriptable, ScriptableContext } from "chart.js";

import { GRADIENT_COLOR_STOPS } from "./constants";

export function formatPercentage(value: string | number) {
  if (typeof value === "number")
    return Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

  return value;
}

export const getBackgroundGradient =
  (coupon: number): Scriptable<Color, ScriptableContext<"line">> =>
  (ctx) => {
    if (ctx.type === "dataset") {
      if (!ctx.chart.chartArea) return;

      const gradient = ctx.chart.ctx.createLinearGradient(
        0,
        ctx.chart.scales.y.getPixelForValue(coupon),
        0,
        ctx.chart.scales.y.getPixelForValue(0)
      );
      for (const gradientColorStop of GRADIENT_COLOR_STOPS) {
        gradient.addColorStop(...gradientColorStop);
      }
      gradient.addColorStop(1, "transparent");

      return gradient;
    }
  };
