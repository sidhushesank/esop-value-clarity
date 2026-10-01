"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import type { EChartsOption } from "echarts";

const ReactECharts = dynamic(
  () => import("echarts-for-react"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[260px] items-center justify-center rounded-2xl bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            Loading chart
          </p>
        </div>
      </div>
    ),
  },
);

type PresentationEChartProps = {
  option: EChartsOption;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
};

export default function PresentationEChart({
  option,
  height = 300,
  className = "",
  style,
}: PresentationEChartProps) {
  return (
    <div
      className={`w-full ${className}`}
      style={{
        height,
        ...style,
      }}
    >
      <ReactECharts
        option={option}
        notMerge
        lazyUpdate
        style={{
          height: "100%",
          width: "100%",
        }}
        opts={{
          renderer: "canvas",
        }}
      />
    </div>
  );
}