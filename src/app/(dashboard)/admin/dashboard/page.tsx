'use client';

import React, { useState, useEffect } from 'react';
import ChartCard from '@/components/charts/ChartCard';
import UnifiedChart, { ChartType } from '@/components/charts/UnifiedChart';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import RGL, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Save, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

const ResponsiveGridLayout = RGL.WidthProvider(RGL.Responsive);

const chartTypes: { label: string; value: ChartType }[] = [
  { label: 'Donut', value: 'donut' },
  { label: 'Bar', value: 'bar' },
  { label: 'Line', value: 'line' },
];

interface DashboardPreferences {
  layout: Layout[];
  chartTypes: {
    status: ChartType;
    trend: ChartType;
    top: ChartType;
    resolution: ChartType;
    transfer: ChartType;
  };
}

function ChartTypeSelector({ value, onChange }: { value: ChartType; onChange: (v: ChartType) => void }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as ChartType)}>
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="Chart type" />
      </SelectTrigger>
      <SelectContent>
        {chartTypes.map(type => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const defaultLayout: Layout[] = [
  { i: 'status', x: 0, y: 0, w: 1, h: 2, minH: 1 },
  { i: 'trend', x: 1, y: 0, w: 1, h: 2, minH: 1 },
  { i: 'top', x: 0, y: 2, w: 1, h: 2, minH: 1 },
  { i: 'resolution', x: 1, y: 2, w: 1, h: 2, minH: 1 },
  { i: 'transfer', x: 0, y: 4, w: 2, h: 2, minH: 1 },
];

const defaultChartTypes = {
  status: 'donut' as ChartType,
  trend: 'line' as ChartType,
  top: 'bar' as ChartType,
  resolution: 'bar' as ChartType,
  transfer: 'bar' as ChartType,
};

export default function DashboardPage() {
  const [statusType, setStatusType] = useState<ChartType>(defaultChartTypes.status);
  const [trendType, setTrendType] = useState<ChartType>(defaultChartTypes.trend);
  const [topType, setTopType] = useState<ChartType>(defaultChartTypes.top);
  const [resolutionType, setResolutionType] = useState<ChartType>(defaultChartTypes.resolution);
  const [transferType, setTransferType] = useState<ChartType>(defaultChartTypes.transfer);
  const [layout, setLayout] = useState<Layout[]>(defaultLayout);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const { getter } = useApi();

  // Load saved preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('dashboardPreferences');
    if (savedPreferences) {
      try {
        const preferences: DashboardPreferences = JSON.parse(savedPreferences);
        setLayout(preferences.layout);
        setStatusType(preferences.chartTypes.status);
        setTrendType(preferences.chartTypes.trend);
        setTopType(preferences.chartTypes.top);
        setResolutionType(preferences.chartTypes.resolution);
        setTransferType(preferences.chartTypes.transfer);
      } catch (error) {
        console.error('Error loading saved preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = () => {
    try {
      const preferences: DashboardPreferences = {
        layout,
        chartTypes: {
          status: statusType,
          trend: trendType,
          top: topType,
          resolution: resolutionType,
          transfer: transferType,
        },
      };
      localStorage.setItem('dashboardPreferences', JSON.stringify(preferences));
      setIsCustomizing(false);
      toast.success('Dashboard preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save dashboard preferences');
    }
  };

  // Reset preferences to default
  const resetPreferences = () => {
    setLayout(defaultLayout);
    setStatusType(defaultChartTypes.status);
    setTrendType(defaultChartTypes.trend);
    setTopType(defaultChartTypes.top);
    setResolutionType(defaultChartTypes.resolution);
    setTransferType(defaultChartTypes.transfer);
    localStorage.removeItem('dashboardPreferences');
    toast.success('Dashboard preferences reset to default');
  };

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: async () => {
      const response = await getter('/dashboard-charts/super-admin');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className='min-h-[calc(100vh-100px)] w-full p-[16px] rounded-[16px] flex items-center justify-center'>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-l-2 border-r-2 border-t-2 border-t-transparent border-primary"></div>
      </div>
    );
  }

  return (
    <div className='min-h-[calc(100vh-100px)] w-full p-[16px] rounded-[16px]'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Insights</h1>
        <div className="flex gap-2">
          {isCustomizing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsCustomizing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={resetPreferences}
              >
                Reset
              </Button>
              <Button
                onClick={savePreferences}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Preferences
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsCustomizing(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Customize Dashboard
            </Button>
          )}
        </div>
      </div>
      
      {/* Total Complaints Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Today&apos;s Complaints</h3>
          <p className="text-2xl font-bold">{dashboardData?.totalComplaints?.today || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">This Week&apos;s Complaints</h3>
          <p className="text-2xl font-bold">{dashboardData?.totalComplaints?.thisWeek || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">This Month&apos;s Complaints</h3>
          <p className="text-2xl font-bold">{dashboardData?.totalComplaints?.thisMonth || 0}</p>
        </div>
      </div>

      {/* Charts Grid with Drag-and-Drop */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        onLayoutChange={l => setLayout(l as Layout[])}
        breakpoints={{ lg: 1024, md: 768, sm: 480, xs: 0 }}
        cols={{ lg: 2, md: 2, sm: 1, xs: 1 }}
        rowHeight={208}
        measureBeforeMount={false}
        useCSSTransforms={true}
        compactType="vertical"
        preventCollision={false}
        isDraggable={isCustomizing}
        isResizable={isCustomizing}
        style={{ width: '100%' }}
      >
        <div key="status">
          <ChartCard
            title="Complaints by Status"
            description="Distribution of complaints by their current status."
            chartTypeSelector={<ChartTypeSelector value={statusType} onChange={setStatusType} />}
          >
            <UnifiedChart
              chartType={statusType}
              data={dashboardData?.complaintStatusData || []}
              color="#156BEC"
            />
          </ChartCard>
        </div>
        <div key="trend">
          <ChartCard
            title="Weekly Complaints Trend"
            description="Daily trend of complaints received throughout the week."
            chartTypeSelector={<ChartTypeSelector value={trendType} onChange={setTrendType} />}
          >
            <UnifiedChart
              chartType={trendType}
              data={dashboardData?.complaintsTrendData || []}
              color="#156BEC"
            />
          </ChartCard>
        </div>
        <div key="top">
          <ChartCard
            title="Top Agencies by Complaint Volume"
            description="Agencies with the highest number of complaints."
            chartTypeSelector={<ChartTypeSelector value={topType} onChange={setTopType} />}
          >
            <UnifiedChart
              chartType={topType}
              data={dashboardData?.topAgenciesData || []}
              color="#156BEC"
            />
          </ChartCard>
        </div>
        <div key="resolution">
          <ChartCard
            title="Average Resolution Time (Days)"
            description="Average days taken by each agency to resolve complaints."
            chartTypeSelector={<ChartTypeSelector value={resolutionType} onChange={setResolutionType} />}
          >
            <UnifiedChart
              chartType={resolutionType}
              data={dashboardData?.resolutionTimeData || []}
              color="#156BEC"
            />
          </ChartCard>
        </div>
        <div key="transfer">
          <ChartCard
            title="Number of Transfers by Agency"
            description="Agencies with the most complaint transfers (potential inefficiency)."
            chartTypeSelector={<ChartTypeSelector value={transferType} onChange={setTransferType} />}
          >
            <UnifiedChart
              chartType={transferType}
              data={dashboardData?.transferData || []}
              color="#156BEC"
            />
          </ChartCard>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
}