'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { UnifiedChartProps } from './DonutChart';

export default function BarChart({ data, color = '#156BEC' }: UnifiedChartProps) {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.name),
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Value',
        type: 'bar',
        barWidth: '60%',
        data: data.map(item => ({
          value: item.value,
          itemStyle: { color: item.color || color }
        })),
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  };

  return (
    <div className="w-full h-[300px] p-4">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
} 