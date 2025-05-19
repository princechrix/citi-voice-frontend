"use client";

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
import { Button } from '@/components/ui/button';
import { Save, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';

const ResponsiveGridLayout = RGL.WidthProvider(RGL.Responsive);

const chartTypes: { label: string; value: ChartType }[] = [
  { label: 'Donut', value: 'donut' },
  { label: 'Bar', value: 'bar' },
  { label: 'Line', value: 'line' },
];

interface DashboardPreferences {
  layout: Layout[];
  chartTypes: {
    complaintsByStats: ChartType;
    staffAssignments: ChartType;
    resolutionRate: ChartType;
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
  { i: 'complaintsByStats', x: 0, y: 0, w: 1, h: 2, minH: 1 },
  { i: 'staffAssignments', x: 1, y: 0, w: 1, h: 2, minH: 1 },
  { i: 'resolutionRate', x: 0, y: 2, w: 2, h: 2, minH: 1 },
];

const defaultChartTypes = {
  complaintsByStats: 'donut' as ChartType,
  staffAssignments: 'bar' as ChartType,
  resolutionRate: 'bar' as ChartType,
};

const AgencyDashboard = () => {
  const router = useRouter();
  const { getter } = useApi();
  const [agencyId, setAgencyId] = useState<string | null>(null);

  const [complaintsByStatsType, setComplaintsByStatsType] = useState<ChartType>(defaultChartTypes.complaintsByStats);
  const [staffAssignmentsType, setStaffAssignmentsType] = useState<ChartType>(defaultChartTypes.staffAssignments);
  const [resolutionRateType, setResolutionRateType] = useState<ChartType>(defaultChartTypes.resolutionRate);
  const [layout, setLayout] = useState<Layout[]>(defaultLayout);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Get agency ID from stored user data
  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.agencyId) {
          setAgencyId(user.agencyId);
        } else {
          // toast.error('Agency ID not found in user data');
          console.log(user);
          // router.push('/login');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        // toast.error('Error loading user data');
        // router.push('/login');
      }
    } else {
      console.log('No user data found');
      // toast.error('No user data found');
      // router.push('/login');
    }
  }, [router]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-charts', agencyId],
    queryFn: async () => {
      if (!agencyId) {
        throw new Error('Agency ID not available');
      }
      const response = await getter(`/dashboard-charts/agency-admin/${agencyId}`);
      return response.data;
    },
    enabled: !!agencyId, // Only run the query when agencyId is available
  });

  // Load saved preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('agencyDashboardPreferences');
    if (savedPreferences) {
      try {
        const preferences: DashboardPreferences = JSON.parse(savedPreferences);
        setLayout(preferences.layout);
        setComplaintsByStatsType(preferences.chartTypes.complaintsByStats);
        setStaffAssignmentsType(preferences.chartTypes.staffAssignments);
        setResolutionRateType(preferences.chartTypes.resolutionRate);
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
          complaintsByStats: complaintsByStatsType,
          staffAssignments: staffAssignmentsType,
          resolutionRate: resolutionRateType,
        },
      };
      localStorage.setItem('agencyDashboardPreferences', JSON.stringify(preferences));
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
    setComplaintsByStatsType(defaultChartTypes.complaintsByStats);
    setStaffAssignmentsType(defaultChartTypes.staffAssignments);
    setResolutionRateType(defaultChartTypes.resolutionRate);
    localStorage.removeItem('agencyDashboardPreferences');
    toast.success('Dashboard preferences reset to default');
  };

  if (!agencyId) {
    return (
      <div className='min-h-[calc(100vh-100px)] w-full p-[16px] rounded-[16px] flex items-center justify-center'>
        <div className="text-gray-500">Loading user data...</div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold">Agency Dashboard</h1>
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

      {/* Total Complaints Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Complaints</h3>
          <p className="text-2xl font-bold">{dashboardData?.totalComplaints?.total || 0}</p>
          <p className="text-xs text-muted-foreground">
            {dashboardData?.totalComplaints?.pending || 0} pending, {dashboardData?.totalComplaints?.resolved || 0} resolved
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Pending Complaints</h3>
          <p className="text-2xl font-bold">{dashboardData?.totalComplaints?.pending || 0}</p>
          <p className="text-xs text-muted-foreground">
            {((dashboardData?.totalComplaints?.pending / dashboardData?.totalComplaints?.total) * 100 || 0).toFixed(1)}% of total
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Resolved Complaints</h3>
          <p className="text-2xl font-bold">{dashboardData?.totalComplaints?.resolved || 0}</p>
          <p className="text-xs text-muted-foreground">
            {((dashboardData?.totalComplaints?.resolved / dashboardData?.totalComplaints?.total) * 100 || 0).toFixed(1)}% of total
          </p>
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
        <div key="complaintsByStats">
          <ChartCard
            title="Complaints by Status"
            description="Distribution of complaints by their current status."
            chartTypeSelector={<ChartTypeSelector value={complaintsByStatsType} onChange={setComplaintsByStatsType} />}
          >
            <UnifiedChart
              chartType={complaintsByStatsType}
              data={dashboardData?.complaintsByStats || []}
              color="#156BEC"
            />
          </ChartCard>
        </div>
        <div key="staffAssignments">
          <ChartCard
            title="Staff Assignments"
            description="Number of complaints assigned to each staff member."
            chartTypeSelector={<ChartTypeSelector value={staffAssignmentsType} onChange={setStaffAssignmentsType} />}
          >
            <UnifiedChart
              chartType={staffAssignmentsType}
              data={dashboardData?.staffAssignments || []}
              color="#156BEC"
            />
          </ChartCard>
        </div>
        <div key="resolutionRate">
          <ChartCard
            title="Complaint Resolution Rate"
            description="Percentage of complaints resolved within different time frames."
            chartTypeSelector={<ChartTypeSelector value={resolutionRateType} onChange={setResolutionRateType} />}
          >
            <UnifiedChart
              chartType={resolutionRateType}
              data={dashboardData?.resolutionRateData || []}
              color="#156BEC"
            />
          </ChartCard>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
};

export default AgencyDashboard;
