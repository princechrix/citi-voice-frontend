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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

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
    aging: ChartType;
    resolved: ChartType;
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
  { i: 'aging', x: 1, y: 0, w: 1, h: 2, minH: 1 },
  { i: 'resolved', x: 0, y: 2, w: 2, h: 2, minH: 1 },
];

const defaultChartTypes = {
  status: 'donut' as ChartType,
  aging: 'bar' as ChartType,
  resolved: 'line' as ChartType,
};

const StaffDashboard = () => {
  const [statusType, setStatusType] = useState<ChartType>(defaultChartTypes.status);
  const [agingType, setAgingType] = useState<ChartType>(defaultChartTypes.aging);
  const [resolvedType, setResolvedType] = useState<ChartType>(defaultChartTypes.resolved);
  const [layout, setLayout] = useState<Layout[]>(defaultLayout);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const { getter } = useApi();

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['staff-dashboard'],
    queryFn: async () => {
      // Get staff ID from localStorage or sessionStorage
      const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!userStr) {
        throw new Error("User not found");
      }
      const user = JSON.parse(userStr);
      const response = await getter(`/dashboard-charts/staff/${user.id}`);
      return response.data;
    },
  });

  // Calculate pagination
  const totalPages = Math.ceil((dashboardData?.assignedComplaints?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComplaints = dashboardData?.assignedComplaints?.slice(startIndex, startIndex + itemsPerPage) || [];

  // Load saved preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('staffDashboardPreferences');
    if (savedPreferences) {
      try {
        const preferences: DashboardPreferences = JSON.parse(savedPreferences);
        setLayout(preferences.layout);
        setStatusType(preferences.chartTypes.status);
        setAgingType(preferences.chartTypes.aging);
        setResolvedType(preferences.chartTypes.resolved);
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
          aging: agingType,
          resolved: resolvedType,
        },
      };
      localStorage.setItem('staffDashboardPreferences', JSON.stringify(preferences));
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
    setAgingType(defaultChartTypes.aging);
    setResolvedType(defaultChartTypes.resolved);
    localStorage.removeItem('staffDashboardPreferences');
    toast.success('Dashboard preferences reset to default');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
        <h1 className="text-2xl font-bold">Staff Dashboard</h1>
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

      {/* Assigned Complaints Table */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">My Assigned Complaints</h2>
        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Complaint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Since Assignment</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedComplaints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No complaints assigned
                  </TableCell>
                </TableRow>
              ) : (
                paginatedComplaints.map((complaint: any) => (
                  <TableRow key={complaint.id}>
                    <TableCell>{complaint.title}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={complaint.daysSinceAssignment > 7 ? 'text-red-600' : 'text-green-600'}>
                        {complaint.daysSinceAssignment} days
                      </span>
                    </TableCell>
                    <TableCell>{complaint.createdAt}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {dashboardData?.assignedComplaints?.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, dashboardData.assignedComplaints.length)} of {dashboardData.assignedComplaints.length} complaints
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
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
            title="Status Breakdown"
            description="Distribution of your assigned complaints by status"
            chartTypeSelector={<ChartTypeSelector value={statusType} onChange={setStatusType} />}
          >
            <UnifiedChart
              chartType={statusType}
              data={dashboardData?.statusData || []}
            />
          </ChartCard>
        </div>
        <div key="aging">
          <ChartCard
            title="Time Since Assignment"
            description="Distribution of complaints by aging period"
            chartTypeSelector={<ChartTypeSelector value={agingType} onChange={setAgingType} />}
          >
            <UnifiedChart
              chartType={agingType}
              data={dashboardData?.agingData || []}
            />
          </ChartCard>
        </div>
        <div key="resolved">
          <ChartCard
            title="Resolved Complaints Trend"
            description="Your weekly progress in resolving complaints"
            chartTypeSelector={<ChartTypeSelector value={resolvedType} onChange={setResolvedType} />}
          >
            <UnifiedChart
              chartType={resolvedType}
              data={dashboardData?.resolvedData || []}
              color="#22C55E"
            />
          </ChartCard>
        </div>
      </ResponsiveGridLayout>
    </div>
  );
};

export default StaffDashboard;
