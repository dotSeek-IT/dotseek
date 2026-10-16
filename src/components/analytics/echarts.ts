"use client";

/**
 * Modular ECharts: only the charts and components the admin dashboard uses are
 * registered (no full bundle). Imported only from admin analytics components, so the
 * public website never downloads it.
 */
import * as echarts from "echarts/core";
import { HeatmapChart, LineChart, MapChart, SankeyChart, TreemapChart } from "echarts/charts";
import {
  CalendarComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  HeatmapChart,
  LineChart,
  MapChart,
  SankeyChart,
  TreemapChart,
  CalendarComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  ToolboxComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

export { echarts };
export type { ECharts, EChartsCoreOption } from "echarts/core";

let worldLoading: Promise<void> | null = null;

/** Registers the world map once (country shapes keyed by ISO code, served from /analytics/world.geo.json). */
export function loadWorld(): Promise<void> {
  worldLoading ??= fetch("/analytics/world.geo.json")
    .then((r) => {
      if (!r.ok) throw new Error("Map unavailable");
      return r.json();
    })
    .then((geo) => {
      echarts.registerMap("world", geo);
    })
    .catch((e) => {
      worldLoading = null;
      throw e;
    });
  return worldLoading;
}
