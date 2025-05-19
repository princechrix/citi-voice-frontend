'use client';

import React from 'react';
import DonutChart, { UnifiedChartProps } from './DonutChart';
import BarChart from './BarChart';
import LineChart from './LineChart';

export type ChartType = 'donut' | 'bar' | 'line';

interface Props extends UnifiedChartProps {
  chartType: ChartType;
}

export default function UnifiedChart({ chartType, ...props }: Props) {
  if (chartType === 'donut') return <DonutChart {...props} />;
  if (chartType === 'bar') return <BarChart {...props} />;
  if (chartType === 'line') return <LineChart {...props} />;
  return null;
} 