import { Chart, ChartData, ChartType, ChartOptions, DefaultDataPoint, Plugin, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useEffect, useRef } from "react";

Chart.register(...registerables);
Chart.register(ChartDataLabels);
Chart.defaults.plugins.datalabels = { display: false };

type ChartProps<TType extends ChartType = ChartType, TData = DefaultDataPoint<TType>, TLabel = unknown> = {
  width: number | null;
  height: number;
  type: TType;
  data: ChartData<TType, TData, TLabel>;
  options?: ChartOptions<TType>;
  plugins?: Plugin<TType>[];
};

const ChartComponent = <TType extends ChartType = ChartType, TData = DefaultDataPoint<TType>, TLabel = unknown>(
  props: ChartProps<TType, TData, TLabel>
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<TType, TData, TLabel> | null>(null);
  const dataRef = useRef<ChartData<TType, TData, TLabel>>(props.data);

  useEffect(() => {
    if (props.width !== null) canvasRef.current!.width = props.width;
    canvasRef.current!.height = props.height;
    chartRef.current = new Chart(canvasRef.current!, {
      type: props.type,
      data: dataRef.current,
      options: props.options,
      plugins: props.plugins,
    });

    return () => chartRef.current?.destroy();
  }, [props.type, props.options, props.plugins, props.width, props.height]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data = props.data;
      chartRef.current.update();
    }
  }, [props.data]);

  return <canvas ref={canvasRef} width={props.width ?? undefined} height={props.height} />;
};

export default ChartComponent;
