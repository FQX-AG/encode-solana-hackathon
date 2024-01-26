import { ChartArea, ChartData, ChartOptions, DefaultDataPoint, Plugin } from "chart.js";
import { useMemo, useState } from "react";

import Chart from "./Chart";
import Label from "./Label";
import Legend from "./Legend";
import { LINE_COLOR_B, LINE_COLOR_C } from "../constants";

const CHART_HEIGHT = 250;
const SPACING = 8;
const PADDING = [15 + SPACING, 100 + SPACING, 70 + SPACING, 15];

export type SPChartOptions = Omit<ChartOptions<"scatter">, "responsive" | "maintainAspectRatio">;

type SPChartProps = {
  data: ChartData<"scatter", DefaultDataPoint<"scatter">, unknown>;
  options?: SPChartOptions;
  plugins?: Plugin<"scatter">[];
};

function SPChart(props: SPChartProps) {
  const [chartArea, setChartArea] = useState<ChartArea>();
  const { options, plugins, legendItems } = useMemo(() => {
    const plugin: Plugin<"scatter"> = {
      id: "htmlAxesLabels",
      afterLayout(chart) {
        setChartArea(chart.chartArea);
      },
    };

    return {
      options: {
        ...props.options,
        responsive: true,
        maintainAspectRatio: false,
      },
      plugins: props.plugins ? [...props.plugins, plugin] : [plugin],
      legendItems: [
        {
          line: `3px solid ${LINE_COLOR_C}`,
          text: "Payoff of the structured product",
        },
        {
          line: `2px dashed ${LINE_COLOR_B}`,
          text: "Performance of the underlying %",
        },
      ],
    };
  }, [props.plugins]);

  return (
    <div
      style={{
        position: "relative",
        boxSizing: "content-box",
        paddingTop: PADDING[0],
        paddingRight: PADDING[1],
        paddingBottom: PADDING[2],
        paddingLeft: PADDING[3],
        overflow: "hidden",
        visibility: chartArea ? "visible" : "hidden",
      }}
    >
      <Chart type="scatter" data={props.data} options={options} plugins={plugins} width={null} height={CHART_HEIGHT} />
      {chartArea && (
        <>
          <Label
            style={{
              position: "absolute",
              textAlign: "center",
              transform: "translate(-50%, 0)",
              bottom: PADDING[2] + CHART_HEIGHT,
              left: PADDING[3] + chartArea.left,
              marginBottom: SPACING,
            }}
          >
            Profit & Loss
          </Label>
          <Label
            style={{
              position: "absolute",
              textAlign: "start",
              maxWidth: 100,
              transform: "translate(0, -50%)",
              top: PADDING[0] + chartArea.top + chartArea.height,
              right: 0,
              marginLeft: SPACING,
            }}
          >
            Underlying asset price
          </Label>
          <Legend
            items={legendItems}
            style={{
              position: "absolute",
              top: PADDING[0] + CHART_HEIGHT,
              left: PADDING[3] + chartArea.left,
              marginTop: SPACING,
            }}
          />
        </>
      )}
    </div>
  );
}

export default SPChart;
