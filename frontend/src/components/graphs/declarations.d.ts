import { ChartType } from "chart.js";

declare module "chart.js" {
  interface ChartDatasetProperties<TType extends ChartType, TData> {
    crosshair?: {
      display?: boolean;
      color?: string;
      width?: number;
      dash?: number[] | false;
      h?: false;
      v?: false;
    };
  }

  interface PluginOptionsByType<TType extends ChartType> {
    crosshair?: {
      color?: string;
      width?: number;
      dash?: number[];
    };
  }
}
