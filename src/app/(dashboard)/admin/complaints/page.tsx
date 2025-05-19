"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Copy, Check, Eye, AlertCircle, CheckCircle2, History, FileText, UserPlus, ArrowRightLeft, CheckCircle, Filter, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignedTo {
  id: string;
  complaintId: string;
  staffId: string;
  assignedAt: string;
  staff: Staff;
}

interface ComplaintHistory {
  id: string;
  complaintId: string;
  fromUserId: string | null;
  toUserId: string | null;
  fromAgencyId: string | null;
  toAgencyId: string | null;
  action: string;
  metadata?: string;
  timestamp: string;
  complaint: {
    id: string;
    subject: string;
    trackingCode: string;
    status: string;
  };
  fromUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  toUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  fromAgency: {
    id: string;
    name: string;
    acronym: string;
  } | null;
  toAgency: {
    id: string;
    name: string;
    acronym: string;
  } | null;
}

interface Agency {
  id: string;
  name: string;
  acronym: string;
  isActive: boolean;
  description: string;
  logoUrl: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  primaryAgencyId: string;
}

interface Complaint {
  id: string;
  subject: string;
  description: string;
  citizenEmail: string;
  citizenName: string;
  trackingCode: string | null;
  categoryId: string;
  agencyId: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  agency: Agency;
  category: Category;
  assignedTo: AssignedTo | null;
}

const ComplaintsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "ALL",
    overdueDuration: "7", // Default to 7 days
    agencyId: "ALL",
    categoryId: "ALL",
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [selectedComplaintForHistory, setSelectedComplaintForHistory] = useState<Complaint | null>(null);

  const { getter } = useApi();

  // Fetch all complaints
  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: async () => {
      const response = await getter(`/complaints`);
      return response.data;
    },
  });

  // Fetch agencies
  const { data: agencies = [] } = useQuery<Agency[]>({
    queryKey: ["agencies"],
    queryFn: async () => {
      const response = await getter(`/agency`);
      return response.data;
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getter(`/categories`);
      return response.data;
    },
  });

  // Fetch complaint history
  const { data: complaintHistory = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ["complaintHistory", selectedComplaintForHistory?.id],
    queryFn: async () => {
      if (!selectedComplaintForHistory?.id) return [];
      const response = await getter(`/complaint-history/${selectedComplaintForHistory.id}`);
      return response.data;
    },
    enabled: !!selectedComplaintForHistory?.id,
  });

  // Filter complaints based on search and filters
  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.trackingCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filters.status === "ALL" || complaint.status === filters.status;

    const matchesAgency =
      filters.agencyId === "ALL" || complaint.agencyId === filters.agencyId;

    const matchesCategory =
      filters.categoryId === "ALL" || complaint.categoryId === filters.categoryId;

    return matchesSearch && matchesStatus && matchesAgency && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCopyTrackingCode = (trackingCode: string) => {
    navigator.clipboard.writeText(trackingCode);
    setCopiedId(trackingCode);
    toast.success("Tracking code copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
  };

  const isComplaintOverdue = (complaint: Complaint) => {
    const createdAt = new Date(complaint.createdAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      daysDiff > parseInt(filters.overdueDuration) && 
      (complaint.status === "PENDING" || complaint.status === "IN_PROGRESS")
    );
  };

  const getOverdueDays = (complaint: Complaint) => {
    const createdAt = new Date(complaint.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleViewHistory = (complaint: Complaint) => {
    setSelectedComplaintForHistory(complaint);
    setHistorySheetOpen(true);
  };

  return (
    <div className="min-h-fit bg-white border-border border rounded-[16px] p-[16px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Complaints</h1>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-[400px]">
          <Search className="absolute h-4 w-4 left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by subject, citizen name, or tracking code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {(filters.status !== "ALL" || 
                  filters.agencyId !== "ALL" || 
                  filters.categoryId !== "ALL" || 
                  filters.overdueDuration !== "7") && (
                  <Badge variant="secondary" className="ml-1">
                    {[
                      filters.status !== "ALL",
                      filters.agencyId !== "ALL",
                      filters.categoryId !== "ALL",
                      filters.overdueDuration !== "7"
                    ].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <div className="p-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Status</h4>
                    <Select
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Agency</h4>
                    <Select
                      value={filters.agencyId}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, agencyId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by agency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Agencies</SelectItem>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Category</h4>
                    <Select
                      value={filters.categoryId}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, categoryId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Overdue Duration</h4>
                    <Select
                      value={filters.overdueDuration}
                      onValueChange={(value) =>
                        setFilters((prev) => ({ ...prev, overdueDuration: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Overdue duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Overdue after 3 days</SelectItem>
                        <SelectItem value="7">Overdue after 7 days</SelectItem>
                        <SelectItem value="14">Overdue after 14 days</SelectItem>
                        <SelectItem value="30">Overdue after 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setFilters({
                          status: "ALL",
                          agencyId: "ALL",
                          categoryId: "ALL",
                          overdueDuration: "7",
                        })
                      }
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Complaint</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]">Overdue</TableHead>
              
              <TableHead>Submitted At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredComplaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No complaints found
                </TableCell>
              </TableRow>
            ) : (
              filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="max-w-[300px]">
                    <div className="space-y-1">
                      <div className="font-medium truncate">{complaint.subject}</div>
                      {complaint.trackingCode && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground truncate">
                            Code: {complaint.trackingCode}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyTrackingCode(complaint.trackingCode!)}
                            className="h-4 w-4 p-0 hover:bg-transparent flex-shrink-0"
                          >
                            {copiedId === complaint.trackingCode ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {complaint.agency?.logoUrl ? (
                        <Image
                          src={complaint.agency.logoUrl}
                          alt={`${complaint.agency.name} logo`}
                          className="w-full h-full object-cover"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-medium">{complaint.agency.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {complaint.agency.acronym}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{complaint.category.name}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(
                        complaint.status
                      )} capitalize`}
                    >
                      {complaint.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isComplaintOverdue(complaint) ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Overdue by {getOverdueDays(complaint) - parseInt(filters.overdueDuration)} days</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>On time</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
              
                  <TableCell>{formatDate(complaint.createdAt, false)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewComplaint(complaint)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewHistory(complaint)}>
                          <History className="mr-2 h-4 w-4" />
                          View History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <SheetContent side="right" className="!max-w-[70%] sm:w-[540px] p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Complaint Details</SheetTitle>
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-6 space-y-6">
              {selectedComplaint && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Subject</h3>
                    <div className="text-sm text-muted-foreground">
                      {selectedComplaint.subject}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Description</h3>
                    <div className="text-sm text-muted-foreground">
                      {selectedComplaint.description}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Citizen Information</h3>
                    <div className="text-sm text-muted-foreground">
                      <div>{selectedComplaint.citizenName}</div>
                      <div>{selectedComplaint.citizenEmail}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Tracking Code</h3>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-mono bg-muted p-2 rounded">
                        {selectedComplaint.trackingCode}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyTrackingCode(selectedComplaint.trackingCode!)}
                        className="h-8 w-8"
                      >
                        {copiedId === selectedComplaint.trackingCode ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Category</h3>
                    <div className="text-sm text-muted-foreground">
                      {selectedComplaint.category.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Status</h3>
                    <Badge
                      className={`${getStatusColor(
                        selectedComplaint.status
                      )} capitalize`}
                    >
                      {selectedComplaint.status.toLowerCase().replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Assigned To</h3>
                    <div className="text-sm text-muted-foreground">
                      {selectedComplaint.assignedTo ? (
                        <div className="space-y-1">
                          <div>{selectedComplaint.assignedTo.staff.name}</div>
                          <div>{selectedComplaint.assignedTo.staff.email}</div>
                          <div className="text-xs">
                            Assigned on {formatDate(selectedComplaint.assignedTo.assignedAt)}
                          </div>
                        </div>
                      ) : (
                        "Not assigned to any staff member"
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Created At</h3>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(selectedComplaint.createdAt)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Last Updated</h3>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(selectedComplaint.updatedAt)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
        <SheetContent side="right" className="!max-w-[70%] sm:w-[540px] p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Complaint History</SheetTitle>
            </div>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-6 space-y-6">
              {selectedComplaintForHistory && (
                <>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Complaint Details</h3>
                    <div className="text-sm text-muted-foreground">
                      <div className="font-medium">{selectedComplaintForHistory.subject}</div>
                      <div className="text-xs mt-1">Tracking Code: {selectedComplaintForHistory.trackingCode}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">History Timeline</h3>
                    {isHistoryLoading ? (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Loading history...
                      </div>
                    ) : complaintHistory.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        No history available
                      </div>
                    ) : (
                      <ScrollArea className="h-[calc(100vh-300px)]">
                        <div className="space-y-6 pr-4">
                          {complaintHistory.map((history: ComplaintHistory, index: number) => (
                            <div key={history.id} className="relative">
                              {/* Timeline line */}
                              {index < complaintHistory.length - 1 && (
                                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200" />
                              )}
                              <div className="flex gap-4">
                                {/* Timeline dot */}
                                <div className="relative">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    {history.action === "SUBMITTED" && (
                                      <FileText className="w-4 h-4 text-primary" />
                                    )}
                                    {history.action === "ASSIGNED" && (
                                      <UserPlus className="w-4 h-4 text-primary" />
                                    )}
                                    {history.action === "REASSIGNED" && (
                                      <ArrowUpDown className="w-4 h-4 text-primary" />
                                    )}
                                    {history.action === "RESOLVED" && (
                                      <CheckCircle className="w-4 h-4 text-primary" />
                                    )}
                                    {history.action === "TRANSFERRED" && (
                                      <ArrowUpDown className="w-4 h-4 text-primary" />
                                    )}
                                  </div>
                                </div>
                                {/* Content */}
                                <div className="flex-1 pb-6">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {history.action}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(history.timestamp)}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    {history.action === "ASSIGNED" && (
                                      <>
                                        Assigned to{" "}
                                        <span className="font-medium">
                                          {history.toUser?.name}
                                        </span>{" "}
                                        <span className="text-xs">
                                          ({history.toAgency?.acronym})
                                        </span>
                                      </>
                                    )}
                                    {history.action === "REASSIGNED" && (
                                      <>
                                        Reassigned from{" "}
                                        <span className="font-medium">
                                          {history.fromUser?.name}
                                        </span>{" "}
                                        to{" "}
                                        <span className="font-medium">
                                          {history.toUser?.name}
                                        </span>{" "}
                                        <span className="text-xs">
                                          ({history.toAgency?.acronym})
                                        </span>
                                      </>
                                    )}
                                    {history.action === "RESOLVED" && (
                                      <>
                                        Marked as resolved by{" "}
                                        <span className="font-medium">
                                          {history.fromUser?.name}
                                        </span>
                                      </>
                                    )}
                                    {history.action === "TRANSFERRED" && (
                                      <>
                                        Transferred from{" "}
                                        <span className="font-medium">
                                          {history.fromAgency?.name}
                                        </span>{" "}
                                        <span className="text-xs">
                                          ({history.fromAgency?.acronym})
                                        </span>{" "}
                                        to{" "}
                                        <span className="font-medium">
                                          {history.toAgency?.name}
                                        </span>{" "}
                                        <span className="text-xs">
                                          ({history.toAgency?.acronym})
                                        </span>
                                        {history.fromUser && (
                                          <div className="mt-1">
                                            by{" "}
                                            <span className="font-medium">
                                              {history.fromUser.name}
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    )}
                                    {history.metadata && (
                                      <div className="mt-2 text-sm italic text-muted-foreground">
                                        &quot;{history.metadata}&quot;
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ComplaintsPage;
