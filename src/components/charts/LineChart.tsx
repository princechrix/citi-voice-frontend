'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { UnifiedChartProps } from './DonutChart';

export default function LineChart({ data, color = '#156BEC' }: UnifiedChartProps) {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
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
      boundaryGap: false,
      data: data.map(item => item.name)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Value',
        type: 'line',
        smooth: true,
        lineStyle: {
          width: 3,
          color: color
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: color
              },
              {
                offset: 1,
                color: 'rgba(21, 107, 236, 0.1)'
              }
            ]
          }
        },
        data: data.map(item => item.value)
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