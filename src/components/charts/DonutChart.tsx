'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';

export interface UnifiedChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  color?: string;
}

export default function DonutChart({ data }: UnifiedChartProps) {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      data: data.map(item => item.name)
    },
    series: [
      {
        name: 'Value',
        type: 'pie',
        radius: ['95%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: item.color ? { color: item.color } : undefined
        }))
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