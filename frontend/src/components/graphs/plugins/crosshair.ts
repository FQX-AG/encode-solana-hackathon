import { Plugin } from "chart.js";

import { LINE_COLOR_A } from "../constants";

const crosshair: Plugin<"scatter"> = {
  id: "crosshair",
  defaults: {
    color: LINE_COLOR_A,
    width: 1,
    dash: [2, 2],
  },
  beforeDatasetDraw: (chart, args, options) => {
    const config = chart.data.datasets[args.index].crosshair;

    if (!config?.display) return;

    const { ctx } = chart;
    for (const point of args.meta.data) {
      ctx.save();
      ctx.strokeStyle = config.color ?? options.color;
      ctx.lineWidth = config.width ?? options.width;
      let dash;
      if (config.dash === false) dash = undefined;
      else dash = config.dash ?? options.dash;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.rect(chart.chartArea.left, chart.chartArea.top, chart.chartArea.width, chart.chartArea.height);
      ctx.clip();
      ctx.beginPath();
      if (config.h !== false) {
        ctx.moveTo(chart.chartArea.left, point.y);
        ctx.lineTo(chart.chartArea.right, point.y);
      }
      if (config.v !== false) {
        ctx.moveTo(point.x, chart.chartArea.top);
        ctx.lineTo(point.x, chart.chartArea.bottom);
      }
      ctx.stroke();
      ctx.restore();
    }
  },
};

export default crosshair;
