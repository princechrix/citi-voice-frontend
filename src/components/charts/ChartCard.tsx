'use client';

import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  description?: string;
  chartTypeSelector?: React.ReactNode;
}

export default function ChartCard({ title, children, description, chartTypeSelector }: ChartCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow p-0 flex flex-col min-h-[350px]">
      <div className="flex items-center justify-between px-6 pt-5 pb-2 chart-card-header">
        <h2 className="font-bold text-lg text-gray-800">{title}</h2>
        {chartTypeSelector && <div>{chartTypeSelector}</div>}
      </div>
      <div className="flex-1 flex items-center justify-center bg-[#F7FAFC] rounded-xl mx-4 mb-3" style={{ minHeight: 220 }}>
        {children}
      </div>
      {description && (
        <div className="text-center text-sm text-gray-500 pb-3 px-4">
          {description}
        </div>
      )}
    </div>
  );
} 