"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  Download,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  FileDown,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { Role } from "@/types/types";
import { formatDate, formatRole } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "AGENCY_ADMIN" | "STAFF";
  isVerified: boolean;
  createdAt: string;
  agencyId: string | null;
  isActive: boolean;
  agency: {
    id: string;
    name: string;
    description: string;
    logoUrl: string;
    acronym: string;
    isActive: boolean;
    createdAt: string;
  } | null;
}

interface NewUser {
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "AGENCY_ADMIN" | "STAFF";
  agencyId: string;
}

// Add Agency interface
interface Agency {
  id: string;
  name: string;
  acronym: string;
  description: string;
  isActive: boolean;
  logoUrl: string | null;
  createdAt: string;
}

// Mock data based on the Prisma schema
const mockUsers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "SUPER_ADMIN",
    isVerified: true,
    createdAt: "2025-05-17",
    agencyId: null,
    isActive: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "ADMIN",
    isVerified: false,
    createdAt: "2025-05-17",
    agencyId: "agency1",
    isActive: true,
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "STAFF",
    isVerified: true,
    createdAt: "2025-05-17",
    agencyId: "agency2",
    isActive: false,
  },
];

// Mock agencies data
const mockAgencies = [
  { id: "agency1", name: "Agency 1" },
  { id: "agency2", name: "Agency 2" },
  { id: "agency3", name: "Agency 3" },
];

const ITEMS_PER_PAGE = 10;

const getRoleBadgeVariant = (
  role: string
): "secondary" | "default" | "destructive" | "outline" => {
  return "secondary";
};

const UserPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    email: "",
    role: "STAFF",
    agencyId: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    role: "ALL",
    isVerified: "ALL",
    agencyId: "ALL",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    rows: string[][];
  } | null>(null);

  const { getter, poster, patcher, deleter } = useApi();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await getter("/users");
      return response.data;
    },
  });

  // Update agencies query with proper typing
  const { data: agencies = [] } = useQuery<Agency[]>({
    queryKey: ["agencies"],
    queryFn: async () => {
      try {
        const response = await getter("/agency");
        return response.data || [];
      } catch (error) {
        console.error("Error fetching agencies:", error);
        return [];
      }
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async ({ agencyId, ...userData }: NewUser) => {
      const response = await poster("/auth/register", {
        ...userData,
        ...(agencyId && { agencyId }),
        secretKey: process.env.NEXT_PUBLIC_CREATE_USER_SECRET_KEY,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      setIsDialogOpen(false);
      setNewUser({ name: "", email: "", role: "STAFF", agencyId: "" });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create user");
    },
  });

  // Toggle user status mutation
  const toggleUserMutation = useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => {
      const response = await patcher(`/users/${userId}`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User status updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update user status"
      );
    },
  });

  // Bulk create users mutation
  const bulkCreateUsersMutation = useMutation({
    mutationFn: async (
      users: Array<{
        name: string;
        email: string;
        role: Role;
        agencyId?: string;
      }>
    ) => {
      const response = await poster("/users/bulk", { users });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Users uploaded successfully");
      setIsUploadDialogOpen(false);
      setUploadedFile(null);
      setPreviewData(null);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message || "Failed to upload users";
      toast.error(errorMessage);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await deleter(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete user");
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async ({
      userId,
      userData,
    }: {
      userId: string;
      userData: Partial<User>;
    }) => {
      const response = await patcher(`/users/${userId}`, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      setUserToEdit(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update user");
    },
  });

  const handleAddUser = () => {
    createUserMutation.mutate(newUser);
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!userToEdit) return;
    editUserMutation.mutate({
      userId: userToEdit.id,
      userData: {
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        agencyId: userToEdit.agencyId,
      },
    });
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(userToDelete.id);
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleToggleUser = (userId: string, currentStatus: boolean) => {
    toggleUserMutation.mutate({ userId, isActive: !currentStatus });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  const handleExport = () => {
    const filteredData = users
      .filter((user) => {
        const matchesSearch =
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.role.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole =
          filters.role === "ALL" || user.role === filters.role;
        const matchesVerification =
          filters.isVerified === "ALL" ||
          (filters.isVerified === "VERIFIED" && user.isVerified) ||
          (filters.isVerified === "UNVERIFIED" && !user.isVerified);
        const matchesAgency = filters.agencyId === "ALL" || user.agencyId === filters.agencyId;

        return matchesSearch && matchesRole && matchesVerification && matchesAgency;
      })
      .map((user) => ({
        ID: user.id,
        Name: user.name,
        Email: user.email,
        Role: user.role,
        Verified: user.isVerified ? "Yes" : "No",
        "Created At": user.createdAt,
        Agency: user.agencyId
          ? mockAgencies.find((a) => a.id === user.agencyId)?.name
          : "N/A",
        Status: user.isActive ? "Active" : "Inactive",
      }));

    const csvContent = [
      Object.keys(filteredData[0]).join(","),
      ...filteredData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `users_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      ["Name", "Email", "Role"],
      ["John Doe", "john@example.com", "STAFF"],
      ["Jane Smith", "jane@example.com", "AGENCY_ADMIN"],
    ];

    // Convert to CSV
    const csvContent = templateData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "user_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split("\n").map((row) => row.split(","));
      const headers = rows[0];
      const dataRows = rows.slice(1);
      setPreviewData({ headers, rows: dataRows });
    };
    reader.readAsText(file);
  };

  const handleConfirmUpload = () => {
    if (!previewData) return;

    const newUsers = previewData.rows.map((row) => ({
      name: row[0],
      email: row[1],
      role: row[2] as Role,
    }));

    bulkCreateUsersMutation.mutate(newUsers);
  };

  const handleCancelUpload = () => {
    setUploadedFile(null);
    setPreviewData(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      handleFileUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const validateRow = (row: string[]) => {
    // Basic validation rules
    const [name, email, role] = row;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRoles = ["SUPER_ADMIN", "AGENCY_ADMIN", "STAFF"] as const;

    return (
      name?.trim() && // Name is not empty
      emailRegex.test(email) && // Valid email format
      validRoles.includes(role as (typeof validRoles)[number]) // Valid role
    );
  };

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filters.role === "ALL" || user.role === filters.role;
    const matchesVerification =
      filters.isVerified === "ALL" ||
      (filters.isVerified === "VERIFIED" && user.isVerified) ||
      (filters.isVerified === "UNVERIFIED" && !user.isVerified);
    const matchesAgency = filters.agencyId === "ALL" || user.agencyId === filters.agencyId;

    return matchesSearch && matchesRole && matchesVerification && matchesAgency;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-fit bg-white border-border border rounded-[16px] p-[16px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your citivoice&apos;s users and their roles.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Users
              </Button>
            </DialogTrigger>
            <DialogContent className="!max-w-[50%]">
              <DialogHeader>
                <DialogTitle>Upload Users</DialogTitle>
                <DialogDescription>
                  Upload a CSV file containing user data. Download the template
                  below for the correct format.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="w-full gap-2"
                >
                  <FileDown className="h-4 w-4" />
                  Download Template
                </Button>
                {!previewData ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        Drag and drop your CSV file here, or{" "}
                        <button
                          onClick={() =>
                            document.getElementById("file-upload")?.click()
                          }
                          className="text-primary hover:underline"
                        >
                          browse
                        </button>
                      </div>
                      {uploadedFile && (
                        <div className="text-sm text-muted-foreground">
                          Selected file: {uploadedFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Preview of {uploadedFile?.name}
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {previewData.headers.map((header, index) => (
                              <TableHead key={index}>{header}</TableHead>
                            ))}
                            <TableHead className="w-[100px]">Valid</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewData.rows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex}>
                                  {cellIndex === 2 ? ( // Role column
                                    <Select
                                      value={cell}
                                      onValueChange={(value: Role) => {
                                        const newRows = [...previewData.rows];
                                        newRows[rowIndex][cellIndex] = value;
                                        setPreviewData({
                                          ...previewData,
                                          rows: newRows,
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SUPER_ADMIN">
                                          Super Admin
                                        </SelectItem>
                                        <SelectItem value="AGENCY_ADMIN">
                                          Agency Admin
                                        </SelectItem>
                                        <SelectItem value="STAFF">
                                          Staff
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    cell
                                  )}
                                </TableCell>
                              ))}
                              <TableCell>
                                {validateRow(row) ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    Invalid
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                {previewData ? (
                  <>
                    <Button variant="outline" onClick={handleCancelUpload}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmUpload}
                      disabled={bulkCreateUsersMutation.isPending}
                    >
                      {bulkCreateUsersMutation.isPending
                        ? "Uploading..."
                        : "Confirm Upload"}
                    </Button>
                  </>
                ) : (
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Enter the details for the new user.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <Input
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser({
                        ...newUser,
                        role: value as Role,
                        agencyId:
                          value === "SUPER_ADMIN" ? "" : newUser.agencyId,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(newUser.role === "AGENCY_ADMIN" ||
                  newUser.role === "STAFF") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Agency
                    </label>
                    <Select
                      value={newUser.agencyId}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, agencyId: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select agency" />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies.map((agency) => (
                          <SelectItem key={agency.id} value={agency.id}>
                            {agency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddUser}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuLabel>Role</DropdownMenuLabel>
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters({ ...filters, role: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Verification Status</DropdownMenuLabel>
            <Select
              value={filters.isVerified}
              onValueChange={(value) =>
                setFilters({ ...filters, isVerified: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="VERIFIED">Verified</SelectItem>
                <SelectItem value="UNVERIFIED">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Agency</DropdownMenuLabel>
            <Select
              value={filters.agencyId}
              onValueChange={(value) =>
                setFilters({ ...filters, agencyId: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select agency" />
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
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedUsers.length === paginatedUsers.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              {/* <TableHead>ID</TableHead> */}
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) =>
                        handleSelectUser(user.id, checked as boolean)
                      }
                      aria-label={`Select ${user.name}`}
                    />
                  </TableCell>
                  {/* <TableCell>{user.id}</TableCell> */}
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {formatRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isVerified ? "default" : "destructive"}
                    >
                      {user.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt, false)}</TableCell>
                  <TableCell>
                    {user.agency?.acronym ? (
                      <HoverCard>
                        <HoverCardTrigger>
                          <Badge variant="outline" className="cursor-help">
                            {user.agency?.acronym}
                          </Badge>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                {user.agency?.logoUrl ? (
                                  <Image
                                    src={user.agency.logoUrl}
                                    alt={`${user.agency.name} logo`}
                                    className="w-full h-full object-cover"
                                    width={32}
                                    height={32}
                                  />
                                ) : (
                                  <div className="text-[10px] font-semibold text-muted-foreground">
                                    {user.agency?.acronym}
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold">
                                  {user.agency?.name}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {user.agency?.acronym}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm">
                              <p className="text-muted-foreground">
                                {user.agency?.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Badge
                                variant={
                                  user.agency?.isActive
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {user.agency?.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {/* <span className="text-muted-foreground">
                              Created {formatDate(user.agency?.createdAt || "", false)}
                            </span> */}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <Badge variant="outline">N/A</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={() =>
                        handleToggleUser(user.id, user.isActive)
                      }
                      disabled={toggleUserMutation.isPending}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to{" "}
          {Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of{" "}
          {filteredUsers.length} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user&apos;s information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                value={userToEdit?.name || ""}
                onChange={(e) =>
                  setUserToEdit((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                value={userToEdit?.email || ""}
                onChange={(e) =>
                  setUserToEdit((prev) =>
                    prev ? { ...prev, email: e.target.value } : null
                  )
                }
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <Select
                value={userToEdit?.role || "STAFF"}
                onValueChange={(value) =>
                  setUserToEdit((prev) =>
                    prev ? { ...prev, role: value as Role } : null
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(userToEdit?.role === "AGENCY_ADMIN" ||
              userToEdit?.role === "STAFF") && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Agency
                </label>
                <Select
                  value={userToEdit?.agencyId || ""}
                  onValueChange={(value) =>
                    setUserToEdit((prev) =>
                      prev ? { ...prev, agencyId: value } : null
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select agency" />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editUserMutation.isPending}
            >
              {editUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserPage;
