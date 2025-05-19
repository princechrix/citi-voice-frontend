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
import {
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Check,
  Eye,
  AlertCircle,
  CheckCircle2,
  X,
  History,
  ArrowUpCircle,
  CheckCircle,
  ArrowRightLeft,
  UserPlus,
  FileText,
} from "lucide-react";
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

interface ComplaintHistory {
  id: string;
  complaintId: string;
  fromUserId: string | null;
  toUserId: string | null;
  fromAgencyId: string | null;
  toAgencyId: string | null;
  action: string;
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
  metadata?: string;
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
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

const ComplaintsPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "ALL",
    overdueDuration: "7", // Default to 7 days
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [selectedComplaintForHistory, setSelectedComplaintForHistory] =
    useState<Complaint | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [complaintToUpdate, setComplaintToUpdate] = useState<Complaint | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<Complaint["status"] | "">("");
  const [statusNote, setStatusNote] = useState("");

  const { getter, patcher } = useApi();

  // Get user info from localStorage
  const getUserInfo = () => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
          return null;
        }
      }
    }
    return null;
  };

  // Fetch complaints assigned to staff
  const { data: complaints = [], isLoading } = useQuery<Complaint[]>({
    queryKey: ["complaints"],
    queryFn: async () => {
      const userInfo = getUserInfo();
      if (!userInfo?.id) {
        throw new Error("User not found");
      }
      const response = await getter(`/complaints/staff/${userInfo.id}`);
      return response.data;
    },
    enabled: !!getUserInfo()?.id, // Only run the query if we have a user ID
  });

  // Fetch complaint history
  const { data: complaintHistory = [], isLoading: isHistoryLoading } = useQuery(
    {
      queryKey: ["complaintHistory", selectedComplaintForHistory?.id],
      queryFn: async () => {
        if (!selectedComplaintForHistory?.id) return [];
        const response = await getter(
          `/complaint-history/${selectedComplaintForHistory.id}`
        );
        return response.data;
      },
      enabled: !!selectedComplaintForHistory?.id,
    }
  );

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
    const daysDiff = Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      daysDiff > parseInt(filters.overdueDuration) &&
      (complaint.status === "PENDING" || complaint.status === "IN_PROGRESS")
    );
  };

  const getOverdueDays = (complaint: Complaint) => {
    const createdAt = new Date(complaint.createdAt);
    const now = new Date();
    return Math.floor(
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const handleViewHistory = (complaint: Complaint) => {
    setSelectedComplaintForHistory(complaint);
    setHistorySheetOpen(true);
    queryClient.invalidateQueries({
      queryKey: ["complaintHistory", complaint.id],
    });
  };

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      complaintId,
      status,
      note,
    }: {
      complaintId: string;
      status: Complaint["status"];
      note: string;
    }) => {
      const userInfo = getUserInfo();
      if (!userInfo?.id) {
        throw new Error("User not found");
      }

      const response = await patcher(`/complaints/${complaintId}/status`, {
        status,
        userId: userInfo.id,
        metadata: note,
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
      setStatusNote("");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    },
  });

  const handleUpdateStatus = (complaint: Complaint) => {
    setComplaintToUpdate(complaint);
    setNewStatus(complaint.status);
    setStatusNote("");
    setStatusDialogOpen(true);
  };

  const handleStatusChange = () => {
    if (!complaintToUpdate || !newStatus) return;
    updateStatusMutation.mutate({
      complaintId: complaintToUpdate.id,
      status: newStatus as Complaint["status"],
      note: statusNote,
    });
  };

  return (
    <div className="min-h-fit bg-white border-border border rounded-[16px] p-[16px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Complaints</h1>
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
              <SelectItem value="REJECTED">Rejected</SelectItem>
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
              <TableHead>Submitted At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredComplaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No complaints found
                </TableCell>
              </TableRow>
            ) : (
              filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="max-w-[300px]">
                    <div className="space-y-1">
                      <div className="font-medium truncate">
                        {complaint.subject}
                      </div>
                      {complaint.trackingCode && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground truncate">
                            Code: {complaint.trackingCode}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleCopyTrackingCode(complaint.trackingCode!)
                            }
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
                            <p>
                              Overdue by{" "}
                              {getOverdueDays(complaint) -
                                parseInt(filters.overdueDuration)}{" "}
                              days
                            </p>
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
                    {formatDate(complaint.createdAt, false)}
                  </TableCell>
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
                        <DropdownMenuItem
                          onClick={() => handleViewComplaint(complaint)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewHistory(complaint)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          View History
                        </DropdownMenuItem>
                        {complaint.status !== "RESOLVED" &&
                          complaint.status !== "REJECTED" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(complaint)}
                            >
                              <ArrowUpCircle className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
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

      <Sheet
        open={!!selectedComplaint}
        onOpenChange={() => setSelectedComplaint(null)}
      >
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
                        onClick={() =>
                          handleCopyTrackingCode(
                            selectedComplaint.trackingCode!
                          )
                        }
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

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Complaint Status</DialogTitle>
            <DialogDescription>
              Select the new status for this complaint and provide a reason for
              the change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Current Status</Label>
              <div className="flex items-center gap-2">
                <Badge
                  className={getStatusColor(complaintToUpdate?.status || "")}
                >
                  {complaintToUpdate?.status.toLowerCase().replace("_", " ")}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) =>
                  setNewStatus(value as Complaint["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason for Status Change</Label>
              <textarea
                className="w-full min-h-[100px] p-2 border rounded-md"
                placeholder="Enter the reason for changing the status..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
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
              disabled={
                !newStatus ||
                newStatus === complaintToUpdate?.status ||
                !statusNote.trim()
              }
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
                      <div className="font-medium">
                        {selectedComplaintForHistory.subject}
                      </div>
                      <div className="text-xs mt-1">
                        Tracking Code:{" "}
                        {selectedComplaintForHistory.trackingCode}
                      </div>
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
                          {complaintHistory.map(
                            (history: ComplaintHistory, index: number) => (
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
                                      {history.action === "REJECTED" && (
                                        <X className="w-4 h-4 text-primary" />
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
                            )
                          )}
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
