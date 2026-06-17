// EXPORTS: CHART_COLORS, CHART_COLORS_HEX, type ChartColorKey

/**
 * Agnes AI 演示平台 — 图表配色常量
 * 基于深色科技主题 design tokens (tailwind-theme.css :root)
 * chart-1: hsl(250 75% 60%) — 主紫色
 * chart-2: hsl(180 80% 50%) — 青色
 * chart-3: hsl(310 75% 60%) — 品红
 * chart-4: hsl(160 75% 60%) — 翠绿
 * chart-5: hsl(250 75% 80%) — 浅紫
 */

export type ChartColorKey = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5';

/** CSS variable 引用，供 shadcn ChartContainer config 使用 */
export const CHART_COLORS: Record<ChartColorKey, string> = {
  'chart-1': 'var(--chart-1)',
  'chart-2': 'var(--chart-2)',
  'chart-3': 'var(--chart-3)',
  'chart-4': 'var(--chart-4)',
  'chart-5': 'var(--chart-5)',
};

/** 直接 hex 值，供 ECharts / recharts 等图表库的 color/fill/stroke 属性使用 */
export const CHART_COLORS_HEX: Record<ChartColorKey, string> = {
  'chart-1': '#7C5CF0',
  'chart-2': '#1AE6E6',
  'chart-3': '#D94FBF',
  'chart-4': '#3DE08A',
  'chart-5': '#B8A4F5',
};

/** 便捷数组：按 chart-1 ~ chart-5 顺序排列的 hex 色板 */
export const CHART_PALETTE: string[] = [
  CHART_COLORS_HEX['chart-1'],
  CHART_COLORS_HEX['chart-2'],
  CHART_COLORS_HEX['chart-3'],
  CHART_COLORS_HEX['chart-4'],
  CHART_COLORS_HEX['chart-5'],
];
