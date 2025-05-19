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
import { Search, Filter, MoreHorizontal, Copy, Check, Eye, AlertCircle, CheckCircle2, X, UserPlus, History, ArrowRightLeft, Building2, ArrowUpCircle, CheckCircle, FileText } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
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

interface Complaint {
  id: string;
  subject: string;
  description: string;
  citizenEmail: string;
  citizenName: string;
  trackingCode: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  assignedTo: AssignedTo | null;
}

interface Agency {
  id: string;
  name: string;
  acronym: string;
  logoUrl?: string;
}

const ComplaintsPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "ALL",
    overdueDuration: "7", // Default to 7 days
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [complaintToAssign, setComplaintToAssign] = useState<Complaint | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [selectedComplaintForHistory, setSelectedComplaintForHistory] = useState<Complaint | null>(null);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [complaintToTransfer, setComplaintToTransfer] = useState<Complaint | null>(null);
  const [agencySearchQuery, setAgencySearchQuery] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [complaintToUpdate, setComplaintToUpdate] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState<Complaint["status"] | "">("");

  const { getter, poster, patcher } = useApi();

  // Get agency ID from localStorage
  const getAgencyId = () => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedData = JSON.parse(userData);
        return parsedData.agencyId;
      }
    }
    return null;
  };

  // Fetch complaints by agency
  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: async () => {
      const agencyId = getAgencyId();
      if (!agencyId) {
        throw new Error("Agency ID not found");
      }
      const response = await getter(`/complaints/agency/${agencyId}`);
      return response.data;
    },
  });

  // Fetch agency staff
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      const agencyId = getAgencyId();
      if (!agencyId) {
        throw new Error("Agency ID not found");
      }
      const response = await getter(`/users/agency/${agencyId}`);
      return response.data.filter((user: Staff) => user.role === "STAFF");
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

  // Fetch agencies for transfer
  const { data: agencies = [] } = useQuery({
    queryKey: ["agencies"],
    queryFn: async () => {
      const response = await getter("/agency");
      return response.data;
    },
  });

  // Filter complaints based on search and filters
  const filteredComplaints = complaints.filter((complaint) => {
    const matchesSearch =
      complaint.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      complaint.trackingCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filters.status === "ALL" || complaint.status === filters.status;

    return matchesSearch && matchesStatus;
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

  // Assign complaint to staff mutation
  const assignComplaintMutation = useMutation({
    mutationFn: async ({
      complaintId,
      staffId,
    }: {
      complaintId: string;
      staffId: string;
    }) => {
      const response = await poster(`/complaints/agency/assign`, {
        complaintId,
        staffId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Complaint assigned successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to assign complaint");
    },
  });

  const handleAssignComplaint = (complaintId: string, staffId: string) => {
    assignComplaintMutation.mutate({ complaintId, staffId });
  };

  const handleAssignClick = (complaint: Complaint) => {
    setComplaintToAssign(complaint);
    setAssignDialogOpen(true);  
  };

  const filteredStaff = staff.filter((staffMember: Staff) =>
    (staffMember.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    staffMember.email.toLowerCase().includes(staffSearchQuery.toLowerCase())) &&
    // Exclude the currently assigned staff member
    (!complaintToAssign?.assignedTo || staffMember.id !== complaintToAssign.assignedTo.staffId)
  );

  const handleViewHistory = (complaint: Complaint) => {
    setSelectedComplaintForHistory(complaint);
    setHistorySheetOpen(true);
    queryClient.invalidateQueries({ queryKey: ["complaintHistory", complaint.id] });
  };

  const handleTransferClick = (complaint: Complaint) => {
    setComplaintToTransfer(complaint);
    setTransferDialogOpen(true);
  };

  const handleTransferComplaint = async (agencyId: string) => {
    if (!complaintToTransfer || !transferReason) return;
    
    try {
      // Get user ID from localStorage
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not found");
      }
      const { id: userId } = JSON.parse(userData);

      await poster(`/complaints/${complaintToTransfer.id}/transfer`, {
        complaintId: complaintToTransfer.id,
        targetAgencyId: agencyId,
        userId,
        transferReason
      });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Complaint transferred successfully");
      setTransferDialogOpen(false);
      setComplaintToTransfer(null);
      setTransferReason("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to transfer complaint");
    }
  };

  const filteredAgencies = agencies.filter((agency: Agency) =>
    (agency.name.toLowerCase().includes(agencySearchQuery.toLowerCase()) ||
    agency.acronym.toLowerCase().includes(agencySearchQuery.toLowerCase())) &&
    agency.id !== getAgencyId() // Exclude current agency
  );

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      complaintId,
      status,
    }: {
      complaintId: string;
      status: Complaint["status"];
    }) => {
      // Get user ID from localStorage
      const userData = localStorage.getItem("user");
      if (!userData) {
        throw new Error("User not found");
      }
      const { id: userId } = JSON.parse(userData);

      const response = await patcher(`/complaints/${complaintId}/status`, {
        status,
        userId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaintHistory"] });
      toast.success("Status updated successfully");
      setStatusDialogOpen(false);
      setComplaintToUpdate(null);
      setNewStatus("");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    },
  });

  const handleUpdateStatus = (complaint: Complaint) => {
    setComplaintToUpdate(complaint);
    setNewStatus(complaint.status);
    setStatusDialogOpen(true);
  };

  const handleStatusChange = () => {
    if (!complaintToUpdate || !newStatus) return;
    updateStatusMutation.mutate({
      complaintId: complaintToUpdate.id,
      status: newStatus as Complaint["status"],
    });
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
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.overdueDuration}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, overdueDuration: value }))
            }
          >
            <SelectTrigger className="w-[180px]">
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Complaint</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]">Overdue</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredComplaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
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
                  <TableCell>
                    {complaint.assignedTo ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{complaint.assignedTo.staff.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {complaint.assignedTo.staff.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Assigned {formatDate(complaint.assignedTo.assignedAt, false)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(complaint.createdAt, false)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
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
                        {complaint.status !== "RESOLVED" && (
                          <>
                            <DropdownMenuItem onClick={() => handleTransferClick(complaint)}>
                              <ArrowRightLeft className="mr-2 h-4 w-4" />
                              External Transfer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(complaint)}>
                              <ArrowUpCircle className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignClick(complaint)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              {complaint.assignedTo ? "Reassign" : "Assign to Staff"}
                            </DropdownMenuItem>
                          </>
                        )}
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
        <SheetContent  side="right" className="!max-w-[70%] sm:w-[540px] p-0">
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

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Assign Complaint to Staff</DialogTitle>
            <DialogDescription>
              Select a staff member to assign this complaint to.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search staff members..."
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-4 space-y-2">
              {filteredStaff.map((staffMember) => (
                <Button
                  key={staffMember.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => {
                    if (complaintToAssign) {
                      handleAssignComplaint(complaintToAssign.id, staffMember.id);
                      setAssignDialogOpen(false);
                      setComplaintToAssign(null);
                    }
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{staffMember.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {staffMember.email}
                    </span>
                  </div>
                </Button>
              ))}
              {filteredStaff.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No staff members found
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Transfer Complaint to Another Agency</DialogTitle>
            <DialogDescription>
              Select an agency to transfer this complaint to and provide a reason for the transfer.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 border-b">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search agencies..."
                value={agencySearchQuery}
                onChange={(e) => setAgencySearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Transfer Reason</Label>
              <Textarea
                placeholder="Enter reason for transfer..."
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-4 space-y-2">
              {filteredAgencies.map((agency: Agency) => (
                <Button
                  key={agency.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => handleTransferComplaint(agency.id)}
                  disabled={!transferReason}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {agency.logoUrl ? (
                        <Image
                          src={agency.logoUrl}
                          alt={`${agency.name} logo`}
                          className="w-6 h-6 object-contain"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{agency.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {agency.acronym}
                      </span>
                    </div>
                  </div>
                </Button>
              ))}
              {filteredAgencies.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No agencies found
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Complaint Status</DialogTitle>
            <DialogDescription>
              Select the new status for this complaint.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(complaintToUpdate?.status || "")}>
                  {complaintToUpdate?.status.toLowerCase().replace("_", " ")}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as Complaint["status"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!newStatus || newStatus === complaintToUpdate?.status}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                                      <ArrowRightLeft className="w-4 h-4 text-primary" />
                                    )}
                                    {history.action === "RESOLVED" && (
                                      <CheckCircle className="w-4 h-4 text-primary" />
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
