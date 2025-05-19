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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/useApi";
import { toast } from "sonner";
import { formatDate, formatRole } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Role } from "@/types/types";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt: string;
  isActive: boolean;
  role: 'STAFF' | 'AGENCY_ADMIN';
}

interface NewUser {
  name: string;
  email: string;
  role: 'STAFF' | 'AGENCY_ADMIN';
  agencyId: string;
}

const UsersPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    email: "",
    role: "STAFF",
    agencyId: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    isVerified: "ALL",
    isActive: "ALL",
    role: "ALL"
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

  // Get agency ID from localStorage
  const getAgencyId = () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedData = JSON.parse(userData);
        return parsedData.agencyId;
      }
    }
    return null;
  };

  // Fetch users by agency
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const agencyId = getAgencyId();
      if (!agencyId) {
        throw new Error("Agency ID not found");
      }
      const response = await getter(`/users/agency/${agencyId}`);
      return response.data;
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: NewUser) => {
      const agencyId = getAgencyId();
      if (!agencyId) {
        throw new Error("Agency ID not found");
      }
      const response = await poster("/users", {
        ...userData,
        agencyId
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await deleter(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to delete user"
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

  const handleAddUser = () => {
    createUserMutation.mutate(newUser);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const handleToggleUser = (userId: string, currentStatus: boolean) => {
    toggleUserMutation.mutate({ userId, isActive: !currentStatus });
  };

  const handleExport = () => {
    const filteredData = filteredUsers.map((user) => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Status: user.isActive ? "Active" : "Inactive",
      "Created At": formatDate(user.createdAt),
    }));

    const csvContent = [
      Object.keys(filteredData[0]).join(","),
      ...filteredData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `users_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVerification =
      filters.isVerified === "ALL" ||
      (filters.isVerified === "VERIFIED" && user.isVerified) ||
      (filters.isVerified === "UNVERIFIED" && !user.isVerified);

    const matchesStatus =
      filters.isActive === "ALL" ||
      (filters.isActive === "ACTIVE" && user.isActive) ||
      (filters.isActive === "INACTIVE" && !user.isActive);

    const matchesRole =
      filters.role === "ALL" ||
      filters.role === user.role;

    return matchesSearch && matchesVerification && matchesStatus && matchesRole;
  });

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
      // Split by newline and filter out empty rows
      const rows = text
        .split("\n")
        .map(row => row.split(",").map(cell => cell.trim()))
        .filter(row => row.length > 0 && row.some(cell => cell !== ""));
      
      if (rows.length === 0) {
        toast.error("No valid data found in the file");
        return;
      }

      const headers = rows[0];
      // Filter out rows that are all empty or have fewer cells than headers
      const dataRows = rows.slice(1).filter(row => 
        row.length === headers.length && 
        row.some(cell => cell !== "")
      );

      setPreviewData({ headers, rows: dataRows });
    };
    reader.readAsText(file);
  };

  const handleConfirmUpload = () => {
    if (!previewData) return;

    const agencyId = getAgencyId();
    if (!agencyId) {
      toast.error("Agency ID not found");
      return;
    }

    // Filter out any rows that don't pass validation
    const validRows = previewData.rows.filter(validateRow);
    
    if (validRows.length === 0) {
      toast.error("No valid rows to upload");
      return;
    }

    const newUsers = validRows.map((row) => ({
      name: row[0],
      email: row[1],
      role: row[2] as Role,
      agencyId
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
    const validRoles = ["STAFF", "AGENCY_ADMIN"] as const;

    return (
      name?.trim() && // Name is not empty
      email?.trim() && // Email is not empty
      emailRegex.test(email) && // Valid email format
      role?.trim() && // Role is not empty
      validRoles.includes(role.trim() as (typeof validRoles)[number]) // Valid role
    );
  };

  return (
    <div className="min-h-fit bg-white border-border border rounded-[16px] p-[16px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
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
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>
                {!previewData ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center ${
                      isDragging ? "border-primary" : "border-muted"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileInput}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer space-y-2"
                    >
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        Drag and drop your CSV file here, or click to browse
                      </div>
                    </label>
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
                  Enter the details of the new user.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name">Name</label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="email">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="role">Role</label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value: 'STAFF' | 'AGENCY_ADMIN') =>
                      setNewUser({ ...newUser, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddUser}>Add User</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 justify-between">
        <div className="relative w-[400px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.role}
            onValueChange={(value) =>
              setFilters({ ...filters, role: value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="STAFF">Staff</SelectItem>
              <SelectItem value="AGENCY_ADMIN">Agency Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.isVerified}
            onValueChange={(value) =>
              setFilters({ ...filters, isVerified: value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Verification Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Verification</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
              <SelectItem value="UNVERIFIED">Unverified</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.isActive}
            onValueChange={(value) =>
              setFilters({ ...filters, isActive: value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedUsers.length === filteredUsers.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Created At</TableHead>
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
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
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
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.role === 'AGENCY_ADMIN' ? 'Agency Admin' : 'Staff'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isVerified ? "default" : "destructive"}
                    >
                      {user.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() =>
                          handleToggleUser(user.id, user.isActive)
                        }
                      />
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
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
                          className="text-destructive"
                          onClick={() => handleDeleteUser(user)}
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
